from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from prisma import Prisma
from prisma import models as PrismaModels

from app.database import get_db
from app.auth import get_current_user
from app import schemas

# --- IMPORT SERVICES & REPOS ---
from app.services.stats_service import get_transfer_stats
from app.services.transfer_service import confirm_transfers
from app.repositories.gameweek_repo import (
    get_current_gameweek, 
    get_open_gameweek_for_transfers
)

router = APIRouter(prefix="/transfers", tags=["transfers"])

@router.get("/stats")
async def transfer_stats_endpoint(
    db: Prisma = Depends(get_db),
    gameweek_id: int | None = Query(default=None)
):
    if gameweek_id is None:
        gw = await get_current_gameweek(db)
        gameweek_id = gw.id

    stats = await get_transfer_stats(db, gameweek_id)
    return {
        "gameweek_id": gameweek_id,
        "most_in": stats["most_in"],
        "most_out": stats["most_out"],
    }

@router.post("/confirm")
async def confirm_transfers_endpoint(
    payload: schemas.ConfirmTransfersRequest,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user),
):
    """
    Confirms transfers for the next UPCOMING gameweek based strictly on the clock.
    """
    target_gw = await get_open_gameweek_for_transfers(db)

    if not target_gw:
        raise HTTPException(status_code=400, detail="There is no gameweek currently open for transfers.")
    
    # Extra security buffer (redundant but safe)
    if target_gw.deadline < datetime.now(timezone.utc):
         raise HTTPException(status_code=400, detail=f"The deadline for Gameweek {target_gw.gw_number} has passed.")

    return await confirm_transfers(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=target_gw.id,
        transfers=payload.transfers,
    )
