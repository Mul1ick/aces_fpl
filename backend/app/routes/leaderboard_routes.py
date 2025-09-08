from fastapi import APIRouter, Depends
from app.database import get_db
from app import crud, schemas
from prisma import Prisma

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/", response_model=list[schemas.LeaderboardEntry])
async def get_leaderboard_data(db: Prisma = Depends(get_db)):
    return await crud.get_leaderboard(db)