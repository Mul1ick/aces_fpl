import logging
from prisma import Prisma
from datetime import datetime, timezone
from fastapi import HTTPException

alog = logging.getLogger("aces.admin_tasks")

async def perform_gameweek_rollover_tasks(db: Prisma, live_gw_id: int):
    alog.info(f"--- Starting Gameweek Rollover for GW ID: {live_gw_id} ---")

    live_gw = await db.gameweek.find_unique(where={'id': live_gw_id})
    if not live_gw:
        alog.error(f"Rollover failed: Could not find live_gw with id {live_gw_id}")
        return

    next_gw = await db.gameweek.find_first(
        where={'gw_number': live_gw.gw_number + 1}
    )
    if not next_gw:
        alog.warning("End of season: No next gameweek found. Rollover tasks skipped.")
        return

    active_users = await db.user.find_many(where={'is_active': True, 'fantasy_team': {'is_not': None}})
    if not active_users:
        alog.info("No active users with teams to roll over.")
        return
        
    for user in active_users:
        # 1. Determine if Free Hit was active in the GW that just finished
        free_hit_active = await db.userchip.find_first(
            where={
                'user_id': user.id, 
                'gameweek_id': live_gw_id, 
                'chip': 'FREE_HIT'
            }
        )

        source_gw_id = live_gw_id

        if free_hit_active:
            # 2. Revert logic: Find the team state BEFORE the Free Hit week
            prev_entry = await db.userteam.find_first(
                where={
                    'user_id': user.id, 
                    'gameweek_id': {'lt': live_gw_id}
                },
                order={'gameweek_id': 'desc'}
            )
            
            if prev_entry:
                source_gw_id = prev_entry.gameweek_id
                alog.info(f"Free Hit detected for {user.email}. Reverting to team from GW ID {source_gw_id}.")
            else:
                alog.warning(f"User {user.email} used Free Hit but no previous team found. Defaulting to live GW.")

        # 3. Fetch the team from our determined source
        user_team_to_copy = await db.userteam.find_many(
            where={'user_id': user.id, 'gameweek_id': source_gw_id}
        )
        
        if not user_team_to_copy:
            continue

        # --- ADD THIS CLEANUP STEP ---
        # Clear out any "temporary" or accidental data in the next GW 
        # to ensure the revert is clean.
        await db.userteam.delete_many(
            where={
                'user_id': user.id,
                'gameweek_id': next_gw.id
            }
        )

        # 4. Prepare data for the NEXT gameweek
        new_team_data = [
            {
                "user_id": user.id,
                "gameweek_id": next_gw.id,
                "player_id": p.player_id,
                "is_captain": p.is_captain,
                "is_vice_captain": p.is_vice_captain,
                "is_benched": p.is_benched
            } for p in user_team_to_copy
        ]

        # 5. Atomic copy (removed the redundant duplicate block)
        await db.userteam.create_many(data=new_team_data, skip_duplicates=True)
        alog.info(f"Copied team for user {user.email} to GW {next_gw.gw_number}.")

    # --- Keep existing steps 4 and 5 (flags and transfer resets) ---
    if live_gw.gw_number == 1:
        user_ids_in_gw1 = [
            ut.user_id for ut in await db.userteam.find_many(
                where={'gameweek_id': live_gw.id},
                distinct=['user_id']
            )
        ]
        if user_ids_in_gw1:
            await db.user.update_many(
                where={'id': {'in': user_ids_in_gw1}},
                data={'played_first_gameweek': True}
            )

    await db.user.update_many(
        where={'is_active': True, 'played_first_gameweek': True},
        data={'free_transfers': 2}
    )
    alog.info(f"--- Gameweek Rollover for GW ID: {live_gw_id} Completed ---")


async def start_season_logic(db: Prisma):
    live_or_finished_gw = await db.gameweek.find_first(where={'status': {'in': ['LIVE', 'FINISHED']}})
    if live_or_finished_gw:
        raise HTTPException(status_code=400, detail="The season has already started.")
    
    first_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
    if not first_gw:
        raise HTTPException(status_code=404, detail="No upcoming gameweeks to start.")
    
    if first_gw.deadline > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail=f"Deadline for GW {first_gw.gw_number} has not passed.")
    
    await db.gameweek.update(where={'id': first_gw.id}, data={'status': 'LIVE'})
    return first_gw

async def finalize_gameweek_logic(db: Prisma, gameweek_id: int):
    # REMOVED: perform_gameweek_rollover_tasks(db, live_gw.id)
    # The Controller now handles the specific order of rollover -> autosub -> finalize status
    
    try:
        live_gw = await db.gameweek.find_first(where={'status': 'LIVE'})
        if not live_gw or live_gw.id != gameweek_id:
            raise HTTPException(status_code=400, detail="Incorrect or no live gameweek to finalize.")
        
        upcoming_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
        
        async with db.tx() as transaction:
            await transaction.gameweek.update(where={'id': live_gw.id}, data={'status': 'FINISHED'})
            if upcoming_gw:
                await transaction.gameweek.update(where={'id': upcoming_gw.id}, data={'status': 'LIVE'})

        return live_gw, upcoming_gw
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

async def process_player_reinstatements(db: Prisma, next_gameweek_id: int):
    """
    Scans for players whose injury/suspension period has ended and makes them available.
    This is a self-contained task run during gameweek finalization.
    """
    alog.info(f"--- Processing Player Reinstatements for upcoming GW ID: {next_gameweek_id} ---")

    # 1. Get the deadline of the upcoming gameweek to use as a reference point.
    next_gw = await db.gameweek.find_unique(where={'id': next_gameweek_id})
    if not next_gw:
        alog.error(f"Reinstatement failed: Could not find next_gw with id {next_gameweek_id}")
        return

    # 2. Find all players who are currently unavailable but should now be active.
    players_to_reinstate = await db.player.find_many(
        where={
            'status': {'not': 'ACTIVE'},
            'return_date': {
                'not': None,  # Must have a return date set
                'lt': next_gw.deadline  # The return date must be strictly BEFORE the next deadline
            }
        }
    )

    if not players_to_reinstate:
        alog.info("No players needed reinstatement for the upcoming gameweek.")
        return

    player_ids = [p.id for p in players_to_reinstate]
    
    # 3. Perform a bulk update to reset their status.
    await db.player.update_many(
        where={'id': {'in': player_ids}},
        data={
            'status': 'ACTIVE',
            'news': None,
            'chance_of_playing': None, # Null implies 100%
            'return_date': None
        }
    )
    
    alog.info(f"Successfully reinstated {len(player_ids)} players for GW {next_gw.gw_number}.")    