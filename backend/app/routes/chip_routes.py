from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from app.database import get_db
from app import auth, crud, schemas

router = APIRouter(prefix="/chips", tags=["Chips"], dependencies=[Depends(auth.get_current_user)])

@router.get("/status", response_model=schemas.ChipStatus)
async def chip_status(gameweek_id: int | None = None, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    gw = await crud._resolve_gw(db, gameweek_id)
    return await crud.get_chip_status(db, str(user.id), gw.id)

@router.post("/play")
async def play(req: schemas.PlayChipRequest, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    gw = await crud._resolve_gw(db, req.gameweek_id)
    return await crud.play_chip(db, str(user.id), req.chip, gw.id)

@router.delete("/cancel")
async def cancel(gameweek_id: int | None = None, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    return await crud.cancel_chip(db, str(user.id), gameweek_id)