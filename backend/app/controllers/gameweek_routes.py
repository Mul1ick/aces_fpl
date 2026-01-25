from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from prisma import Prisma
from prisma import models as PrismaModels
from app.services.stats_service import calculate_dream_team
from app.services.stats_service import calculate_team_of_the_season # Add import


from app.database import get_db
from app import schemas, auth

# --- IMPORT SERVICES & REPOS ---
from app.repositories.gameweek_repo import (
    get_all_gameweeks_list,
    get_gameweek_by_number,
    get_current_gameweek
)
from app.services.gameweek_service import get_current_gameweek_with_stats
from app.services.stats_service import (
    get_gameweek_stats_for_user,
    get_team_of_the_week
)

router = APIRouter()

@router.get("/")
async def get_all_gameweeks(db: Prisma = Depends(get_db)):
    """
    Returns a list of all gameweeks, sorted by their number.
    """
    return await get_all_gameweeks_list(db)

@router.get("/gameweek/current")
async def get_current_gameweek_endpoint(db: Prisma = Depends(get_db)):
    """
    Finds the current gameweek based on its status and returns detailed stats.
    """
    return await get_current_gameweek_with_stats(db)

@router.get("/{gameweek_number}/stats", response_model=schemas.GameweekStatsOut)
@router.get("/stats", response_model=schemas.GameweekStatsOut, include_in_schema=False)
async def get_gameweek_stats(
    gameweek_number: int | None = None,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(auth.get_current_user)
):
    gameweek_id: int
    if gameweek_number is None:
        # Use the simple repo function from crud import
        current_gameweek = await get_current_gameweek(db)
        gameweek_id = current_gameweek.id
    else:
        gw = await get_gameweek_by_number(db, gameweek_number)
        if not gw:
            raise HTTPException(status_code=404, detail=f"Gameweek {gameweek_number} not found.")
        gameweek_id = gw.id
        
    return await get_gameweek_stats_for_user(
        db,
        user_id=str(current_user.id),
        gameweek_id=gameweek_id
    )

@router.get("/team-of-the-week", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_latest_team_of_the_week(db: Prisma = Depends(get_db)):
    """
    Gets the Team of the Week for the last completed gameweek.
    """
    team_data = await get_team_of_the_week(db)
    if not team_data:
        raise HTTPException(status_code=404, detail="Team of the Week not available.")
    return team_data

@router.get("/team-of-the-week/{gameweek_number}", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_team_of_the_week_for_gameweek(gameweek_number: int, db: Prisma = Depends(get_db)):
    """
    Gets the Team of the Week for a specific gameweek number.
    """
    team_data = await get_team_of_the_week(db, gameweek_number=gameweek_number)
    if not team_data:
        raise HTTPException(
            status_code=404,
            detail=f"Team of the Week for gameweek {gameweek_number} not found or not yet calculated."
        )
    return team_data

@router.get("/dream-team/{gameweek_number}", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_dream_team_endpoint(gameweek_number: int, db: Prisma = Depends(get_db)):
    """
    Calculates and returns the hypothetical best team for a specific gameweek.
    """
    gw = await get_gameweek_by_number(db, gameweek_number)
    if not gw:
        raise HTTPException(status_code=404, detail="Gameweek not found")
    
    dt = await calculate_dream_team(db, gw.id)
    if not dt:
        raise HTTPException(status_code=404, detail="Stats not available to generate Dream Team")
        
    return dt

@router.get("/team-of-the-season", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_tots_endpoint(db: Prisma = Depends(get_db)):
    """
    Calculates the best possible team based on total season points.
    """
    return await calculate_team_of_the_season(db)