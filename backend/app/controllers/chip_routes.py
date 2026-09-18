from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from prisma import models as PrismaModels

from app.database import get_db
from app import auth, schemas

from app.repositories.gameweek_repo import get_open_gameweek_for_transfers
from app.services.chip_service import get_chip_status, play_chip, cancel_chip

router = APIRouter(prefix="/chips", tags=["Chips"], dependencies=[Depends(auth.get_current_user)])

@router.get("/status", response_model=schemas.ChipStatus)
async def chip_status(
    gameweek_number: int | None = Query(default=None, alias="gameweek_id"), 
    db: Prisma = Depends(get_db), 
    user=Depends(auth.get_current_user)
):
    gw = None
    if gameweek_number:
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail="Gameweek not found")
    else:
        # If no explicit GW is requested, fetch the open one that the user would be playing a chip for
        gw = await get_open_gameweek_for_transfers(db)
        if not gw:
            raise HTTPException(status_code=404, detail="No open gameweek found")

    return await get_chip_status(db, str(user.id), gw.id)


@router.post("/play")
async def play(req: schemas.PlayChipRequest, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    gw_id = req.gameweek_id
    if not gw_id:
        target_gw = await get_open_gameweek_for_transfers(db)
        if not target_gw:
            raise HTTPException(status_code=404, detail="No active gameweek open to play a chip.")
        gw_id = target_gw.id
        
    return await play_chip(db, str(user.id), req.chip, gw_id)

@router.delete("/cancel")
async def cancel(gameweek_id: int | None = None, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    return await cancel_chip(db, str(user.id), gameweek_id)
