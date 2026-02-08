import logging
import asyncio
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma

from app import schemas, auth
from app.database import get_db
from app.services import stats_service

# --- IMPORT SERVICES & REPOS (The new modular files) ---
from app.services.admin_task_service import (
    start_season_logic, 
    finalize_gameweek_logic,
    perform_gameweek_rollover_tasks
)
from app.services.stats_service import (
    get_dashboard_stats, 
    compute_user_score_for_gw
)
from app.services.fixture_service import (
    submit_fixture_stats_service, 
    get_fixture_stats_service
)
from app.services.autosub_service import process_autosubs_for_gameweek

# Repositories
from app.repositories.user_repo import (
    get_pending_users, 
    get_all_users, 
    approve_user, 
    bulk_approve_users, 
    get_user_by_id, 
    update_user_role, 
    user_has_team
)
from app.repositories.gameweek_repo import (
    get_current_gameweek
)
from app.repositories.team_repo import (
    get_all_teams_with_counts, 
    create_team, 
    update_team, 
    delete_team, 
    get_team_by_name_or_short, 
    get_team_by_id
)
from app.repositories.player_repo import (
    get_players_filtered, 
    create_player, 
    update_player, 
    delete_player, 
    get_player_by_id,
    count_players_in_team
)
from app.repositories.fixture_repo import (
    get_fixture_by_id
)

# Setup Logger
logger = logging.getLogger("aces.admin")

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- HELPER: PRE-ROLLOVER TEAMS ---
# --- HELPER: PRE-ROLLOVER TEAMS (With Free Hit Logic) ---
async def pre_rollover_teams(db: Prisma, current_gw_id: int):
    """
    Copies teams to the NEXT gameweek with Free Hit logic.
    - Normal Users: Copy from Current GW -> Next GW.
    - Free Hit Users: Copy from PREVIOUS GW -> Next GW (Restoring their original team).
    """
    logger.info("--- Starting Team Rollover with Chip Logic ---")

    # 1. Setup Gameweek Context
    current_gw = await db.gameweek.find_unique(where={'id': current_gw_id})
    if not current_gw: 
        logger.error("Current Gameweek not found.")
        return None
    
    current_gw_num = current_gw.gw_number
    next_gw_num = current_gw_num + 1
    prev_gw_num = current_gw_num - 1

    # 2. Find or Create Next Gameweek (Target)
    next_gw = await db.gameweek.find_first(where={'gw_number': next_gw_num})
    if not next_gw:
        # Create it if it doesn't exist (using 1 week later as placeholder deadline)
        from datetime import timedelta
        next_gw = await db.gameweek.create(data={
            'gw_number': next_gw_num,
            'status': 'UPCOMING',
            'deadline': current_gw.deadline + timedelta(days=7) 
        })
        logger.info(f"Created Next Gameweek {next_gw_num}")

    # 3. Idempotency Check (Don't run twice)
    if await db.userteam.count(where={'gameweek_id': next_gw.id}) > 0:
        logger.warning(f"Teams already exist for GW {next_gw_num}. Skipping rollover.")
        return next_gw

    # 4. Identify 'FREE_HIT' Users
    # We look for chips played in the CURRENT gameweek
    active_chips = await db.userchip.find_many(
        where={
            'gameweek_id': current_gw_id,
            'name': 'FREE_HIT'  # Ensure this matches your enum/string exactly
        }
    )
    free_hit_user_ids = {chip.user_id for chip in active_chips}
    logger.info(f"Found {len(free_hit_user_ids)} users with Free Hit active.")

    # 5. Locate Previous Gameweek (The 'Restore Point')
    prev_gw = await db.gameweek.find_first(where={'gw_number': prev_gw_num})
    prev_gw_id = prev_gw.id if prev_gw else None

    # 6. Build the New Roster
    new_teams_data = []
    
    # Get all active users
    users = await db.user.find_many(where={'is_active': True})
    
    for user in users:
        source_gw_id = None
        
        # --- LOGIC CORE ---
        if user.id in free_hit_user_ids:
            if prev_gw_id:
                # User played Free Hit -> Revert to PREVIOUS week
                source_gw_id = prev_gw_id
                logger.info(f"User {user.email}: Free Hit detected. Reverting team from GW {prev_gw_num}.")
            else:
                # Edge Case: Played Free Hit in GW 1 (Impossible, but fallback safely)
                source_gw_id = current_gw_id
                logger.warning(f"User {user.email}: Free Hit in GW 1? Copying current team.")
        else:
            # Normal -> Copy CURRENT week
            source_gw_id = current_gw_id

        # Fetch the squad from the source week
        source_team = await db.userteam.find_many(
            where={'gameweek_id': source_gw_id, 'user_id': user.id}
        )
        
        if not source_team:
            continue

        # Prepare rows for the Next Gameweek
        for entry in source_team:
            new_teams_data.append({
                'user_id': user.id,
                'player_id': entry.player_id,
                'gameweek_id': next_gw.id,
                # Crucial: Copy the 'is_benched' state from the source.
                # If reverting, this puts their old players back on the bench correctly.
                'is_benched': entry.is_benched,
                'is_captain': entry.is_captain,
                'is_vice_captain': entry.is_vice_captain,
            })

    # 7. Batch Insert
    if new_teams_data:
        await db.userteam.create_many(data=new_teams_data)
        logger.info(f"Rollover Complete. {len(new_teams_data)} rows created for GW {next_gw_num}.")

    return next_gw

# --- SEASON & GAMEWEEK LIFECYCLE ---

@router.post("/gameweeks/start-season")
async def start_season(db: Prisma = Depends(get_db)):
    first_gw = await start_season_logic(db)
    return {"message": f"Season started! Gameweek {first_gw.gw_number} is now LIVE."}

@router.post("/gameweeks/{gameweek_id}/calculate-points")
async def calculate_gameweek_points(gameweek_id: int, db: Prisma = Depends(get_db)):
    try:
        # We can move this user-fetching logic to a service later if we want total purity,
        # but for now, the iteration happens here to keep the service function simple.
        users = await db.user.find_many(where={'is_active': True, 'fantasy_team': {'is_not': None}})
        if not users:
            return {"message": "No active users with teams to process."}
        
        for user in users:
            await compute_user_score_for_gw(db, str(user.id), gameweek_id)
            
        return {"message": f"Successfully calculated points for {len(users)} users."}
    except Exception as e:
        logger.error(f"Error calculating points for GW {gameweek_id}: {e}")
        raise HTTPException(status_code=500, detail="Point calculation failed.")

@router.post("/gameweeks/{gameweek_id}/finalize")
# FILE: backend/app/controllers/admin_routes.py

# ... (Previous imports remain the same)

# ... (Keep pre_rollover_teams function as is) ...

@router.post("/gameweeks/{gameweek_id}/finalize")
async def finalize_gameweek(gameweek_id: int, db: Prisma = Depends(get_db)):
    logger.info(f"--- Initiating Finalization for Gameweek ID {gameweek_id} ---")
    
    try:
        # STEP 1: ROLLOVER (CRITICAL FIX: Do this FIRST)
        # We copy the 'clean' teams (before autosubs) to the next gameweek.
        # This ensures players return to the bench next week.
        logger.info("Step 1: Rolling over teams to next Gameweek...")
        
        # We need to find the live gameweek to ensure we are rolling over the right one
        live_gw = await db.gameweek.find_unique(where={'id': gameweek_id})
        if not live_gw:
             raise HTTPException(status_code=404, detail="Gameweek not found.")

        # Execute the rollover logic immediately
        # Note: We reuse the logic from admin_task_service but call it here explicitly
        await perform_gameweek_rollover_tasks(db, gameweek_id)
        logger.info("Rollover complete. Original lineups preserved for next week.")

        # STEP 2: RUN AUTOSUBS
        # Now we can safely modify the CURRENT gameweek's teams without affecting next week.
        logger.info("Step 2: Running Automatic Substitutions for CURRENT Gameweek...")
        subs_count = await process_autosubs_for_gameweek(db, gameweek_id)
        logger.info(f"Autosubs complete. {subs_count} squads updated.")

        # STEP 3: RE-CALCULATE POINTS
        # Calculate points based on the new lineup (with subs in)
        logger.info("Step 3: Re-calculating points for all users...")
        users = await db.user.find_many(where={'is_active': True, 'fantasy_team': {'is_not': None}})
        if users:
            for user in users:
                await compute_user_score_for_gw(db, str(user.id), gameweek_id)
        logger.info("Points re-calculation complete.")

        # STEP 4: UPDATE STATUS
        # Finally, mark the gameweek as FINISHED and the next as LIVE
        logger.info("Step 4: Updating Gameweek Status...")
        
        # Logic extracted from finalize_gameweek_logic since we split the tasks
        upcoming_gw = await db.gameweek.find_first(where={'status': 'UPCOMING'}, order={'gw_number': 'asc'})
        
        async with db.tx() as transaction:
            await transaction.gameweek.update(where={'id': gameweek_id}, data={'status': 'FINISHED'})
            if upcoming_gw:
                await transaction.gameweek.update(where={'id': upcoming_gw.id}, data={'status': 'LIVE'})
        
        message = f"Gameweek {live_gw.gw_number} finalized. Teams rolled over. Autosubs run: {subs_count}."
        if upcoming_gw:
            message += f" Gameweek {upcoming_gw.gw_number} is now live."
        
        return {"message": message}
    
    except Exception as e:
        logger.error(f"Error finalizing gameweek {gameweek_id}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Finalization failed: {str(e)}")


# --- DATA VIEWING & ENTRY (DASHBOARD) ---

@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats_endpoint(db: Prisma = Depends(get_db)):
    stats = await get_dashboard_stats(db)
    if not stats:
        raise HTTPException(status_code=404, detail="Could not retrieve dashboard stats.")
    return stats


# --- USER MANAGEMENT ---

@router.get("/users/pending", response_model=List[schemas.UserOut])
async def get_pending_users_endpoint(db: Prisma = Depends(get_db)):
    users = await get_pending_users(db)
    # Enrich with team status
    flags = await asyncio.gather(*[user_has_team(db, str(u.id)) for u in users])
    
    return [
        {
            "id": str(u.id), "email": u.email, "full_name": u.full_name, 
            "role": u.role, "is_active": bool(u.is_active), 
            "has_team": flags[i], "free_transfers": u.free_transfers, 
            "played_first_gameweek": u.played_first_gameweek
        } 
        for i, u in enumerate(users)
    ]

@router.get("/users", response_model=schemas.PaginatedResponse[schemas.UserOut])
async def get_all_users_endpoint(
    db: Prisma = Depends(get_db), 
    page: int = Query(1, ge=1), 
    per_page: int = Query(20, ge=1, le=100), 
    search: Optional[str] = Query(None), 
    role: Optional[str] = Query(None)
):
    result = await get_all_users(db, page=page, per_page=per_page, search=search, role=role)
    enriched_items = []
    for u in result["items"]:
        has_team = await user_has_team(db, str(u.id))
        enriched_items.append({
            "id": str(u.id), "email": u.email, "full_name": u.full_name, 
            "role": u.role, "is_active": bool(u.is_active), 
            "has_team": has_team, "free_transfers": u.free_transfers, 
            "played_first_gameweek": u.played_first_gameweek
        })
    return {
        "items": enriched_items, "total": result["total"], 
        "page": result["page"], "per_page": result["per_page"], 
        "pages": result["pages"]
    }

@router.post("/users/{user_id}/approve", response_model=schemas.UserOut)
async def approve_user_endpoint(user_id: str, db: Prisma = Depends(get_db)):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated = await approve_user(db, user_id)
    has_team = await user_has_team(db, user_id)
    
    return {
        "id": str(updated.id), "email": updated.email, "full_name": updated.full_name, 
        "role": updated.role, "is_active": bool(updated.is_active), 
        "has_team": has_team, "free_transfers": updated.free_transfers, 
        "played_first_gameweek": updated.played_first_gameweek
    }

@router.post("/users/bulk-approve", response_model=dict)
async def bulk_approve_users_endpoint(request: schemas.BulkApproveRequest, db: Prisma = Depends(get_db)):
    result = await bulk_approve_users(db, request.user_ids)
    return {"message": f"Successfully approved {result} users."}

@router.post("/users/{user_id}/role", response_model=schemas.UserOut)
async def update_user_role_endpoint(user_id: str, request: schemas.UserUpdateRole, db: Prisma = Depends(get_db)):
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = await update_user_role(db, user_id, request.role)
    has_team = await user_has_team(db, str(updated_user.id))
    
    return {
        "id": str(updated_user.id), "email": updated_user.email, "full_name": updated_user.full_name, 
        "role": updated_user.role, "is_active": bool(updated_user.is_active), 
        "has_team": has_team, "free_transfers": updated_user.free_transfers, 
        "played_first_gameweek": updated_user.played_first_gameweek
    }


# --- TEAM MANAGEMENT ---

@router.get("/teams", response_model=list[schemas.TeamOutWithCount])
async def admin_list_teams(db: Prisma = Depends(get_db)):
    return await get_all_teams_with_counts(db)

@router.post("/teams", response_model=schemas.TeamOut)
async def admin_create_team(payload: schemas.TeamCreate, db: Prisma = Depends(get_db)):
    if await get_team_by_name_or_short(db, payload.name, payload.short_name):
        raise HTTPException(409, "Team with same name or short_name already exists")
    return await create_team(db, payload)

@router.put("/teams/{team_id}", response_model=schemas.TeamOut)
async def admin_update_team(team_id: int, payload: schemas.TeamUpdate, db: Prisma = Depends(get_db)):
    if not await get_team_by_id(db, team_id): 
        raise HTTPException(404, "Team not found")
    return await update_team(db, team_id, payload)

@router.delete("/teams/{team_id}", status_code=204)
async def admin_delete_team(team_id: int, db: Prisma = Depends(get_db)):
    if not await get_team_by_id(db, team_id): 
        raise HTTPException(404, "Team not found")
    if await count_players_in_team(db, team_id) > 0: 
        raise HTTPException(400, "Cannot delete team with players assigned")
    await delete_team(db, team_id)


# --- PLAYER MANAGEMENT ---

@router.get("/players", response_model=List[schemas.PlayerOut])
async def admin_list_players(
    db: Prisma = Depends(get_db), 
    q: Optional[str] = Query(None), 
    team: Optional[int] = Query(None), 
    position: Optional[str] = Query(None), 
    status: Optional[str] = Query(None)
):
    return await get_players_filtered(db, q, team, position, status)

@router.post("/players", response_model=schemas.PlayerOut)
async def admin_create_player(payload: schemas.PlayerCreate, db: Prisma = Depends(get_db)):
    return await create_player(db, payload)

@router.put("/players/{player_id}", response_model=schemas.PlayerOut)
async def admin_update_player(player_id: int, payload: schemas.PlayerUpdate, db: Prisma = Depends(get_db)):
    if not await get_player_by_id(db, player_id): 
        raise HTTPException(404, "Player not found")
    return await update_player(db, player_id, payload)

@router.delete("/players/{player_id}", status_code=204)
async def admin_delete_player(player_id: int, db: Prisma = Depends(get_db)):
    if not await get_player_by_id(db, player_id): 
        raise HTTPException(404, "Player not found")
    await delete_player(db, player_id)


# --- GAMEWEEK & FIXTURE DATA ---

@router.get("/gameweeks/current", response_model=schemas.GameweekOutWithFixtures)
async def admin_get_current_gameweek(db: Prisma = Depends(get_db)):
    gw = await get_current_gameweek(db) 
    # Redirect to details endpoint to fill fixtures
    return await admin_get_gameweek_by_id(gw.id, db)

@router.get("/gameweeks/{gameweek_id}", response_model=schemas.GameweekOutWithFixtures)
async def admin_get_gameweek_by_id(gameweek_id: int, db: Prisma = Depends(get_db)):
    # This specific query logic remains here because of the complex inclusion and transformation
    # Moving it to a repo is possible but would require a DTO object there.
    gw = await db.gameweek.find_unique(
        where={"id": gameweek_id}, 
        include={"fixtures": {"include": {"home": True, "away": True}, "order_by": {"id": "asc"}}}
    )
    if not gw: raise HTTPException(status_code=404, detail="Gameweek not found.")
    
    transformed_fixtures = []
    for f in gw.fixtures:
        fixture_dict = f.model_dump()
        fixture_dict['home_team'] = fixture_dict.pop('home')
        fixture_dict['away_team'] = fixture_dict.pop('away')
        transformed_fixtures.append(fixture_dict)
    
    response_data = gw.model_dump()
    response_data["fixtures"] = transformed_fixtures
    return response_data

@router.post("/gameweeks/{gameweek_id}/stats")
async def admin_submit_fixture_stats(gameweek_id: int, payload: schemas.SubmitFixtureStats, db: Prisma = Depends(get_db)):
    return await submit_fixture_stats_service(db, gameweek_id, payload)

@router.get("/fixtures/{fixture_id}/players", response_model=List[schemas.PlayerOut])
async def admin_fixture_players(fixture_id: int, db: Prisma = Depends(get_db)):
    fx = await get_fixture_by_id(db, fixture_id)
    if not fx: raise HTTPException(404, "Fixture not found")
    
    # We can use the generic player filter here or a direct query
    # Using direct query to match original behavior exactly
    return await db.player.find_many(
        where={"team_id": {"in": [fx.home_team_id, fx.away_team_id]}}, 
        include={"team": True}, 
        order={"full_name": "asc"}
    )

@router.get("/fixtures/{fixture_id}/stats", response_model=schemas.FixtureStatsOut)
async def admin_get_fixture_stats(fixture_id: int, db: Prisma = Depends(get_db)):
    return await get_fixture_stats_service(db, fixture_id)


@router.post("/gameweeks/{gameweek_id}/run-autosubs")
async def trigger_autosubs(gameweek_id: int, db: Prisma = Depends(get_db)):
    """
    Manually triggers the automatic substitution process.
    Should be run after all fixtures are finished and stats are entered,
    but BEFORE final rank calculation.
    """
    try:
        count = await process_autosubs_for_gameweek(db, gameweek_id)
        # Re-calculate points immediately after subs to reflect changes
        await calculate_gameweek_points(gameweek_id, db) 
        return {"message": f"Autosubs processed for {count} teams. Points recalculated."}
    except Exception as e:
        logger.error(f"Autosub error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.patch("/edit-stats")
async def edit_historical_stats(
    req: schemas.UpdatePlayerStatsRequest, 
    db: Prisma = Depends(get_db),
    admin=Depends(auth.get_current_admin_user) # Ensure only admin can access
):
    return await stats_service.update_historical_stats(db, req)