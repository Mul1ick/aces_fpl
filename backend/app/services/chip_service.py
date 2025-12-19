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

    return await db.userchip.create(data={
        'user_id': user_id,
        'gameweek_id': gw.id,
        'chip': chip
    })


async def cancel_chip(db: Prisma, user_id: str, gameweek_id: int | None):
    gw = await _resolve_gw(db, gameweek_id)
    now_utc = datetime.now(timezone.utc)
    if gw.deadline < now_utc:
        raise HTTPException(400, "Cannot cancel after deadline.")

    # 1. Find the active chip for the gameweek
    active_chip = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gw.id}
    )

    # 2. If no chip is active, there's nothing to do
    if not active_chip:
        return {"ok": True, "message": "No active chip to cancel."}

    # 3. If the active chip is a Wildcard, raise an error
    if active_chip.chip == "WILDCARD":
        raise HTTPException(status_code=400, detail="A played Wildcard cannot be cancelled.")

    # 4. If it's another type of chip, proceed with deletion
    await db.userchip.delete_many(where={'user_id': user_id, 'gameweek_id': gw.id})
    return {"ok": True}