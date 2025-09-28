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
    Confirms transfers for the next UPCOMING gameweek.
    """
    # Find the gameweek that is open for transfers
    upcoming_gw = await db.gameweek.find_first(
        where={'status': 'UPCOMING'},
        order={'gw_number': 'asc'}
    )
    if not upcoming_gw:
        raise HTTPException(status_code=400, detail="There is no gameweek currently open for transfers.")
    
    # Also check the deadline as an extra layer of security
    if upcoming_gw.deadline < datetime.now(timezone.utc):
         raise HTTPException(status_code=400, detail=f"The deadline for Gameweek {upcoming_gw.gw_number} has passed.")

    # Call the existing crud function, but pass the upcoming gameweek's ID
    return await crud.confirm_transfers(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=upcoming_gw.id,
        transfers=payload.transfers,
    )