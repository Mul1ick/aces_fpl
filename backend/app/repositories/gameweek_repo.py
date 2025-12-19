from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
import logging

logger = logging.getLogger(__name__)

async def get_current_gameweek(db: Prisma):
    try:
        now_utc = datetime.now(timezone.utc)

        # try next upcoming (future deadline)
        gw = await db.gameweek.find_first(
            where={'deadline': {'gt': now_utc}},
            order={'deadline': 'asc'}
        )
        if not gw:
            # fallback: most recent past
            gw = await db.gameweek.find_first(order={'deadline': 'desc'})
            if not gw:
                logger.critical("No gameweeks found in database!")
                raise HTTPException(status_code=404, detail="No gameweeks configured in the database.")

        # 🔑 build the API schema your frontend expects
        return schemas.Gameweek(
            id=gw.id,
            gw_number=gw.gw_number,
            deadline=gw.deadline,
            name=f"Gameweek {gw.gw_number}",
            finished=gw.deadline < now_utc,
            is_current=gw.deadline > now_utc,  # adjust if you track `is_current` in DB
            is_next=False,                     # adjust if you track `is_next` in DB
            data_checked=False,                # placeholder, update if stored in DB
        )
    except HTTPException:
            raise
    except Exception as e:
        logger.error("Error determining current gameweek", exc_info=True)
        raise e


async def _resolve_gw(db: Prisma, gameweek_id: int | None):
    if gameweek_id is not None:
        gw = await db.gameweek.find_unique(where={'id': gameweek_id})
        if not gw: raise HTTPException(404, "Gameweek not found")
        return gw
    return await get_current_gameweek(db)  # returns schemas.Gameweek

async def get_all_gameweeks_list(db: Prisma):
    return await db.gameweek.find_many(order={'gw_number': 'asc'})

async def get_gameweek_by_number(db: Prisma, gw_number: int):
    return await db.gameweek.find_unique(where={'gw_number': gw_number})

async def determine_active_gameweek(db: Prisma):
    """
    Finds the current gameweek based on status priority:
    1. LIVE
    2. UPCOMING
    3. FINISHED (Last one)
    """
    # 1. LIVE
    gameweek = await db.gameweek.find_first(
        where={'status': 'LIVE'},
        order={'gw_number': 'asc'}
    )
    if gameweek: return gameweek

    # 2. UPCOMING
    gameweek = await db.gameweek.find_first(
        where={'status': 'UPCOMING'},
        order={'gw_number': 'asc'}
    )
    if gameweek: return gameweek

    # 3. FINISHED
    gameweek = await db.gameweek.find_first(
        where={'status': 'FINISHED'},
        order={'gw_number': 'desc'}
    )
    return gameweek

async def get_open_gameweek_for_transfers(db: Prisma):
    """
    Finds the valid gameweek for transfers:
    1. Currently LIVE (e.g., during the week)
    2. Next UPCOMING (e.g., pre-season or between weeks)
    Returns None if neither exists.
    """
    # 1. First, try to find a gameweek that is currently LIVE.
    target = await db.gameweek.find_first(
        where={'status': 'LIVE'},
        order={'gw_number': 'asc'}
    )
    if target: 
        return target

    # 2. If no gameweek is LIVE, find the next UPCOMING one.
    target = await db.gameweek.find_first(
        where={'status': 'UPCOMING'},
        order={'gw_number': 'asc'}
    )
    return target