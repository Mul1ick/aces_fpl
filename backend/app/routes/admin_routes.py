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

# --- NEW: START SEASON ENDPOINT ---
@router.post("/gameweeks/start-season", dependencies=[Depends(get_current_admin_user)])
async def start_season(db: Prisma = Depends(get_db)):
    """
    Manually starts the season by setting the first UPCOMING gameweek to LIVE.
    This is a one-time action.
    """
    # Check if the season has already started
    live_or_finished_gw = await db.gameweek.find_first(where={'status': {'in': ['LIVE', 'FINISHED']}})
    if live_or_finished_gw:
        raise HTTPException(status_code=400, detail="The season has already started.")

    # Find the first upcoming gameweek
    first_gw = await db.gameweek.find_first(
        where={'status': 'UPCOMING'},
        order={'gw_number': 'asc'}
    )
    if not first_gw:
        raise HTTPException(status_code=404, detail="No upcoming gameweeks found to start the season.")

    # Check if the deadline has passed
    if first_gw.deadline > datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail=f"The deadline for Gameweek {first_gw.gw_number} has not passed yet.")

    # Update the status to LIVE
    await db.gameweek.update(
        where={'id': first_gw.id},
        data={'status': 'LIVE'}
    )
    
    return {"message": f"Season started successfully. Gameweek {first_gw.gw_number} is now LIVE."}


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
            "id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role,
            "is_active": bool(u.is_active), "has_team": flags[i],
            "free_transfers": (u.free_transfers if u.free_transfers is not None else 1),
            "played_first_gameweek": (u.played_first_gameweek if u.played_first_gameweek is not None else False),
        } for i, u in enumerate(users)
    ]

@router.get("/users", response_model=schemas.PaginatedResponse[schemas.UserOut],dependencies=[Depends(get_current_admin_user)])
async def get_all_users(
    db: Prisma = Depends(get_db), page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), role: Optional[str] = Query(None),
):
    result = await crud.get_all_users(db, page=page, per_page=per_page, search=search, role=role)
    enriched_items = []
    for u in result["items"]:
        has_team = await crud.user_has_team(db, str(u.id))
        enriched_items.append({
            "id": str(u.id), "email": u.email, "full_name": u.full_name, "role": u.role,
            "is_active": bool(u.is_active), "has_team": has_team,
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
        "id": str(updated.id), "email": updated.email, "full_name": updated.full_name, "role": updated.role,
        "is_active": bool(updated.is_active), "has_team": has_team,
        "free_transfers": (updated.free_transfers if updated.free_transfers is not None else 1),
        "played_first_gameweek": (updated.played_first_gameweek if updated.played_first_gameweek is not None else False),
    }

@router.post("/users/bulk-approve", response_model=dict,dependencies=[Depends(get_current_admin_user)])
async def bulk_approve_users(request: schemas.BulkApproveRequest, db: Prisma = Depends(get_db)):
    result = await crud.bulk_approve_users(db, request.user_ids)
    return {"message": f"Successfully approved {len(request.user_ids)} users."}

@router.post("/users/{user_id}/role", response_model=schemas.UserOut,dependencies=[Depends(get_current_admin_user)])
async def update_user_role(user_id: str, request: schemas.UserUpdateRole, db: Prisma = Depends(get_db)):
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    updated_user = await crud.update_user_role(db, user_id, request.role)
    has_team = await crud.user_has_team(db, str(updated_user.id))
    return {
        "id": str(updated_user.id), "email": updated_user.email, "full_name": updated_user.full_name,
        "role": updated_user.role, "is_active": bool(updated_user.is_active), "has_team": has_team,
        "free_transfers": updated_user.free_transfers, "played_first_gameweek": updated_user.played_first_gameweek,
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
    return await db.player.find_many(where=where, include={"team": True}, order={"full_name": "asc"})

@router.post("/players", response_model=schemas.PlayerOut)
async def admin_create_player(payload: schemas.PlayerCreate, db: Prisma = Depends(get_db)):
    created = await db.player.create(data=payload.model_dump())
    return await db.player.find_unique(where={"id": created.id}, include={"team": True})

@router.put("/players/{player_id}", response_model=schemas.PlayerOut)
async def admin_update_player(player_id: int, payload: schemas.PlayerUpdate, db: Prisma = Depends(get_db)):
    if not await db.player.find_unique(where={"id": player_id}):
        raise HTTPException(status_code=404, detail="Player not found")
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "team_id" in data:
        data["team"] = {"connect": {"id": data.pop("team_id")}}
    await db.player.update(where={"id": player_id}, data=data)
    return await db.player.find_unique(where={"id": player_id}, include={"team": True})

@router.delete("/players/{player_id}", status_code=204)
async def admin_delete_player(player_id: int, db: Prisma = Depends(get_db)):
    if not await db.player.find_unique(where={"id": player_id}):
        raise HTTPException(status_code=404, detail="Player not found")
    await db.player.delete(where={"id": player_id})

# --- TEAM MANAGEMENT ---
@router.get("/teams", response_model=list[schemas.TeamOutWithCount])
async def admin_list_teams(db: Prisma = Depends(get_db)):
    teams = await db.team.find_many(include={'players': {'select': {'id': True}}}, order={"name": "asc"})
    return [{"id": t.id, "name": t.name, "short_name": t.short_name, "player_count": len(t.players)} for t in teams]

@router.post("/teams", response_model=schemas.TeamOut)
async def admin_create_team(payload: schemas.TeamCreate, db: Prisma = Depends(get_db)):
    if await db.team.find_first(where={"OR": [{"name": payload.name}, {"short_name": payload.short_name}]}):
        raise HTTPException(409, "Team with same name or short_name already exists")
    return await db.team.create(data=payload.model_dump())

@router.put("/teams/{team_id}", response_model=schemas.TeamOut)
async def admin_update_team(team_id: int, payload: schemas.TeamUpdate, db: Prisma = Depends(get_db)):
    if not await db.team.find_unique(where={"id": team_id}):
        raise HTTPException(404, "Team not found")
    return await db.team.update(where={"id": team_id}, data=payload.model_dump(exclude_unset=True, exclude_none=True))

@router.delete("/teams/{team_id}", status_code=204)
async def admin_delete_team(team_id: int, db: Prisma = Depends(get_db)):
    if not await db.team.find_unique(where={"id": team_id}):
        raise HTTPException(404, "Team not found")
    if await db.player.count(where={"team_id": team_id}):
        raise HTTPException(400, "Cannot delete team with players assigned")
    await db.team.delete(where={"id": team_id})

# --- GAMEWEEK MANAGEMENT ---
@router.get("/gameweeks/current", response_model=schemas.GameweekOutWithFixtures)
async def admin_get_current_gameweek(db: Prisma = Depends(get_db)):
    # This implementation needs to be aligned with the new status logic
    # For now, it might be better to rely on `get_live_gameweek` or a similar new function
    gw = await crud.get_live_gameweek(db) or await crud.get_upcoming_gameweek(db)
    if not gw:
        raise HTTPException(status_code=404, detail="No active or upcoming gameweek found.")
    return await admin_get_gameweek_by_id(gw.id, db)


@router.get("/gameweeks/{gameweek_id}", response_model=schemas.GameweekOutWithFixtures)
async def admin_get_gameweek_by_id(gameweek_id: int, db: Prisma = Depends(get_db)):
    gw = await db.gameweek.find_unique(where={"id": gameweek_id})
    if not gw:
        raise HTTPException(status_code=404, detail="Gameweek not found.")
    fixtures = await db.fixture.find_many(where={"gameweek_id": gw.id}, include={"home_team": True, "away_team": True}, order={"id": "asc"})
    return {**gw.model_dump(), "fixtures": fixtures}

@router.post("/gameweeks/{gameweek_id}/finalize", dependencies=[Depends(get_current_admin_user)])
async def finalize_gameweek(gameweek_id: int, db: Prisma = Depends(get_db)):
    alog.info(f"Attempting to finalize Gameweek ID: {gameweek_id}")
    try:
        live_gw = await db.gameweek.find_first(where={'status': 'LIVE'})
        if not live_gw:
            raise HTTPException(status_code=404, detail="No live gameweek found to finalize.")
        if live_gw.id != gameweek_id:
            raise HTTPException(status_code=400, detail=f"Incorrect gameweek. GW {live_gw.gw_number} is LIVE.")
        
        upcoming_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
        
        await crud.perform_gameweek_rollover_tasks(db, live_gw.id)
        alog.info(f"Rollover tasks completed for GW {live_gw.gw_number}.")

        async with db.tx() as transaction:
            await transaction.gameweek.update(where={'id': live_gw.id}, data={'status': 'FINISHED'})
            alog.info(f"Set GW {live_gw.gw_number} status to FINISHED.")
            if upcoming_gw:
                await transaction.gameweek.update(where={'id': upcoming_gw.id}, data={'status': 'LIVE'})
                alog.info(f"Set GW {upcoming_gw.gw_number} status to LIVE.")

        final_message = f"Gameweek {live_gw.gw_number} finalized."
        if upcoming_gw:
            final_message += f" Gameweek {upcoming_gw.gw_number} is now live."
        return {"message": final_message}
    except Exception as e:
        alog.error(f"Error finalizing gameweek {gameweek_id}: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

