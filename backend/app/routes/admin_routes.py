from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from app import schemas, crud, auth
from app.database import get_db
from typing import List, Optional
from uuid import UUID
import asyncio
from collections import defaultdict
import logging
alog = logging.getLogger("aces.admin")
from app.auth import get_current_admin_user
from fastapi import Depends


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- DASHBOARD ---
@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: Prisma = Depends(get_db)):
    """
    Get statistics for the admin dashboard.
    """
    stats = await crud.get_dashboard_stats(db)
    if not stats:
        raise HTTPException(status_code=404, detail="Could not retrieve dashboard stats.")
    return stats

# --- USER MANAGEMENT ---

@router.get("/users/pending", response_model=List[schemas.UserOut],dependencies=[Depends(get_current_admin_user)])
async def get_pending_users(db: Prisma = Depends(get_db)):
    users = await crud.get_pending_users(db)

    flags = await asyncio.gather(
        *[crud.user_has_team(db, str(u.id)) for u in users]
    )

    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": bool(u.is_active),
            "has_team": flags[i],
            "free_transfers": (u.free_transfers if u.free_transfers is not None else 1),
            "played_first_gameweek": (u.played_first_gameweek if u.played_first_gameweek is not None else False),
        }
        for i, u in enumerate(users)
    ]

@router.get("/users", response_model=schemas.PaginatedResponse[schemas.UserOut],dependencies=[Depends(get_current_admin_user)])
async def get_all_users(
    db: Prisma = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
):
    result = await crud.get_all_users(db, page=page, per_page=per_page, search=search, role=role)

    enriched_items = []
    for u in result["items"]:
        has_team = await crud.user_has_team(db, str(u.id))
        enriched_items.append({
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": bool(u.is_active),
            "has_team": has_team,
            "free_transfers": (u.free_transfers if u.free_transfers is not None else 1),
            "played_first_gameweek": (u.played_first_gameweek if u.played_first_gameweek is not None else False),
        })

    return {
        "items": enriched_items,
        "total": result["total"],
        "page": result["page"],
        "per_page": result["per_page"],
        "pages": result["pages"],
    }


@router.post("/users/{user_id}/approve", response_model=schemas.UserOut,dependencies=[Depends(get_current_admin_user)])
async def approve_user(user_id: str, db: Prisma = Depends(get_db)):
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated = await crud.approve_user(db, user_id)
    has_team = await crud.user_has_team(db, user_id)

    return {
        "id": str(updated.id),
        "email": updated.email,
        "full_name": updated.full_name,
        "role": updated.role,
        "is_active": bool(updated.is_active),
        "has_team": has_team,
        "free_transfers": (updated.free_transfers if updated.free_transfers is not None else 1),
        "played_first_gameweek": (updated.played_first_gameweek if updated.played_first_gameweek is not None else False),
    }

@router.post("/users/bulk-approve", response_model=dict,dependencies=[Depends(get_current_admin_user)])
async def bulk_approve_users(request: schemas.BulkApproveRequest, db: Prisma = Depends(get_db)):
    """
    Approve multiple users in a single request.
    """
    result = await crud.bulk_approve_users(db, request.user_ids)
    return {"message": f"Successfully approved {result.count} users."}

@router.post("/users/{user_id}/role", response_model=schemas.UserOut,dependencies=[Depends(get_current_admin_user)])
async def update_user_role(user_id: str, request: schemas.UserUpdateRole, db: Prisma = Depends(get_db)):
    """
    Update a user's role (e.g., promote to admin).
    """
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await crud.update_user_role(db, user_id, request.role)
    has_team = await crud.user_has_team(db, str(updated_user.id))

    return {
        "id": str(updated_user.id),
        "email": updated_user.email,
        "full_name": updated_user.full_name,
        "role": updated_user.role,
        "is_active": bool(updated_user.is_active),
        "has_team": has_team,
        "free_transfers": updated_user.free_transfers,
        "played_first_gameweek": updated_user.played_first_gameweek,
    }

# --- PLAYER MANAGEMENT ---
@router.get("/players", response_model=List[schemas.PlayerOut])
async def admin_list_players(
    db: Prisma = Depends(get_db),
    q: Optional[str] = Query(None, description="Search by name/team"),
    team: Optional[int] = Query(None, description="Team ID"),
    position: Optional[str] = Query(None, description="GK/DEF/MID/FWD"),
    status: Optional[str] = Query(None, description="available/injured/suspended"),
):
    where: dict = {}
    if q:
        where["OR"] = [
            {"full_name": {"contains": q, "mode": "insensitive"}},
            {"team": {"name": {"contains": q, "mode": "insensitive"}}},
        ]
    if team is not None:
        where["team_id"] = team
    if position:
        where["position"] = position
    if status and status != "all":
        where["status"] = status

    return await db.player.find_many(
        where=where,
        include={"team": True},
        order={"full_name": "asc"},
    )

@router.post("/players", response_model=schemas.PlayerOut)
async def admin_create_player(payload: schemas.PlayerCreate, db: Prisma = Depends(get_db)):
    created = await db.player.create(data=payload.model_dump())
    full = await db.player.find_unique(
        where={"id": created.id},
        include={"team": True},
    )
    return full

@router.put("/players/{player_id}", response_model=schemas.PlayerOut)
async def admin_update_player(player_id: int, payload: schemas.PlayerUpdate, db: Prisma = Depends(get_db)):
    exists = await db.player.find_unique(where={"id": player_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Player not found")

    data = payload.model_dump(exclude_unset=True, exclude_none=True)

    if "team_id" in data:
        team_id = data.pop("team_id")
        data["team"] = {"connect": {"id": team_id}}

    await db.player.update(where={"id": player_id}, data=data)
    full = await db.player.find_unique(where={"id": player_id}, include={"team": True})
    return full

@router.delete("/players/{player_id}", status_code=204)
async def admin_delete_player(
    player_id: int,
    db: Prisma = Depends(get_db),
):
    exists = await db.player.find_unique(where={"id": player_id})
    if not exists:
        raise HTTPException(status_code=404, detail="Player not found")
    await db.player.delete(where={"id": player_id})


# --- TEAM MANAGEMENT ---
@router.get("/teams", response_model=list[schemas.TeamOutWithCount])
async def admin_list_teams(db: Prisma = Depends(get_db)):
    from collections import defaultdict
    players = await db.player.find_many()
    counts = defaultdict(int)
    for p in players:
        if p.team_id is not None:
            counts[p.team_id] += 1

    teams = await db.team.find_many(order={"name": "asc"})

    result = [
        {
            "id": t.id,
            "name": t.name,
            "short_name": t.short_name,
            "player_count": counts.get(t.id, 0),
        }
        for t in teams
    ]
    return result

@router.post("/teams", response_model=schemas.TeamOut)
async def admin_create_team(payload: schemas.TeamCreate, db: Prisma = Depends(get_db)):
    exists = await db.team.find_first(where={
        "OR": [{"name": payload.name}, {"short_name": payload.short_name}]
    })
    if exists:
        raise HTTPException(409, "Team with same name or short_name already exists")

    team = await db.team.create(data=payload.model_dump())
    return team

@router.put("/teams/{team_id}", response_model=schemas.TeamOut)
async def admin_update_team(team_id: int, payload: schemas.TeamUpdate, db: Prisma = Depends(get_db)):
    team = await db.team.find_unique(where={"id": team_id})
    if not team:
        raise HTTPException(404, "Team not found")

    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    return await db.team.update(where={"id": team_id}, data=data)

@router.delete("/teams/{team_id}", status_code=204)
async def admin_delete_team(team_id: int, db: Prisma = Depends(get_db)):
    team = await db.team.find_unique(where={"id": team_id})
    if not team:
        raise HTTPException(404, "Team not found")

    has_players = await db.player.count(where={"team_id": team_id})
    if has_players:
        raise HTTPException(400, "Cannot delete team with players assigned")

    await db.team.delete(where={"id": team_id})


# --- GAMEWEEK MANAGEMENT ---
@router.get("/gameweeks/current", response_model=schemas.GameweekOutWithFixtures)
async def admin_get_current_gameweek(db: Prisma = Depends(get_db)):
    gw = await crud.get_current_gameweek(db)
    if not gw:
        raise HTTPException(status_code=404, detail="No gameweeks configured.")

    fixtures = await db.fixture.find_many(
        where={"gameweek_id": gw.id},
        order={"id": "asc"},
    )

    team_ids = {f.home_team_id for f in fixtures} | {f.away_team_id for f in fixtures}
    teams = await db.team.find_many(
        where={"id": {"in": list(team_ids)}},
    )
    team_map = {t.id: t for t in teams}

    return {
        "id": gw.id,
        "gw_number": gw.gw_number,
        "deadline": gw.deadline,
        "fixtures": [
            {
                "id": f.id,
                "gameweek_id": f.gameweek_id,
                "home_team_id": f.home_team_id,
                "away_team_id": f.away_team_id,
                "home_score": getattr(f, "home_score", None),
                "away_score": getattr(f, "away_score", None),
                "stats_entered": getattr(f, "stats_entered", False),
                "home_team": {
                    "id": team_map[f.home_team_id].id,
                    "name": team_map[f.home_team_id].name,
                    "short_name": team_map[f.home_team_id].short_name,
                },
                "away_team": {
                    "id": team_map[f.away_team_id].id,
                    "name": team_map[f.away_team_id].name,
                    "short_name": team_map[f.away_team_id].short_name,
                },
            }
            for f in fixtures
        ],
    }

@router.get("/fixtures/{fixture_id}/players")
async def admin_fixture_players(fixture_id: int, db: Prisma = Depends(get_db)):
    fx = await db.fixture.find_unique(where={"id": fixture_id})
    if not fx:
        raise HTTPException(404, "Fixture not found")
    players = await db.player.find_many(
        where={"team_id": {"in": [fx.home_team_id, fx.away_team_id]}},
        include={"team": {"select": {"id": True, "name": True, "short_name": True}}},
        order={"full_name": "asc"},
    )
    return players

@router.post("/gameweeks/{gameweek_id}/stats")
async def admin_submit_fixture_stats(
    gameweek_id: int,
    payload: schemas.SubmitFixtureStats,
    db: Prisma = Depends(get_db),
):
    fx = await db.fixture.find_unique(where={"id": payload.fixture_id})
    if not fx or fx.gameweek_id != gameweek_id:
        raise HTTPException(400, "Fixture does not belong to this gameweek")

    ids = [s.player_id for s in payload.player_stats]
    players = await db.player.find_many(
    where={'id': {'in': list(ids)}},
)
    pos_map = {p.id: p.position for p in players}

    def goal_pts(pos: str) -> int:
        if pos == "GK":
            return 10
        if pos == "DEF":
            return 6
        if pos == "MID":
            return 5
        return 4  # FWD / default

    async with db.tx() as tx:
        # optional: update fixture score if those fields exist
        try:
            await tx.fixture.update(
                where={"id": payload.fixture_id},
                data={
                    "home_score": payload.home_score,
                    "away_score": payload.away_score,
                    "stats_entered": True,
                },
            )
        except Exception:
            pass

        for s in payload.player_stats:
            pos = pos_map.get(s.player_id)
            if not pos:
                continue

            gs   = int(s.goals_scored or 0)
            ast  = int(s.assists or 0)
            yc   = int(s.yellow_cards or 0)
            rc   = int(s.red_cards or 0)
            bps  = int(s.bonus_points or 0)

            points = goal_pts(pos) * gs + 3 * ast - 1 * yc - 3 * rc + bps

            await tx.gameweekplayerstats.upsert(
                where={
                    "gameweek_id_player_id": {
                        "gameweek_id": gameweek_id,
                        "player_id": s.player_id,
                    }
                },
                data={
                    "create": {
                        "gameweek_id": gameweek_id,
                        "player_id": s.player_id,
                        "goals_scored": gs,
                        "assists": ast,
                        "yellow_cards": yc,
                        "red_cards": rc,
                        "bonus_points": bps,
                        # "minutes": s.minutes,
                        "points": points,
                    },
                    "update": {
                        "goals_scored": gs,
                        "assists": ast,
                        "yellow_cards": yc,
                        "red_cards": rc,
                        "bonus_points": bps,
                        # "minutes": s.minutes,
                        "points": points,
                    },
                },
            )

    return {"ok": True}

@router.get("/fixtures/{fixture_id}/stats", response_model=schemas.FixtureStatsOut)
async def admin_get_fixture_stats(fixture_id: int, db: Prisma = Depends(get_db)):
    fx = await db.fixture.find_unique(where={"id": fixture_id})
    if not fx:
        raise HTTPException(404, "Fixture not found")

    rows = await db.gameweekplayerstats.find_many(
        where={"gameweek_id": fx.gameweek_id}
    )
    # If you want to limit to only players from the two clubs:
    team_players = await db.player.find_many(
        where={"team_id": {"in": [fx.home_team_id, fx.away_team_id]}},
        select={"id": True},
    )
    ids = {p.id for p in team_players}
    rows = [r for r in rows if r.player_id in ids]

    return {
        "home_score": getattr(fx, "home_score", None),
        "away_score": getattr(fx, "away_score", None),
        "player_stats": [
            {
                "player_id": r.player_id,
                "goals_scored": r.goals_scored,
                "assists": r.assists,
                "yellow_cards": r.yellow_cards,
                "red_cards": r.red_cards,
                "bonus_points": r.bonus_points,
                "minutes": r.minutes,
            }
            for r in rows
        ],
    }

@router.post("/gameweeks/{gameweek_id}/calculate-points", dependencies=[Depends(get_current_admin_user)])
async def calculate_gameweek_points(gameweek_id: int, db: Prisma = Depends(get_db)):
    """
    Calculates and stores the total points for every active user for a given gameweek.
    This is the trigger for processing all scores after stats are entered.
    """
    try:
        # Get all active users who have a team
        active_users_with_teams = await db.user.find_many(
            where={'is_active': True, 'fantasy_team': {'is_not': None}}
        )

        if not active_users_with_teams:
            return {"message": "No active users with teams to process."}

        # Run score calculation for each user
        for user in active_users_with_teams:
            await crud.compute_user_score_for_gw(db, str(user.id), gameweek_id)

        return {"message": f"Successfully calculated points for {len(active_users_with_teams)} users in Gameweek {gameweek_id}."}
    except Exception as e:
        alog.error(f"Error calculating gameweek points for GW {gameweek_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during point calculation.")
    

@router.post("/gameweeks/{gameweek_id}/finalize", dependencies=[Depends(get_current_admin_user)])
async def finalize_gameweek(gameweek_id: int, db: Prisma = Depends(get_db)):
    """
    Finalizes a gameweek, which triggers rollover tasks like
    updating user free transfers.
    """
    try:
        result_message = await crud.perform_gameweek_rollover_tasks(db, gameweek_id)
        alog.info(f"Gameweek {gameweek_id} finalized successfully. Details: {result_message}")
        return {"message": f"Gameweek {gameweek_id} finalized and rollover tasks completed."}
    except Exception as e:
        alog.error(f"Error finalizing gameweek {gameweek_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during gameweek finalization: {e}"
        )