from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
import logging

logger = logging.getLogger(__name__)

async def get_open_gameweek_for_transfers(db: Prisma):
    """
    Finds the gameweek where the deadline is strictly in the future.
    This is the UPCOMING gameweek that users should be editing/transferring for.
    """
    now_utc = datetime.now(timezone.utc)
    target = await db.gameweek.find_first(
        where={'deadline': {'gt': now_utc}},
        order={'deadline': 'asc'}
    )
    return target

async def determine_active_gameweek(db: Prisma):
    """
    Finds the 'Current' gameweek based purely on the clock.
    In FPL, the current gameweek is always the latest one whose deadline has passed.
    It remains the current gameweek until the exact moment the NEXT deadline passes.
    """
    now_utc = datetime.now(timezone.utc)
    
    # 1. Find the latest gameweek where the deadline has PASSED
    gw = await db.gameweek.find_first(
        where={'deadline': {'lte': now_utc}},
        order={'deadline': 'desc'}
    )
    
    # 2. If no deadlines have passed yet (e.g., pre-season before GW1), get the very first gameweek
    if not gw:
        gw = await db.gameweek.find_first(
            order={'deadline': 'asc'}
        )
        
    return gw

async def get_current_gameweek(db: Prisma):
    """
    Wrapper around determine_active_gameweek that returns the Pydantic schema
    used by the dashboard and points calculations.
    """
    gw = await determine_active_gameweek(db)
    
    if not gw:
        logger.critical("No gameweeks found in database!")
        raise HTTPException(status_code=404, detail="No gameweeks configured in the database.")
        
    now_utc = datetime.now(timezone.utc)
    
    return schemas.Gameweek(
        id=gw.id,
        gw_number=gw.gw_number,
        deadline=gw.deadline,
        name=f"Gameweek {gw.gw_number}",
        finished=gw.status == 'FINISHED',
        is_current=gw.deadline <= now_utc and gw.status != 'FINISHED',
        is_next=gw.deadline > now_utc,
        data_checked=False, 
    )

async def _resolve_gw(db: Prisma, gameweek_id: int | None):
    if gameweek_id is not None:
        gw = await db.gameweek.find_unique(where={'id': gameweek_id})
        if not gw: raise HTTPException(404, "Gameweek not found")
        return gw
    # Defaults to the open GW (for chip validation, transfers, etc.)
    target_gw = await get_open_gameweek_for_transfers(db)
    if not target_gw: raise HTTPException(400, "No open gameweek available.")
    return target_gw

async def get_all_gameweeks_list(db: Prisma):
    return await db.gameweek.find_many(order={'gw_number': 'asc'})

async def get_gameweek_by_number(db: Prisma, gw_number: int):
    return await db.gameweek.find_unique(where={'gw_number': gw_number})
