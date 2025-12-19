from fastapi import HTTPException
from prisma import Prisma
from app import schemas

# Import Repos
from app.repositories.player_repo import (
    get_player_with_team, 
    get_player_history_stats,
    get_all_players_with_teams,
    get_all_player_total_points
)
from app.repositories.fixture_repo import (
    get_fixture_for_history,
    get_upcoming_fixtures_for_team
)
from app.repositories.gameweek_repo import get_current_gameweek

async def get_players_with_stats_service(db: Prisma):
    players = await get_all_players_with_teams(db)
    points_map = await get_all_player_total_points(db)
    
    response_data = []
    for player in players:
        player_data = player.model_dump()
        player_data['total_points'] = points_map.get(player.id, 0)
        response_data.append(player_data)
        
    return response_data

async def get_player_details_service(db: Prisma, player_id: int):
    # 1. Fetch Basic Player Info
    player = await get_player_with_team(db, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # 2. Fetch Season History Stats
    stats_history = await get_player_history_stats(db, player_id)

    history_items = []
    total_points = 0
    
    # 3. Process History (Calculate Opponent & Result)
    for stat in stats_history:
        total_points += stat.points
        fixture = await get_fixture_for_history(db, stat.gameweek_id, player.team_id)
        
        opp = "---"
        result = "-"
        
        if fixture:
            is_home = fixture.home_team_id == player.team_id
            opponent_team = fixture.away if is_home else fixture.home
            opp = f"{opponent_team.short_name} ({'H' if is_home else 'A'})"
            
            # Result Logic (W/D/L)
            if fixture.home_score is not None and fixture.away_score is not None:
                if (is_home and fixture.home_score > fixture.away_score) or \
                   (not is_home and fixture.away_score > fixture.home_score):
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
            gs=stat.goals_scored,
            a=stat.assists,
            cs=1 if stat.clean_sheets else 0,
            gc=stat.goals_conceded,
            yc=stat.yellow_cards,
            rc=stat.red_cards
        ))

    # 4. Fetch Upcoming Fixtures
    current_gw = await get_current_gameweek(db)
    # Handle edge case where no current GW exists (start of season -> 1)
    current_gw_num = current_gw.gw_number if current_gw else 1
    
    upcoming_db_fixtures = await get_upcoming_fixtures_for_team(db, player.team_id, current_gw_num)

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