# app/routes/transfer_routes.py
from fastapi import APIRouter, Depends, Query
from prisma import Prisma
from app.database import get_db
from app.crud import get_current_gameweek, get_transfer_stats

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