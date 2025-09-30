from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from app.database import get_db
from app import auth, crud, schemas
from prisma import models as PrismaModels

router = APIRouter(prefix="/chips", tags=["Chips"], dependencies=[Depends(auth.get_current_user)])

@router.get("/status", response_model=schemas.ChipStatus)
async def chip_status(
    gameweek_number: int | None = Query(default=None, alias="gameweek_id"), 
    db: Prisma = Depends(get_db), 
    user=Depends(auth.get_current_user)
):
    """
    Gets the chip status for a user for a given gameweek number.
    If no gameweek number is provided, it defaults to the current gameweek.
    """
    gw: PrismaModels.Gameweek
    if gameweek_number:
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail="Gameweek not found")
    else:
        gw = await crud.get_current_gameweek(db)
        if not gw:
            raise HTTPException(status_code=404, detail="Current gameweek not found")

    return await crud.get_chip_status(db, str(user.id), gw.id)


@router.post("/play")
async def play(req: schemas.PlayChipRequest, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    # Resolving gameweek by ID here remains correct as per schema
    gw_id = req.gameweek_id
    if not gw_id:
        current_gw = await crud.get_current_gameweek(db)
        if not current_gw:
            raise HTTPException(status_code=404, detail="No active gameweek to play a chip.")
        gw_id = current_gw.id
        
    return await crud.play_chip(db, str(user.id), req.chip, gw_id)

@router.delete("/cancel")
async def cancel(gameweek_id: int | None = None, db: Prisma = Depends(get_db), user=Depends(auth.get_current_user)):
    # This route correctly uses the gameweek_id (PK)
    return await crud.cancel_chip(db, str(user.id), gameweek_id)
