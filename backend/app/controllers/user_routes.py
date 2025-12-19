from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from prisma import models as PrismaModels

from app.database import get_db
from app import schemas
from app.auth import get_current_user

# --- IMPORT SERVICES & REPOS ---
from app.repositories.user_repo import approve_user
from app.repositories.gameweek_repo import get_current_gameweek
from app.services.stats_service import get_manager_hub_stats

router = APIRouter()

@router.post("/approve/{user_id}")
async def approve_user_endpoint(user_id: str, db: Prisma = Depends(get_db)): # CORRECT: user_id is a string
    # Using the repo function directly
    user = await approve_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user.email} approved"}

@router.get("/stats", response_model=schemas.ManagerHubStats)
async def get_user_stats(
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    # Get current gameweek from repo
    current_gameweek = await get_current_gameweek(db)
    
    # Get stats from service
    return await get_manager_hub_stats(
        db,
        user_id=str(current_user.id),
        gameweek_id=current_gameweek.id
    )