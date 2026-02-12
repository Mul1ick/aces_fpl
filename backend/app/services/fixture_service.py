import logging
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
from app.utils.points_calculator import calculate_player_points
from app.repositories.player_repo import get_players_by_ids
from app.repositories.gameweek_repo import get_current_gameweek
from app.repositories.fixture_repo import get_fixtures_in_gameweek

logger = logging.getLogger(__name__)

async def submit_fixture_stats_service(db: Prisma, gameweek_id: int, payload: schemas.SubmitFixtureStats):
    fx = await db.fixture.find_unique(where={"id": payload.fixture_id})
    if not fx or fx.gameweek_id != gameweek_id: 
        raise HTTPException(400, "Fixture does not belong to this gameweek")

    player_ids = [s.player_id for s in payload.player_stats]
    players = await get_players_by_ids(db, player_ids)
    player_map = {p.id: p for p in players}

    async with db.tx() as tx:
        await tx.fixture.update(
            where={"id": payload.fixture_id}, 
            data={"home_score": payload.home_score, "away_score": payload.away_score, "stats_entered": True}
        )
        for s in payload.player_stats:
            player = player_map.get(s.player_id)
            if not player: continue
            
            total_points = calculate_player_points(player.position, s)
            stat_data = s.model_dump()
            
            # 1. Safely remove fields that do not exist in the GameweekPlayerStats table
            keys_to_remove = ['player_id', 'played', 'minutes', 'suspension_duration']
            for key in keys_to_remove:
                stat_data.pop(key, None)
            
            # 2. Upsert using the flat scalar IDs for gameweek_id and player_id
            await tx.gameweekplayerstats.upsert(
                where={
                    "gameweek_id_player_id": {
                        "gameweek_id": gameweek_id, 
                        "player_id": s.player_id
                    }
                },
                data={
                    "create": {
                        "gameweek_id": gameweek_id,
                        "player_id": s.player_id,
                        **stat_data, 
                        "points": total_points
                    }, 
                    "update": {
                        **stat_data, 
                        "points": total_points
                    }
                }
            )
            
    return {"ok": True}

async def get_fixture_stats_service(db: Prisma, fixture_id: int):
    fx = await db.fixture.find_unique(where={"id": fixture_id})
    if not fx: raise HTTPException(404, "Fixture not found")
    
    players = await db.player.find_many(where={"team_id": {"in": [fx.home_team_id, fx.away_team_id]}})
    player_ids = {p.id for p in players}
    
    stats = await db.gameweekplayerstats.find_many(where={"gameweek_id": fx.gameweek_id, "player_id": {"in": list(player_ids)}})
    return {"home_score": fx.home_score, "away_score": fx.away_score, "player_stats": stats}

async def get_next_fixture_map_service(db: Prisma):
    cur = await get_current_gameweek(db)
    nxt = await db.gameweek.find_unique(where={'gw_number': cur.gw_number + 1})
    
    if not nxt:
        return {}

    fixtures = await get_fixtures_in_gameweek(db, nxt.id)

    def fmt(f):
        # "OPP (H/A) • Sat 13 Sep 14:30"
        dow = f.kickoff.strftime('%a')
        day = f.kickoff.strftime('%d')
        mon = f.kickoff.strftime('%b')
        time_str = f.kickoff.strftime('%H:%M')
        return dow, day, mon, time_str

    out = {}
    for f in fixtures:
        dow, day, mon, time_str = fmt(f)
        out[f.home_team_id] = f"{f.away.short_name} (H) • {dow} {day} {mon} {time_str}"
        out[f.away_team_id] = f"{f.home.short_name} (A) • {dow} {day} {mon} {time_str}"
    return out