from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from app import schemas, crud, auth
from app.database import get_db
from typing import List, Optional
from uuid import UUID
import asyncio
from collections import defaultdict
import logging
from app.auth import get_current_admin_user
from datetime import datetime, timezone

alog = logging.getLogger("aces.admin")

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- HELPER FUNCTION ---
def calculate_player_points(position: str, stats: schemas.PlayerStatIn) -> int:
    points = 0
    if stats.played:
        points += 1
    if stats.goals_scored > 0:
        if position == "GK": points += stats.goals_scored * 10
        elif position == "DEF": points += stats.goals_scored * 6
        elif position == "MID": points += stats.goals_scored * 5
        elif position == "FWD": points += stats.goals_scored * 4
    points += stats.assists * 3
    points += stats.bonus_points
    if stats.clean_sheets:
        if position in ["GK", "DEF"]: points += 4
        elif position == "MID": points += 1
    if position in ["GK", "DEF"]:
        points -= (stats.goals_conceded // 2)
    points -= stats.penalties_missed * 2
    points -= stats.own_goals * 2
    points -= stats.yellow_cards * 1
    points -= stats.red_cards * 3
    return points

# --- SEASON & GAMEWEEK LIFECYCLE ---
@router.post("/gameweeks/start-season", dependencies=[Depends(get_current_admin_user)])
async def start_season(db: Prisma = Depends(get_db)):
    live_or_finished_gw = await db.gameweek.find_first(where={'status': {'in': ['LIVE', 'FINISHED']}})
    if live_or_finished_gw:
        raise HTTPException(status_code=400, detail="The season has already started.")
    first_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
    if not first_gw:
        raise HTTPException(status_code=404, detail="No upcoming gameweeks to start.")
    if first_gw.deadline > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail=f"Deadline for GW {first_gw.gw_number} has not passed.")
    await db.gameweek.update(where={'id': first_gw.id}, data={'status': 'LIVE'})
    return {"message": f"Season started! Gameweek {first_gw.gw_number} is now LIVE."}

@router.post("/gameweeks/{gameweek_id}/calculate-points", dependencies=[Depends(get_current_admin_user)])
async def calculate_gameweek_points(gameweek_id: int, db: Prisma = Depends(get_db)):
    try:
        users = await db.user.find_many(where={'is_active': True, 'fantasy_team': {'is_not': None}})
        if not users:
            return {"message": "No active users with teams to process."}
        for user in users:
            await crud.compute_user_score_for_gw(db, str(user.id), gameweek_id)
        return {"message": f"Successfully calculated points for {len(users)} users."}
    except Exception as e:
        alog.error(f"Error calculating points for GW {gameweek_id}: {e}")
        raise HTTPException(status_code=500, detail="Point calculation failed.")

@router.post("/gameweeks/{gameweek_id}/finalize", dependencies=[Depends(get_current_admin_user)])
async def finalize_gameweek(gameweek_id: int, db: Prisma = Depends(get_db)):
    alog.info(f"Attempting to finalize Gameweek ID: {gameweek_id}")
    try:
        live_gw = await db.gameweek.find_first(where={'status': 'LIVE'})
        if not live_gw or live_gw.id != gameweek_id:
            raise HTTPException(status_code=400, detail="Incorrect or no live gameweek to finalize.")
        
        upcoming_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
        
        await crud.perform_gameweek_rollover_tasks(db, live_gw.id)
        
        async with db.tx() as transaction:
            await transaction.gameweek.update(where={'id': live_gw.id}, data={'status': 'FINISHED'})
            if upcoming_gw:
                await transaction.gameweek.update(where={'id': upcoming_gw.id}, data={'status': 'LIVE'})

        message = f"Gameweek {live_gw.gw_number} finalized."
        if upcoming_gw:
            message += f" Gameweek {upcoming_gw.gw_number} is now live."
        return {"message": message}
    except Exception as e:
        alog.error(f"Error finalizing gameweek {gameweek_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- DATA VIEWING & ENTRY ---
@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: Prisma = Depends(get_db)):
    stats = await crud.get_dashboard_stats(db)
    if not stats:
        raise HTTPException(status_code=404, detail="Could not retrieve dashboard stats.")
    return stats

@router.get("/users", response_model=schemas.PaginatedResponse[schemas.UserOut],dependencies=[Depends(get_current_admin_user)])
async def get_all_users(db: Prisma = Depends(get_db), page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100), search: Optional[str] = Query(None), role: Optional[str] = Query(None)):
    result = await crud.get_all_users(db, page=page, per_page=per_page, search=search, role=role)
    enriched_items = []
    for u in result["items"]:
        has_team = await crud.user_has_team(db, str(u.id))
        enriched_items.append({"id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role, "is_active": bool(u.is_active), "has_team": has_team, "free_transfers": u.free_transfers, "played_first_gameweek": u.played_first_gameweek})
    return {"items": enriched_items, **result}

@router.get("/teams", response_model=list[schemas.TeamOutWithCount])
async def admin_list_teams(db: Prisma = Depends(get_db)):
    teams = await db.team.find_many(include={'players': {'select': {'id': True}}}, order={"name": "asc"})
    return [{"id": t.id, "name": t.name, "short_name": t.short_name, "player_count": len(t.players)} for t in teams]

@router.get("/players", response_model=List[schemas.PlayerOut])
async def admin_list_players(db: Prisma = Depends(get_db), q: Optional[str] = Query(None), team: Optional[int] = Query(None), position: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    where: dict = {}
    if q: where["OR"] = [{"full_name": {"contains": q, "mode": "insensitive"}}, {"team": {"name": {"contains": q, "mode": "insensitive"}}}]
    if team is not None: where["team_id"] = team
    if position: where["position"] = position
    if status and status != "all": where["status"] = status
    return await db.player.find_many(where=where, include={"team": True}, order={"full_name": "asc"})

@router.get("/gameweeks/{gameweek_id}", response_model=schemas.GameweekOutWithFixtures)
async def admin_get_gameweek_by_id(gameweek_id: int, db: Prisma = Depends(get_db)):
    gw = await db.gameweek.find_unique(where={"id": gameweek_id}, include={"fixtures": {"include": {"home": True, "away": True}, "order_by": {"id": "asc"}}})
    if not gw:
        raise HTTPException(status_code=404, detail="Gameweek not found.")
    
    transformed_fixtures = []
    for f in gw.fixtures:
        fixture_dict = f.model_dump(); fixture_dict['home_team'] = fixture_dict.pop('home'); fixture_dict['away_team'] = fixture_dict.pop('away')
        transformed_fixtures.append(fixture_dict)
    
    response_data = gw.model_dump(); response_data["fixtures"] = transformed_fixtures
    return response_data

@router.post("/gameweeks/{gameweek_id}/stats")
async def admin_submit_fixture_stats(gameweek_id: int, payload: schemas.SubmitFixtureStats, db: Prisma = Depends(get_db)):
    fx = await db.fixture.find_unique(where={"id": payload.fixture_id})
    if not fx or fx.gameweek_id != gameweek_id:
        raise HTTPException(400, "Fixture does not belong to this gameweek")
    player_ids = [s.player_id for s in payload.player_stats]
    players = await db.player.find_many(where={'id': {'in': player_ids}})
    player_map = {p.id: p for p in players}
    async with db.tx() as tx:
        await tx.fixture.update(where={"id": payload.fixture_id}, data={"home_score": payload.home_score, "away_score": payload.away_score, "stats_entered": True})
        for s in payload.player_stats:
            player = player_map.get(s.player_id)
            if not player: continue
            total_points = calculate_player_points(player.position, s)
            stat_data = s.model_dump(); del stat_data['player_id']
            await tx.gameweekplayerstats.upsert(
                where={"gameweek_id_player_id": {"gameweek_id": gameweek_id, "player_id": s.player_id}},
                data={"create": {"gameweek_id": gameweek_id, "player_id": s.player_id, **stat_data, "points": total_points}, "update": {**stat_data, "points": total_points}}
            )
    return {"ok": True}

@router.get("/fixtures/{fixture_id}/players", response_model=List[schemas.PlayerOut])
async def admin_fixture_players(fixture_id: int, db: Prisma = Depends(get_db)):
    fx = await db.fixture.find_unique(where={"id": fixture_id})
    if not fx: raise HTTPException(404, "Fixture not found")
    return await db.player.find_many(where={"team_id": {"in": [fx.home_team_id, fx.away_team_id]}}, include={"team": True}, order={"full_name": "asc"})

@router.get("/fixtures/{fixture_id}/stats", response_model=schemas.FixtureStatsOut)
async def admin_get_fixture_stats(fixture_id: int, db: Prisma = Depends(get_db)):
    fx = await db.fixture.find_unique(where={"id": fixture_id})
    if not fx: raise HTTPException(404, "Fixture not found")
    players = await db.player.find_many(where={"team_id": {"in": [fx.home_team_id, fx.away_team_id]}})
    player_ids = {p.id for p in players}
    stats = await db.gameweekplayerstats.find_many(where={"gameweek_id": fx.gameweek_id, "player_id": {"in": list(player_ids)}})
    return {"home_score": fx.home_score, "away_score": fx.away_score, "player_stats": stats}

