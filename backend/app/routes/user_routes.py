from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db  # Import the correct async get_db
from app import crud
from prisma import Prisma

router = APIRouter()

@router.post("/approve/{user_id}")
async def approve_user(user_id: str, db: Prisma = Depends(get_db)): # CORRECT: user_id is a string
    user = await crud.approve_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user.email} approved"}