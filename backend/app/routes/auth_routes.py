from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app import schemas, crud, auth
from app.database import get_db
from app.auth import create_access_token
from prisma import Prisma
from prisma import models as PrismaModels

router = APIRouter()

@router.post("/signup", response_model=schemas.UserOut)
async def signup(user: schemas.UserCreate, db: Prisma = Depends(get_db)):
    if await crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user(db, user)

@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Prisma = Depends(get_db)
):
    user = await crud.get_user_by_email(db, form_data.username)
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account pending approval")

    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user  # Return the full user object
    }

@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: PrismaModels.User = Depends(auth.get_current_user)):
    """
    Get current user's profile.
    """
    return current_user

