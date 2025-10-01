# app/routes/transfer_routes.py
from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import datetime, timezone # Make sure this import is at the top
from prisma import Prisma
from app.database import get_db
from app.crud import get_current_gameweek, get_transfer_stats
from app.auth import get_current_user
from prisma import models as PrismaModels
from app import schemas, crud

router = APIRouter(prefix="/transfers", tags=["transfers"])

@router.get("/stats")
async def transfer_stats(
    db: Prisma = Depends(get_db),
    gameweek_id: int | None = Query(default=None)
):
    # default to current GW if not provided
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
async def confirm_transfers(
    payload: schemas.ConfirmTransfersRequest,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user),
):
    """
    Confirms transfers for the current LIVE or next UPCOMING gameweek.
    """
    # --- MODIFIED LOGIC START ---

    # 1. First, try to find a gameweek that is currently LIVE.
    target_gw = await db.gameweek.find_first(
        where={'status': 'LIVE'},
        order={'gw_number': 'asc'}
    )

    # 2. If no gameweek is LIVE (e.g., pre-season), find the next UPCOMING one.
    if not target_gw:
        target_gw = await db.gameweek.find_first(
            where={'status': 'UPCOMING'},
            order={'gw_number': 'asc'}
        )

    # 3. If no LIVE or UPCOMING gameweek is found, then it's an error.
    if not target_gw:
        raise HTTPException(status_code=400, detail="There is no gameweek currently open for transfers.")

    # --- MODIFIED LOGIC END ---

    # Check the deadline as a layer of security
    if target_gw.deadline < datetime.now(timezone.utc):
         raise HTTPException(status_code=400, detail=f"The deadline for Gameweek {target_gw.gw_number} has passed.")

    # Call the crud function with the correctly identified gameweek's ID
    return await crud.confirm_transfers(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=target_gw.id,
        transfers=payload.transfers,
    )