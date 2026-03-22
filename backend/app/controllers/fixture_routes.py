from fastapi import APIRouter, Depends
from prisma import Prisma
from app.database import get_db

# --- IMPORT SERVICES & REPOS ---
from app.repositories.fixture_repo import get_all_fixtures
from app.services.fixture_service import get_next_fixture_map_service

router = APIRouter(prefix="/fixtures", tags=["fixtures"])

@router.get("/fixtures/next-map")
async def next_fixture_map(db: Prisma = Depends(get_db)):
    return await get_next_fixture_map_service(db)

@router.get("/")
async def list_fixtures(
    db: Prisma = Depends(get_db),
    gameweek_id: int | None = None
):
    return await get_all_fixtures(db, gameweek_id)

@router.get("/{fixture_id}/details")
async def get_public_fixture_details(fixture_id: int, db: Prisma = Depends(get_db)):
    fx = await db.fixture.find_unique(
        where={"id": fixture_id},
        include={"home": True, "away": True}
    )
    if not fx:
        raise HTTPException(404, "Fixture not found")
        
    # Get all stats for players in this fixture's teams for this gameweek
    stats = await db.gameweekplayerstats.find_many(
        where={
            "gameweek_id": fx.gameweek_id,
            "player": {
                "team_id": {"in": [fx.home_team_id, fx.away_team_id]}
            }
        },
        include={"player": True}
    )
    
    # Categories to display
    categories = [
        ("goals_scored", "Goals scored"),
        ("assists", "Assists"),
        ("own_goals", "Own goals"),
        ("yellow_cards", "Yellow cards"),
        ("red_cards", "Red cards"),
        ("penalties_saved", "Penalties saved"),
        ("penalties_missed", "Penalties missed"),
        ("bonus_points", "Bonus")
    ]
    
    response_stats = []
    for key, label in categories:
        home_players = []
        away_players = []
        
        for s in stats:
            val = getattr(s, key, 0)
            if val and val > 0:
                player_info = {"name": s.player.full_name, "value": val}
                if s.player.team_id == fx.home_team_id:
                    home_players.append(player_info)
                else:
                    away_players.append(player_info)
        
        # Only add category if at least one player did the action
        if home_players or away_players:
            home_players.sort(key=lambda x: x["value"], reverse=True)
            away_players.sort(key=lambda x: x["value"], reverse=True)
            
            response_stats.append({
                "category": label,
                "home": home_players,
                "away": away_players
            })
            
    return {
        "id": fx.id,
        "home_score": fx.home_score,
        "away_score": fx.away_score,
        "stats": response_stats
    }