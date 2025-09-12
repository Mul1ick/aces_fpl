from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db  # Import the correct async get_db
from app import crud
from prisma import Prisma
from app import schemas
from prisma import models as PrismaModels
from app.auth import get_current_user

router = APIRouter()

@router.post("/approve/{user_id}")
async def approve_user(user_id: str, db: Prisma = Depends(get_db)): # CORRECT: user_id is a string
    user = await crud.approve_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user.email} approved"}

@router.get("/stats", response_model=schemas.ManagerHubStats)
async def get_user_stats(
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    current_gameweek = await crud.get_current_gameweek(db)
    return await crud.get_manager_hub_stats(
        db,
        user_id=str(current_user.id),
        gameweek_id=current_gameweek.id
    )