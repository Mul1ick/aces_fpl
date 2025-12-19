from fastapi import APIRouter, Depends
from prisma import Prisma
from app.database import get_db
from app import schemas

# --- IMPORT SERVICE ---
from app.services.stats_service import get_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/", response_model=list[schemas.LeaderboardEntry])
async def get_leaderboard_data(db: Prisma = Depends(get_db)):
    return await get_leaderboard(db)