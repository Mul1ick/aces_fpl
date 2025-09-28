from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from prisma import Prisma
from datetime import datetime, timezone
from app.auth import get_current_user
from typing import Optional
from prisma import models as PrismaModels
from app import schemas, crud

router = APIRouter()

# --- ADDED: New endpoint to get all gameweeks ---
@router.get("/")
async def get_all_gameweeks(db: Prisma = Depends(get_db)):
    """
    Returns a list of all gameweeks, sorted by their number.
    """
    return await db.gameweek.find_many(order={'gw_number': 'asc'})

@router.get("/gameweek/current")
async def get_current_gameweek(db: Prisma = Depends(get_db)):
    """
    Finds the current gameweek based on its status.
    Priority: LIVE > UPCOMING > Last FINISHED.
    """
    # 1. Prioritize finding the LIVE gameweek
    gameweek = await db.gameweek.find_first(
        where={'status': 'LIVE'},
        order={'gw_number': 'asc'}
    )
    # 2. If no gameweek is LIVE, find the next UPCOMING one
    if not gameweek:
        gameweek = await db.gameweek.find_first(
            where={'status': 'UPCOMING'},
            order={'gw_number': 'asc'}
        )
    # 3. If none are LIVE or UPCOMING, find the most recently FINISHED one
    if not gameweek:
        gameweek = await db.gameweek.find_first(
            where={'status': 'FINISHED'},
            order={'gw_number': 'desc'}
        )
    
    if not gameweek:
        raise HTTPException(status_code=404, detail="No gameweek could be determined as current.")
    
    # --- The rest of the function for fetching stats (most captained, etc.) remains the same ---
    cap_agg = await db.userteam.group_by(
        by=['player_id'],
        where={'gameweek_id': gameweek.id, 'is_captain': True},
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    most_captained = None
    if cap_agg:
        player = await db.player.find_unique(where={'id': cap_agg[0]['player_id']}, include={'team': True})
        if player and player.team:
            most_captained = {"name": player.full_name, "team_name": player.team.name}

    vc_agg = await db.userteam.group_by(
        by=['player_id'],
        where={'gameweek_id': gameweek.id, 'is_vice_captain': True},
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    most_vice_captained = None
    if vc_agg:
        player = await db.player.find_unique(where={'id': vc_agg[0]['player_id']}, include={'team': True})
        if player and player.team:
            most_vice_captained = {"name": player.full_name, "team_name": player.team.name}

    selected_agg = await db.userteam.group_by(
        by=['player_id'],
        where={'gameweek_id': gameweek.id},
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    most_selected = None
    if selected_agg:
        player = await db.player.find_unique(where={'id': selected_agg[0]['player_id']}, include={'team': True})
        if player and player.team:
            most_selected = {"name": player.full_name, "team_name": player.team.name}

    chips_played = await db.userchip.count(where={'gameweek_id': gameweek.id})
    
    response_data = gameweek.model_dump()
    response_data.update({
        "most_captained": most_captained,
        "most_vice_captained": most_vice_captained,
        "most_selected": most_selected,
        "chips_played": chips_played
    })
    
    return response_data

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