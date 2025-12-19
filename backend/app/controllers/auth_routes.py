import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from prisma import Prisma
from pydantic import BaseModel

from app import schemas, auth
from app.database import get_db

# --- IMPORT REPOS & SERVICES ---
from app.repositories.user_repo import (
    get_user_by_email, 
    create_user, 
    user_has_team,
    create_google_user
)
from app.services.auth_service import verify_google_token_service

# Setup Logger
logger = logging.getLogger(__name__)

router = APIRouter()

class GoogleToken(BaseModel):
    credential: str

@router.post("/signup", response_model=schemas.UserOut)
async def signup(user: schemas.UserCreate, db: Prisma = Depends(get_db)):
    if await get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    u = await create_user(db, user)
    
    return {
        "id": str(u.id),
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "has_team": False,   # new users have no team yet
        "is_active": bool(u.is_active),
        "free_transfers": u.free_transfers,
        "played_first_gameweek": u.played_first_gameweek
    }

@router.post("/login", response_model=schemas.LoginResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Prisma = Depends(get_db)):
    # auth.authenticate_user is a core helper, likely in app/auth.py. 
    # It is fine to keep it there or move to auth_service if you prefer strictly service layer.
    user = await auth.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or pending approval."
        )

    access_token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    has_team = await user_has_team(db, str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "has_team": has_team,
            "is_active": bool(user.is_active),
            "free_transfers": user.free_transfers,
            "played_first_gameweek": user.played_first_gameweek
        },
    }

@router.get("/me", response_model=schemas.UserOut)
async def me(db: Prisma = Depends(get_db), current_user = Depends(auth.get_current_user)):
    has_team = await user_has_team(db, str(current_user.id))
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "has_team": has_team,
        "is_active": bool(current_user.is_active),
        "free_transfers": current_user.free_transfers,
        "played_first_gameweek": current_user.played_first_gameweek
    }

@router.post("/google", response_model=schemas.LoginResponse)
async def auth_with_google(token: GoogleToken, db: Prisma = Depends(get_db)):
    # 1. Verify token via Service
    user_email, user_name = verify_google_token_service(token.credential)

    # 2. Check Repo
    user = await get_user_by_email(db, user_email)

    if not user:
        # 3. Create via Repo if not exists
        user = await create_google_user(db, user_email, user_name)

    # 4. Enforce Inactive Check
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account is inactive or pending approval."
        )
    
    # 5. Generate Token
    access_token = auth.create_access_token({"sub": str(user.id), "role": user.role})
    has_team = await user_has_team(db, str(user.id))

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "has_team": has_team,
            "is_active": bool(user.is_active),
            "free_transfers": user.free_transfers,
            "played_first_gameweek": user.played_first_gameweek
        },
    }