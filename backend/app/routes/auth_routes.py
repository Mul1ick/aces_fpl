from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app import schemas, crud, auth
from app.database import get_db
from app.auth import create_access_token
from prisma import Prisma
from prisma import models as PrismaModels
from app.auth import get_current_user


router = APIRouter()

@router.post("/signup", response_model=schemas.UserOut)
async def signup(user: schemas.UserCreate, db: Prisma = Depends(get_db)):
    if await crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    u = await crud.create_user(db, user)
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "has_team": False,   # new users have no team yet
        "is_active": bool(u.is_active)
    }

@router.post("/login", response_model=schemas.LoginResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Prisma = Depends(get_db)):
    user = await auth.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token =  auth.create_access_token({"sub": str(user.id), "role": user.role})
    has_team = await crud.user_has_team(db, str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "has_team": has_team,  # 👈
            "is_active": bool(user.is_active)
        },
    }

@router.get("/me", response_model=schemas.UserOut)
async def me(db: Prisma = Depends(get_db), current_user = Depends(get_current_user)):
    has_team = await crud.user_has_team(db, str(current_user.id))
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "has_team": has_team,  # 👈
        "is_active": bool(current_user.is_active)
    }