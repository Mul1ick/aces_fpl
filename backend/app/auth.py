import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from prisma import Prisma
from prisma import models as PrismaModels

from app.database import get_db

# --- IMPORT REPOS (No more crud!) ---
from app.repositories.user_repo import get_user_by_id, get_user_by_email

# ----------------- LOAD ENV ------------------
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "a_super_secret_key_for_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # Token valid for 1 day

# ----------------- PASSWORD HASHING ------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# ----------------- JWT SETUP ------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ----------------- GET CURRENT USER DEPENDENCY ------------------
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Prisma = Depends(get_db)
) -> PrismaModels.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # REFACTORED: Use Repo directly
    user = await get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception

    return user


# --- NEW --- Admin Security Dependency
async def get_current_admin_user(current_user: PrismaModels.User = Depends(get_current_user)) -> PrismaModels.User:
    """
    A dependency that builds on get_current_user but also checks
    if the user has the 'admin' role. This will be used to protect all admin routes.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have adequate permissions"
        )
    return current_user

# ----------------- AUTHENTICATE USER ------------------
async def authenticate_user(db: Prisma, email: str, password: str):
    """
    Return the user if credentials are valid, else None.
    """
    # REFACTORED: Use Repo directly
    user = await get_user_by_email(db, email)
    if not user:
        return None

    # Check for password hash (Prisma default field is usually 'hashed_password')
    hashed = getattr(user, "hashed_password", None)
    
    # Fallback if you used 'password_hash' in older migrations
    if not hashed:
        hashed = getattr(user, "password_hash", None)

    if not hashed:
        return None

    if not verify_password(password, hashed):
        return None

    return user