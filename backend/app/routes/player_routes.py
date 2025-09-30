from fastapi import APIRouter, Depends
from app.database import get_db
from app import models
from app.schemas import PlayerOut as OriginalPlayerOut, TeamOut
from prisma import Prisma
from fastapi import HTTPException
from app import schemas, crud


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

# Add this new route to the end of backend/app/routes/player_routes.py
@router.get("/{player_id}/details", response_model=schemas.PlayerDetailResponse)
async def get_player_details(player_id: int, db: Prisma = Depends(get_db)):
    """
    Retrieves detailed statistics, season history, and upcoming fixtures for a single player.
    """
    player = await db.player.find_unique(where={'id': player_id}, include={'team': True})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # 1. Fetch Season History
    stats_history = await db.gameweekplayerstats.find_many(
        where={'player_id': player_id},
        include={'gameweek': True},
        order={'gameweek': {'gw_number': 'desc'}}
    )

    history_items: list[schemas.PlayerHistoryItem] = []
    total_points = 0
    for stat in stats_history:
        total_points += stat.points
        fixture = await db.fixture.find_first(
            where={'gameweek_id': stat.gameweek_id, 'OR': [{'home_team_id': player.team_id}, {'away_team_id': player.team_id}]},
            include={'home': True, 'away': True}
        )
        
        opp = "---"
        result = "-"
        if fixture:
            is_home = fixture.home_team_id == player.team_id
            opponent_team = fixture.away if is_home else fixture.home
            opp = f"{opponent_team.short_name} ({'H' if is_home else 'A'})"
            
            if fixture.home_score is not None and fixture.away_score is not None:
                if (is_home and fixture.home_score > fixture.away_score) or (not is_home and fixture.away_score > fixture.home_score):
                    result = 'W'
                elif fixture.home_score == fixture.away_score:
                    result = 'D'
                else:
                    result = 'L'

        history_items.append(schemas.PlayerHistoryItem(
            gw=stat.gameweek.gw_number,
            opp=opp,
            result=result,
            pts=stat.points,
            mp=stat.minutes,
            gs=stat.goals_scored,
            a=stat.assists,
            cs=1 if stat.clean_sheets else 0,
            gc=stat.goals_conceded,
            yc=stat.yellow_cards,
            rc=stat.red_cards
        ))

    # 2. Fetch Upcoming Fixtures
    current_gw = await crud.get_current_gameweek(db)
    upcoming_db_fixtures = await db.fixture.find_many(
        where={
            'gameweek': {'gw_number': {'gte': current_gw.gw_number}},
            'OR': [{'home_team_id': player.team_id}, {'away_team_id': player.team_id}]
        },
        include={'gameweek': True, 'home': True, 'away': True},
        order={'gameweek': {'gw_number': 'asc'}},
        take=5
    )

    upcoming_items = [
        {
            "gw": f.gameweek.gw_number,
            "opp_short": f.away.short_name if f.home_team_id == player.team_id else f.home.short_name,
            "opp_long": f.away.name if f.home_team_id == player.team_id else f.home.name,
            "is_home": f.home_team_id == player.team_id
        } for f in upcoming_db_fixtures
    ]
    
    return schemas.PlayerDetailResponse(
        id=player.id,
        full_name=player.full_name,
        position=player.position,
        team_name=player.team.name,
        price=float(player.price),
        total_points=total_points,
        history=history_items,
        upcoming_fixtures=upcoming_items
    )