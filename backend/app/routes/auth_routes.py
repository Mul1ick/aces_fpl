from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app import schemas, crud, auth
from app.database import get_db
from app.auth import create_access_token
from prisma import Prisma
from prisma import models as PrismaModels
from app.auth import get_current_user
import os
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests



router = APIRouter()
class GoogleToken(BaseModel):
    credential: str


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
        "is_active": bool(u.is_active),
        "free_transfers": u.free_transfers, # <-- ADD THIS
        "played_first_gameweek": u.played_first_gameweek # <-- ADD THIS
        
    }

@router.post("/login", response_model=schemas.LoginResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Prisma = Depends(get_db)):
    user = await auth.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, # Correct status for this case
            detail="Account is inactive or pending approval."
        )

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
            "is_active": bool(user.is_active),
            "free_transfers": user.free_transfers, # <-- ADD THIS
        "played_first_gameweek": user.played_first_gameweek # <-- ADD THIS
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
        "is_active": bool(current_user.is_active),
        "free_transfers": current_user.free_transfers, # <-- ADD THIS
        "played_first_gameweek": current_user.played_first_gameweek # <-- ADD THIS
    }

# backend/app/routes/auth_routes.py

@router.post("/google", response_model=schemas.LoginResponse)
async def auth_with_google(token: GoogleToken, db: Prisma = Depends(get_db)):
    try:
        id_info = id_token.verify_oauth2_token(
            token.credential, requests.Request(), os.getenv("GOOGLE_CLIENT_ID")
        )
        user_email = id_info.get("email")
        user_name = id_info.get("name")

        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token.",
            )

        user = await db.user.find_unique(where={"email": user_email})

        if not user:
            # If user doesn't exist, create them as INACTIVE.
            user = await db.user.create(
                data={
                    "email": user_email,
                    "full_name": user_name,
                    "hashed_password": "",
                    "is_active": False, # User is created as pending
                    "role": "user",
                }
            )

        # Now, check the user's status (whether they are new or existing)
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, # Send the 403 status
                detail="Account is inactive or pending approval."
            )
        
        # If the user is active, proceed with login
        access_token = auth.create_access_token({"sub": str(user.id), "role": user.role})
        has_team = await crud.user_has_team(db, str(user.id))

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

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token."
        )
    except HTTPException as e:
        if e.status_code == status.HTTP_403_FORBIDDEN:
            raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}",
        )