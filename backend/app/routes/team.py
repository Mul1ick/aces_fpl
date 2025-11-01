from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app import schemas, crud
from app.auth import get_current_user
from prisma import Prisma
from prisma import models as PrismaModels # Import Prisma's generated models
from app.schemas import SetArmbandRequest,SaveTeamPayload
import uuid
from collections import Counter
from typing import Optional
router = APIRouter()

async def auto_correct_squad_formation(db: Prisma, players: list[schemas.PlayerSelection]) -> list[schemas.PlayerSelection]:
    """
    Analyzes an 11-player squad, fetches their positions from the DB,
    and performs automated substitutions to ensure a valid 8-player starting formation.
    Returns the corrected list of players.
    """
    if len(players) != 11:
        raise HTTPException(status_code=400, detail="Squad must contain exactly 11 players.")

    player_ids = [p.id for p in players]
    db_players = await db.player.find_many(where={'id': {'in': player_ids}})
    player_map = {p.id: p for p in db_players}

    # Combine input data (is_benched) with DB data (position)
    rich_players = []
    for p_select in players:
        db_player = player_map.get(p_select.id)
        if db_player:
            rich_players.append({
                'id': db_player.id,
                'position': db_player.position,
                'is_benched': p_select.is_benched,
                'is_captain': p_select.is_captain,
                'is_vice_captain': p_select.is_vice_captain
            })

    # Separate into starters and bench for easier logic
    starters = [p for p in rich_players if not p['is_benched']]
    bench = [p for p in rich_players if p['is_benched']]

    # --- Auto-Correction Logic ---
    # This loop continues until the formation is valid
    while True:
        counts = Counter(p['position'] for p in starters)
        is_valid = (
            len(starters) == 8 and
            counts.get('GK', 0) == 1 and
            counts.get('DEF', 0) >= 2 and
            counts.get('MID', 0) >= 1 and
            counts.get('FWD', 0) >= 1
        )
        if is_valid:
            break

        # --- FIXING LOGIC ---
        # Rule 1: Fix Goalkeepers (must be exactly 1)
        if counts.get('GK', 0) < 1:
            gk_from_bench = next((p for p in bench if p['position'] == 'GK'), None)
            starter_to_bench = next((p for p in starters if p['position'] != 'GK'), None)
            if gk_from_bench and starter_to_bench:
                starters.append(gk_from_bench)
                bench.remove(gk_from_bench)
                bench.append(starter_to_bench)
                starters.remove(starter_to_bench)
                continue # Restart validation

        if counts.get('GK', 0) > 1:
            extra_gk = next(p for p in starters if p['position'] == 'GK')
            player_from_bench = next((p for p in bench if p['position'] != 'GK'), None)
            if player_from_bench:
                bench.append(extra_gk)
                starters.remove(extra_gk)
                starters.append(player_from_bench)
                bench.remove(player_from_bench)
                continue

        # Rule 2: Fix minimum player counts for other positions
        for pos, min_count in [('DEF', 2), ('MID', 1), ('FWD', 1)]:
            if counts.get(pos, 0) < min_count:
                player_from_bench = next((p for p in bench if p['position'] == pos), None)
                # Bench a player from an over-represented position
                starter_to_bench = max(starters, key=lambda p: counts[p['position']] if p['position'] != 'GK' else -1)
                if player_from_bench and starter_to_bench:
                    starters.append(player_from_bench)
                    bench.remove(player_from_bench)
                    bench.append(starter_to_bench)
                    starters.remove(starter_to_bench)
                    continue

        # Rule 3: Ensure exactly 8 starters
        if len(starters) > 8:
            starter_to_bench = max(starters, key=lambda p: counts[p['position']] if p['position'] != 'GK' else -1)
            bench.append(starter_to_bench)
            starters.remove(starter_to_bench)
            continue
        if len(starters) < 8:
            player_from_bench = next((p for p in bench), None)
            if player_from_bench:
                starters.append(player_from_bench)
                bench.remove(player_from_bench)
                continue
        
        # Failsafe to prevent infinite loops on unfixable squads
        break

    # Re-assemble the list of PlayerSelection objects
    final_players = starters + bench
    for i, p in enumerate(final_players):
        p['is_benched'] = i >= 8
        # Ensure captaincy is only on starters
        if p['is_benched'] and (p['is_captain'] or p['is_vice_captain']):
            p['is_captain'] = False
            p['is_vice_captain'] = False

    # If no captain, assign it to the first forward
    if not any(p['is_captain'] for p in starters):
        first_fwd = next((p for p in starters if p['position'] == 'FWD'), None)
        if first_fwd: first_fwd['is_captain'] = True
        else: starters[0]['is_captain'] = True # Fallback

    return [schemas.PlayerSelection(**p) for p in final_players]
# --- END: AUTO-CORRECTION FUNCTION ---



@router.post("/submit-team")
async def submit_team(
    team: schemas.SubmitTeamRequest,
    db: Prisma = Depends(get_db),
    # CORRECT: Use the Prisma model for the type hint
    current_user: PrismaModels.User = Depends(get_current_user)
):
    
    corrected_players = await auto_correct_squad_formation(db, team.players)

    current_gameweek = await crud.get_current_gameweek(db)

    
    await crud.save_user_team(
        db=db,
        user_id=str(current_user.id), # Use str() for safety
        gameweek_id=current_gameweek.id,
        players=[p.dict() for p in corrected_players],
        team_name=team.team_name
    )

    return {"message": "Team submitted successfully"}

@router.get("/team/by-gameweek-number/{gameweek_number}", response_model=schemas.GetTeamResponse)
@router.get("/team", response_model=schemas.GetTeamResponse, include_in_schema=False)
async def get_team(
    gameweek_number: int | None = None,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    gameweek_id: int
    if gameweek_number is None:
        gw = await crud.get_current_gameweek(db)
        gameweek_id = gw.id
    else:
        # --- MODIFIED: Find the gameweek by its number to get the ID ---
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail=f"Gameweek {gameweek_number} not found.")
        gameweek_id = gw.id
    
    print(f"✅ LOG: Gameweek Number {gameweek_number} corresponds to ID {gameweek_id}")
    
    try:
        result = await crud.get_user_team_full(db, str(current_user.id), gameweek_id)
        if not result:
            raise HTTPException(status_code=404, detail="Team not found for this gameweek")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

    
@router.post("/transfer", response_model=schemas.GetTeamResponse)
async def transfer_player_route(
    payload: schemas.TransferRequest,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user),
):
    current_gw = await crud.get_current_gameweek(db)
    updated = await crud.transfer_player(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=current_gw.id,
        out_player_id=payload.out_player_id,
        in_player_id=payload.in_player_id,
    )
    return updated



@router.post("/armband")
async def set_armband(
    payload: SetArmbandRequest,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_gw = await crud.get_current_gameweek(db)

    if payload.kind == "C":
        await crud.set_captain(db, str(current_user.id), current_gw.id, payload.player_id)
    else:
        await crud.set_vice_captain(db, str(current_user.id), current_gw.id, payload.player_id)

    return await crud.get_user_team_full(db, str(current_user.id), current_gw.id)

@router.post("/save-team")
async def save_team(
    payload: schemas.SaveTeamPayload,
    db: Prisma = Depends(get_db),
    user=Depends(get_current_user)
):
    # corrected_players = await auto_correct_squad_formation(db, payload.players)
    gw = await crud.get_current_gameweek(db)
    if not gw:
        raise HTTPException(404, "No gameweek")

    updated = await crud.save_existing_team(
        db=db,
        user_id=str(user.id),
        gameweek_id=gw.id,
        # CORRECTED: Convert Pydantic models to dictionaries
        new_players=[p.dict() for p in payload.players]
    )
    return updated


@router.get("/teams/{gameweek_id}/players/{player_id}/card")
async def get_player_card_endpoint(
    gameweek_id: int,
    player_id: int,
    db: Prisma = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    return await crud.get_player_card(db, current_user.id, gameweek_id, player_id)

@router.get("/user/{user_key}/by-gameweek-number/{gameweek_number}")
async def get_user_team_by_gameweek_number(
    user_key: str,
    gameweek_number: int,
    db: Prisma = Depends(get_db),
    _: PrismaModels.User = Depends(get_current_user),
):
    # resolve user by UUID or email
    user = None
    try:
        uuid.UUID(user_key)
        user = await db.user.find_unique(where={"id": user_key})
    except ValueError:
        user = await db.user.find_unique(where={"email": user_key})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    gw = await db.gameweek.find_unique(where={"gw_number": gameweek_number})
    if not gw:
        raise HTTPException(status_code=404, detail="Gameweek not found")

    # pass the resolved UUID, not the email
    data = await crud.get_user_team_full(db, str(user.id), gw.id)
    if not data:
        raise HTTPException(status_code=404, detail="No fantasy team found for this user/gameweek")
    
    try:
        lb = await crud.get_leaderboard(db)
        me = next((r for r in lb if r.get("user_id") == str(user.id)), None)
        overall_points = int(me["total_points"]) if me else 0
        overall_rank = int(me["rank"]) if me and me.get("rank") is not None else None
    except Exception:
        overall_points, overall_rank = 0, None

    # gameweek points for this GW (minus hits)
    try:
        ugws = await db.usergameweekscore.find_first(
            where={"user_id": str(user.id), "gameweek_id": gw.id}
        )
        gw_points = int((ugws.total_points or 0) - (ugws.transfer_hits or 0)) if ugws else 0
    except Exception:
        gw_points = 0

    # lightweight manager display
    manager_name = (user.email or "").split("@")[0]

    # attach without altering existing fields
    data = {
        **data,
        "manager_name": data.get("manager_name") or manager_name,
        "stats": data.get("stats") or {
            "overall_points": overall_points,
            "total_players": len(data.get("starting") or []) + len(data.get("bench") or []),
            "gameweek_points": gw_points,
        },
        "overallRank": data.get("overallRank") or overall_rank,
    }

    # optional: normalize shape here if needed
    return data

