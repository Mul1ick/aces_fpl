from fastapi import APIRouter, Depends, HTTPException
from app import schemas, crud, auth
from app.database import get_db  # Import the correct async get_db
from app.auth import create_access_token
from prisma import Prisma

router = APIRouter()

@router.post("/signup", response_model=schemas.UserOut)
async def signup(user: schemas.UserCreate, db: Prisma = Depends(get_db)):
    if await crud.get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return await crud.create_user(db, user)

@router.post("/login")
async def login(user: schemas.UserCreate, db: Prisma = Depends(get_db)):
    db_user = await crud.get_user_by_email(db, user.email)
    
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Account pending approval")

    access_token = create_access_token(data={"sub": str(db_user.id)})

    return {"access_token": access_token, "token_type": "bearer"}