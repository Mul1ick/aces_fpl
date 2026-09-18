import logging
from prisma import Prisma
from datetime import datetime, timezone
from fastapi import HTTPException

alog = logging.getLogger("aces.admin_tasks")

async def perform_gameweek_rollover_tasks(db: Prisma, live_gw_id: int):
    """
    Cleans up after a gameweek is finalized.
    Because team rollovers are handled automatically via time-checks and 
    Free Hit logic is baked directly into `carry_forward_team()`, 
    this function strictly handles global state updates like 
    first-time player tracking and free transfer resets.
    """
    alog.info(f"--- Starting Gameweek Post-Processing for GW ID: {live_gw_id} ---")

    live_gw = await db.gameweek.find_unique(where={'id': live_gw_id})
    if not live_gw:
        alog.error(f"Post-processing failed: Could not find live_gw with id {live_gw_id}")
        return

    # 1. Update first GW flags (Checks who participated in GW1)
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

    # 2. Give everyone 2 free transfers for the new week
    # (Note: In Aces FPL, free transfers reset to 2 every gameweek instead of rolling over to 5)
    await db.user.update_many(
        where={'is_active': True, 'played_first_gameweek': True},
        data={'free_transfers': 2}
    )
    
    alog.info(f"--- Gameweek Post-Processing for GW ID: {live_gw_id} Completed ---")


async def start_season_logic(db: Prisma):
    # This button now acts as a manual status overrider for the admin panel UI
    live_or_finished_gw = await db.gameweek.find_first(where={'status': {'in': ['LIVE', 'FINISHED']}})
    if live_or_finished_gw:
        raise HTTPException(status_code=400, detail="The season has already started.")
    
    first_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
    if not first_gw:
        raise HTTPException(status_code=404, detail="No upcoming gameweeks to start.")
    
    await db.gameweek.update(where={'id': first_gw.id}, data={'status': 'LIVE'})
    return first_gw

async def finalize_gameweek_logic(db: Prisma, gameweek_id: int):
    try:
        live_gw = await db.gameweek.find_unique(where={'id': gameweek_id})
        if not live_gw:
            raise HTTPException(status_code=404, detail="Gameweek not found.")
        
        upcoming_gw = await db.gameweek.find_first(where={'gw_number': live_gw.gw_number + 1})
        
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
    alog.info(f"--- Processing Player Reinstatements for upcoming GW ID: {next_gameweek_id} ---")

    next_gw = await db.gameweek.find_unique(where={'id': next_gameweek_id})
    if not next_gw:
        alog.error(f"Reinstatement failed: Could not find next_gw with id {next_gameweek_id}")
        return

    players_to_reinstate = await db.player.find_many(
        where={
            'status': {'not': 'ACTIVE'},
            'return_date': {
                'not': None, 
                'lt': next_gw.deadline 
            }
        }
    )

    if not players_to_reinstate:
        alog.info("No players needed reinstatement for the upcoming gameweek.")
        return

    player_ids = [p.id for p in players_to_reinstate]
    
    await db.player.update_many(
        where={'id': {'in': player_ids}},
        data={
            'status': 'ACTIVE',
            'news': None,
            'chance_of_playing': None, 
            'return_date': None
        }
    )
    
    alog.info(f"Successfully reinstated {len(player_ids)} players for GW {next_gw.gw_number}.")    
