# app/routes/transfer_routes.py
from fastapi import APIRouter, Depends, Query
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
    payload: schemas.ConfirmTransfersRequest,  # <-- Use the new schema here
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user),
):
    """
    Receives a 'basket' of transfers, validates them against all game
    rules (budget, squad composition, etc.), and commits them in a
    single atomic transaction if valid.
    """
    current_gw = await crud.get_current_gameweek(db)
    if not current_gw:
        raise HTTPException(status_code=404, detail="No active gameweek found.")

    # This function already expects the list of transfers
    return await crud.confirm_transfers(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=current_gw.id,
        transfers=payload.transfers,
    )
