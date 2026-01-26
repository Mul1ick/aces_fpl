import logging
from prisma import Prisma
from datetime import datetime, timezone
from fastapi import HTTPException

alog = logging.getLogger("aces.admin_tasks")

async def perform_gameweek_rollover_tasks(db: Prisma, live_gw_id: int):
    """
    Handles all tasks required when a gameweek is finalized and rolls over to the next.
    - Copies every user's team from the live gameweek to the next one.
    - Resets/adds free transfers for every user.
    - Sets a flag for users who have completed Gameweek 1.
    """
    alog.info(f"--- Starting Gameweek Rollover for GW ID: {live_gw_id} ---")

    live_gw = await db.gameweek.find_unique(where={'id': live_gw_id})
    if not live_gw:
        alog.error(f"Rollover failed: Could not find live_gw with id {live_gw_id}")
        return

    # 1. Find the next gameweek
    next_gw = await db.gameweek.find_first(
        where={'gw_number': live_gw.gw_number + 1}
    )
    if not next_gw:
        alog.warning("End of season: No next gameweek found. Rollover tasks skipped.")
        return

    alog.info(f"Transitioning from GW {live_gw.gw_number} to GW {next_gw.gw_number}")

    # 2. Get all active users with a fantasy team
    active_users = await db.user.find_many(where={'is_active': True, 'fantasy_team': {'is_not': None}})
    if not active_users:
        alog.info("No active users with teams to roll over.")
        return
        
    alog.info(f"Found {len(active_users)} active users with teams to process.")

    # 3. For each user, copy their team from the live GW to the next GW
    for user in active_users:
        user_team_for_live_gw = await db.userteam.find_many(
            where={'user_id': user.id, 'gameweek_id': live_gw.id}
        )
        
        if not user_team_for_live_gw:
            alog.warning(f"User {user.email} (ID: {user.id}) had no team in GW {live_gw.gw_number} to copy.")
            continue

        new_team_data = [
            {
                "user_id": user.id,
                "gameweek_id": next_gw.id,
                "player_id": p.player_id,
                "is_captain": p.is_captain,
                "is_vice_captain": p.is_vice_captain,
                "is_benched": p.is_benched
            } for p in user_team_for_live_gw
        ]

        # Use create_many for efficiency
        await db.userteam.create_many(data=new_team_data, skip_duplicates=True)
        alog.info(f"Copied team for user {user.email} to GW {next_gw.gw_number}.")

    # 4. Set 'played_first_gameweek' flag for users after GW1 is finalized
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
            alog.info(f"Set 'played_first_gameweek' flag for {len(user_ids_in_gw1)} users after GW1.")

    # 5. Update free transfers for all active users who have started playing
    await db.user.update_many(
        where={
            'is_active': True, 
            'played_first_gameweek': True
        },
        data={'free_transfers': 2}
    )
    alog.info(f"Reset free transfers to 2 for all active players.")

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
    # Note: alog was used in routes, we use logger here
    # Reuse the rollover logic we already moved
    from app.services.admin_task_service import perform_gameweek_rollover_tasks

    try:
        live_gw = await db.gameweek.find_first(where={'status': 'LIVE'})
        if not live_gw or live_gw.id != gameweek_id:
            raise HTTPException(status_code=400, detail="Incorrect or no live gameweek to finalize.")
        
        upcoming_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
        
        # Call the rollover
        await perform_gameweek_rollover_tasks(db, live_gw.id)
        
        async with db.tx() as transaction:
            await transaction.gameweek.update(where={'id': live_gw.id}, data={'status': 'FINISHED'})
            if upcoming_gw:
                await transaction.gameweek.update(where={'id': upcoming_gw.id}, data={'status': 'LIVE'})

        return live_gw, upcoming_gw
    except HTTPException:
        raise
    except Exception as e:
        # alog.error logic replaced by throwing up
        raise HTTPException(status_code=500, detail=str(e))