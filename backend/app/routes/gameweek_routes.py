from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from prisma import Prisma
from datetime import datetime, timezone
from app.auth import get_current_user
from typing import Optional
from prisma import models as PrismaModels
from app import schemas, crud

router = APIRouter()

@router.get("/gameweek/current")
async def get_current_gameweek(db: Prisma = Depends(get_db)):
    """
    Finds the current gameweek, defined as the one with the soonest
    deadline that is still in the future. Falls back to the most
    recent gameweek if all deadlines have passed.
    """
    now_utc = datetime.now(timezone.utc)
    
    # Find the next gameweek whose deadline has not passed yet
    gameweek = await db.gameweek.find_first(
        where={'deadline': {'gt': now_utc}},
        order={'deadline': 'asc'}
    )

    # If all deadlines have passed, fall back to the most recent one
    if not gameweek:
        gameweek = await db.gameweek.find_first(
            order={'deadline': 'desc'}
        )
    
    # CORRECTED: Fixed the typo here
    if not gameweek:
        raise HTTPException(status_code=404, detail="No gameweek found.")
        
    return gameweek

@router.get("/{gameweek_number}/stats", response_model=schemas.GameweekStatsOut)
@router.get("/stats", response_model=schemas.GameweekStatsOut, include_in_schema=False)
async def get_gameweek_stats(
    gameweek_number: int | None = None,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    gameweek_id: int
    if gameweek_number is None:
        current_gameweek = await crud.get_current_gameweek(db)
        gameweek_id = current_gameweek.id
    else:
        # --- MODIFIED: Find the gameweek by its number to get the ID ---
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail=f"Gameweek {gameweek_number} not found.")
        gameweek_id = gw.id
        
    return await crud.get_gameweek_stats_for_user(
        db,
        user_id=str(current_user.id),
        gameweek_id=gameweek_id
    )

@router.get("/team-of-the-week", response_model=Optional[schemas.TeamOfTheWeekOut]) # You will need to create this schema
async def get_team_of_the_week_route(db: Prisma = Depends(get_db)):
    team_data = await crud.get_team_of_the_week(db)
    
    # If the crud function returns None, team_data will be None.
    # FastAPI handles this automatically because of the Optional response_model.
    return team_data