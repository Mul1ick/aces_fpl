from fastapi import APIRouter, Depends
from prisma import Prisma
from app.database import get_db
from app import schemas

# --- IMPORT SERVICES & REPOS ---
from app.repositories.player_repo import get_all_players_with_teams
from app.services.player_service import (
    get_players_with_stats_service, 
    get_player_details_service
)

router = APIRouter(
    prefix="/players",
    tags=["Players"]
)

# Use original schema for basic list
class PlayerStatsOut(schemas.PlayerOut):
    total_points: int

@router.get("/", response_model=list[schemas.PlayerOut])
async def get_players(db: Prisma = Depends(get_db)):
    # Simple fetch, no complex logic needed
    return await get_all_players_with_teams(db)

@router.get("/stats", response_model=list[PlayerStatsOut])
async def get_all_player_stats(db: Prisma = Depends(get_db)):
    """
    Retrieves all players and aggregates their total points for the season.
    """
    return await get_players_with_stats_service(db)

@router.get("/{player_id}/details", response_model=schemas.PlayerDetailResponse)
async def get_player_details(player_id: int, db: Prisma = Depends(get_db)):
    """
    Retrieves detailed statistics, season history, and upcoming fixtures for a single player.
    """
    return await get_player_details_service(db, player_id)