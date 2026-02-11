from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
from app.repositories.gameweek_repo import _resolve_gw
import logging

logger = logging.getLogger("aces.chips")

async def is_triple_captain_active(db: Prisma, user_id: str, gameweek_id: int) -> bool:
    row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'chip': 'TRIPLE_CAPTAIN'}
    )
    return row is not None

async def is_wildcard_active(db: Prisma, user_id: str, gameweek_id: int) -> bool:
    row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'chip': 'WILDCARD'}
    )
    return row is not None

async def is_bench_boost_active(db: Prisma, user_id: str, gameweek_id: int) -> bool:
    row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'chip': 'BENCH_BOOST'}
    )
    return row is not None

async def get_chip_status(db: Prisma, user_id: str, gameweek_id: int) -> schemas.ChipStatus:
    # active for this GW
    active = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )
    # any chips already used this season
    used_rows = await db.userchip.find_many(where={'user_id': user_id})
    return schemas.ChipStatus(
        active=active.chip if active else None,
        used=[r.chip for r in used_rows]
    )

async def play_chip(db: Prisma, user_id: str, chip: str, gameweek_id: int | None):
    gw = await _resolve_gw(db, gameweek_id)
    # block after deadline
    now_utc = datetime.now(timezone.utc)
    if gw.deadline < now_utc:
        raise HTTPException(400, "Deadline passed for this gameweek.")

    # enforce single chip per GW and one-time use per chip
    existing_gw = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gw.id}
    )
    if existing_gw:
        raise HTTPException(400, "A chip is already active this Gameweek.")

    already_used = await db.userchip.find_first(
        where={'user_id': user_id, 'chip': chip}
    )
    if already_used:
        raise HTTPException(400, f"{chip} already used this season.")

    async with db.tx() as tx:
        # 1. Create the chip record
        new_chip = await tx.userchip.create(data={
            'user_id': user_id,
            'gameweek_id': gw.id,
            'chip': chip
        })

        # 2. Reset transfer hits if it's a Wildcard or Free Hit
        if chip in ["WILDCARD", "FREE_HIT"]:
            await tx.usergameweekscore.upsert(
                where={
                    'user_id_gameweek_id': {
                        'user_id': user_id, 
                        'gameweek_id': gw.id
                    }
                },
                data={
                    'create': {
                        'user_id': user_id, 
                        'gameweek_id': gw.id, 
                        'transfer_hits': 0
                    },
                    'update': {
                        'transfer_hits': 0
                    }
                }
            )
            logger.info(f"User {user_id} activated {chip}. Transfer hits reset to 0.")

        return new_chip


async def cancel_chip(db: Prisma, user_id: str, gameweek_id: int | None):
    """
    Attempts to cancel a played chip. 
    UPDATED: Now enforces that NO chips can be cancelled once played.
    """
    gw = await _resolve_gw(db, gameweek_id)
    
    # 1. Find the active chip for the gameweek
    active_chip = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gw.id}
    )

    # 2. If no chip is active, there's nothing to do
    if not active_chip:
        return {"ok": True, "message": "No active chip to cancel."}

    # 3. STRICT RULE: Chips cannot be cancelled once played
    raise HTTPException(
        status_code=400, 
        detail=f"The {active_chip.chip} chip cannot be cancelled once activated."
    )

async def is_bench_boost_active(db: Prisma, user_id: str, gameweek_id: int) -> bool:
    row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'chip': 'BENCH_BOOST'}
    )
    return row is not None