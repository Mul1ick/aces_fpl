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

@router.get("/team-of-the-week", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_latest_team_of_the_week(db: Prisma = Depends(get_db)):
    """
    Gets the Team of the Week for the last completed gameweek.
    """
    team_data = await crud.get_team_of_the_week(db)
    if not team_data:
        raise HTTPException(status_code=404, detail="Team of the Week not available.")
    return team_data

# ✅ ADD THIS: Route for TeamView (gets a specific TOTW by number)
@router.get("/team-of-the-week/{gameweek_number}", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_team_of_the_week_for_gameweek(gameweek_number: int, db: Prisma = Depends(get_db)):
    """
    Gets the Team of the Week for a specific gameweek number.
    """
    team_data = await crud.get_team_of_the_week(db, gameweek_number=gameweek_number)
    if not team_data:
        raise HTTPException(
            status_code=404,
            detail=f"Team of the Week for gameweek {gameweek_number} not found or not yet calculated."
        )
    return team_data