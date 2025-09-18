from fastapi import APIRouter, Depends
from app.database import get_db
from app import models
from app.schemas import PlayerOut as OriginalPlayerOut, TeamOut
from prisma import Prisma

router = APIRouter(
    prefix="/players",
    tags=["Players"]
)
class PlayerStatsOut(OriginalPlayerOut):
    total_points: int


@router.get("/", response_model=list[OriginalPlayerOut])
async def get_players(db: Prisma = Depends(get_db)):
    # Use Prisma's 'find_many' and include the related team
    players = await db.player.find_many(
        include={'team': True}
    )
    return players

@router.get("/stats", response_model=list[PlayerStatsOut])
async def get_all_player_stats(db: Prisma = Depends(get_db)):
    """
    Retrieves all players and aggregates their total points for the season.
    """
    # 1. Fetch all players with their teams
    players = await db.player.find_many(include={'team': True})
    
    # 2. Fetch all player stats and group by player_id
    stats = await db.gameweekplayerstats.group_by(
        by=['player_id'],
        sum={'points': True},
    )
    
    # 3. Create a dictionary for quick point lookups
    points_map = {
        stat['player_id']: stat['_sum']['points'] or 0 for stat in stats
    }
    
    # 4. Combine player data with their total points
    response_data = []
    for player in players:
        player_data = player.model_dump()
        player_data['total_points'] = points_map.get(player.id, 0)
        response_data.append(player_data)
        
    return response_data