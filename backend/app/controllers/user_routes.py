from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from prisma import models as PrismaModels

from app.database import get_db
from app import schemas
from app.auth import get_current_user

from app.repositories.gameweek_repo import get_current_gameweek
from app.services.stats_service import get_manager_hub_stats

router = APIRouter()

@router.get("/stats", response_model=schemas.ManagerHubStats)
async def get_user_stats(
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    current_gameweek = await get_current_gameweek(db)
    return await get_manager_hub_stats(
        db,
        user_id=str(current_user.id),
        gameweek_id=current_gameweek.id
    )