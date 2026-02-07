import random
import logging
from typing import List, Dict, Any
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
from collections import Counter
import uuid
from app.utils.stats_utils import calculate_breakdown

logger = logging.getLogger(__name__)

# --- REMOVED THE CIRCULAR IMPORT HERE ---

async def save_user_team(db: Prisma, user_id: str, gameweek_id: int, team_name: str, players: list[dict]):
    logger.info(f"Saving team for user {user_id}, GW {gameweek_id}")
    try:
        await db.fantasyteam.upsert(
            where={'user_id': user_id},
            data={
                'create': {'name': team_name, 'user_id': user_id},
                'update': {'name': team_name}
            }
        )

        await db.userteam.delete_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id}
        )

        # 1. Create the map to look up flags (is_captain, is_benched)
        input_map = {p["id"]: p for p in players}
        
        # 2. Extract just the IDs as a list for Prisma
        player_ids = list(input_map.keys()) 

        if len(player_ids) != 11:
            raise HTTPException(status_code=400, detail="A full squad of 11 players is required.")

        # 3. FIX: Pass the LIST of IDs, not the dictionary
        player_objects = await db.player.find_many(where={'id': {'in': player_ids}})

        if len(player_objects) != 11:
             raise HTTPException(status_code=400, detail="Invalid player IDs provided.")

        team_to_create = []
        for p_obj in player_objects:
            p_input = input_map[p_obj.id]
            
            team_to_create.append({
                'user_id': user_id,
                'gameweek_id': gameweek_id,
                'player_id': p_obj.id,
                'is_captain': p_input.get('is_captain', False),
                'is_vice_captain': p_input.get('is_vice_captain', False),
                
                # ✅ TRUST THE INPUT (which comes from auto_correct)
                'is_benched': p_input.get('is_benched', False) 
            })
        
        # 4. Final safety check: ensure captain/vice exist (in case input was weird)
        captains = [t for t in team_to_create if t['is_captain']]
        if not captains:
            starters = [t for t in team_to_create if not t['is_benched']]
            if starters: starters[0]['is_captain'] = True
                
        vices = [t for t in team_to_create if t['is_vice_captain']]
        if not vices:
            starters = [t for t in team_to_create if not t['is_benched'] and not t['is_captain']]
            if starters: starters[0]['is_vice_captain'] = True

        await db.userteam.create_many(data=team_to_create)
        logger.info("Team saved successfully")

    except HTTPException:
            raise
    except Exception as e:
        logger.error(f"Error in save_user_team for user {user_id}", exc_info=True)
        raise e

async def carry_forward_team(db: Prisma, user_id: str, new_gameweek_id: int):
    try:
        # 1. Check if the user already has a team for this GW
        existing = await db.userteam.find_first(
            where={'user_id': user_id, 'gameweek_id': new_gameweek_id}
        )
        if existing:
            return  # Already exists, no need to copy

        # 2. Find the latest gameweek before this one
        prev_entry = await db.userteam.find_first(
            where={'user_id': user_id, 'gameweek_id': {'lt': new_gameweek_id}},
            order={'gameweek_id': 'desc'}
        )
        if not prev_entry:
            return  # User has no previous team (maybe new user)

        prev_gw_id = prev_entry.gameweek_id
        prev_team: List = await db.userteam.find_many(
            where={'user_id': user_id, 'gameweek_id': prev_gw_id}
        )

        if not prev_team:
            return

        # 3. Copy forward into new gameweek
        team_to_create = [
            {
                'user_id': user_id,
                'gameweek_id': new_gameweek_id,
                'player_id': entry.player_id,
                'is_captain': entry.is_captain,
                'is_vice_captain': entry.is_vice_captain,
                'is_benched': entry.is_benched,
            }
            for entry in prev_team
        ]
        cap_count = sum(1 for e in prev_team if e.is_captain)
        vice_count = sum(1 for e in prev_team if e.is_vice_captain)
        if cap_count != 1 or vice_count != 1:
            starters = [e for e in prev_team if not e.is_benched]
            if starters:
                for e in prev_team:
                    e.is_captain = False
                    e.is_vice_captain = False
                starters[0].is_captain = True
                if len(starters) > 1:
                    starters[1].is_vice_captain = True
        await db.userteam.create_many(data=team_to_create)
        logger.info(f"Carried forward team for user {user_id} to GW {new_gameweek_id}")

    except Exception as e:
        logger.error(f"Error carrying forward team for user {user_id}", exc_info=True)
        raise e

async def get_user_team_full(db: Prisma, user_id: str, gameweek_id: int):
    logger.info(f"Fetching team for user_id={user_id}, gameweek_id={gameweek_id}")

    # 0) Ensure team exists and auto-carry forward
    await carry_forward_team(db, user_id, gameweek_id)
    fantasy_team = await db.fantasyteam.find_unique(where={'user_id': user_id})
    if not fantasy_team:
        logger.warning(f"No fantasy team found for user {user_id}")
        return {"team_name": "", "starting": [], "bench": []}

    # 1) Load current user team entries + player + club
    entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': {'include': {'team': True}}},
        order={'player_id': 'asc'}
    )
    logger.info(f"User team entries fetched: {len(entries)}")
    if not entries:
        # FIX 2: Add active_chip here (This is where your specific error triggered)
        return {
            "team_name": fantasy_team.name, 
            "starting": [], 
            "bench": [], 
            "active_chip": None
        }

    player_ids: List[int] = [e.player_id for e in entries]
    team_ids: List[int] = list({e.player.team_id for e in entries})

    # 2) Points and raw stats for current GW
    stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id, 'player_id': {'in': player_ids}}
    )
    logger.info(f"Stats fetched for {len(stats)} players")
    pts_map: Dict[int, int] = {s.player_id: s.points for s in stats}
    stats_map: Dict[int, Any] = {s.player_id: s for s in stats}

    # 3) Get current gameweek object (needed for 'recent fixtures' logic)
    cur_gw = await db.gameweek.find_unique(where={'id': gameweek_id})
    if not cur_gw:
        raise HTTPException(status_code=404, detail="Gameweek not found")

    # 4) Build fixture_str for CURRENT GW
    fixture_map_current: Dict[int, str] = {}
    fixtures_current = await db.fixture.find_many(
        where={
            'gameweek_id': gameweek_id,
            'OR': [
                {'home_team_id': {'in': team_ids}},
                {'away_team_id': {'in': team_ids}},
            ]
        },
        include={'home': True, 'away': True}
    )

    def fmt_fixture(opp_short: str, venue: str) -> str:
        return f"{opp_short} ({venue}) "

    for f in fixtures_current:
        if f.home_team_id in team_ids:
            fixture_map_current[f.home_team_id] = fmt_fixture(f.away.short_name, 'H')
        if f.away_team_id in team_ids:
            fixture_map_current[f.away_team_id] = fmt_fixture(f.home.short_name, 'A')

    # 5) Recent fixtures (last two + current) with points per player
    gw_rows = await db.gameweek.find_many(
        where={"gw_number": {"gte": max(1, cur_gw.gw_number - 2), "lte": cur_gw.gw_number}},
        order={"gw_number": "asc"}
    )
    gw_id_to_num: Dict[int, int] = {g.id: g.gw_number for g in gw_rows}
    recent_gw_ids: List[int] = [g.id for g in gw_rows]

    fixtures_recent = await db.fixture.find_many(
        where={
            "gameweek_id": {"in": recent_gw_ids},
            "OR": [
                {"home_team_id": {"in": team_ids}},
                {"away_team_id": {"in": team_ids}},
            ],
        },
        include={"home": True, "away": True},
        order={"kickoff": "asc"}
    )

    fixtures_by_team: Dict[int, List[Any]] = {}
    for f in fixtures_recent:
        fixtures_by_team.setdefault(f.home_team_id, []).append(f)
        fixtures_by_team.setdefault(f.away_team_id, []).append(f)

    recent_stats = await db.gameweekplayerstats.find_many(
        where={"player_id": {"in": player_ids}, "gameweek_id": {"in": recent_gw_ids}}
    )
    pts_by_player_gw: Dict[tuple[int, int], int] = {
        (s.player_id, s.gameweek_id): int(s.points or 0) for s in recent_stats
    }

    # def _breakdown_for(position: str, st: Any) -> tuple[dict, list[dict]]:
    #     raw = {
    #         "played": bool(st.played or False),
    #         "goals_scored": int(st.goals_scored or 0),
    #         "assists": int(st.assists or 0),
    #         "yellow_cards": int(st.yellow_cards or 0),
    #         "red_cards": int(st.red_cards or 0),
    #         "bonus_points": int(st.bonus_points or 0),
    #         "clean_sheets": int(st.clean_sheets or 0),
    #     }
    #     pos = (position or "").upper()
    #     goal_pts = 10 if pos == "GK" else 6 if pos == "DEF" else 5 if pos == "MID" else 4
    #     if pos in ["GK", "DEF"]:
    #         cs_pts = 4 
    #     elif pos == "MID":
    #         cs_pts = 1
    #     else:
    #         cs_pts = 0
    #     breakdown = [
    #         {"label": "Appearance",   "value": 1 if raw["played"] else 0, "points": 1 if raw["played"] else 0},
    #         {"label": "Goals",        "value": raw["goals_scored"],            "points": raw["goals_scored"] * goal_pts},
    #         {"label": "Assists",      "value": raw["assists"],                 "points": raw["assists"] * 3},
    #         {"label": "Clean Sheet",  "value": raw["clean_sheets"],       "points": raw["clean_sheets"] * cs_pts},
    #         {"label": "Yellow cards", "value": raw["yellow_cards"],            "points": -1 * raw["yellow_cards"]},
    #         {"label": "Red cards",    "value": raw["red_cards"],               "points": -3 * raw["red_cards"]},
    #         {"label": "Bonus",        "value": raw["bonus_points"],            "points": raw["bonus_points"]},
    #     ]
    #     return raw, breakdown

    # 6) Shape response objects
    def to_display(entry):
        club = entry.player.team
        out = {
            "id": entry.player.id,
            "full_name": entry.player.full_name,
            "position": entry.player.position,
            "price": entry.player.price,
            "is_captain": entry.is_captain,
            "is_vice_captain": entry.is_vice_captain,
            "team": {"id": club.id, "name": club.name, "short_name": club.short_name},
            "is_benched": entry.is_benched,
            "points": pts_map.get(entry.player.id, 0),
            "fixture_str": fixture_map_current.get(club.id, "—"),
        }

        st = stats_map.get(entry.player.id)
        if st:
            raw, br = calculate_breakdown(entry.player.position, st)
            out["raw_stats"] = raw
            out["breakdown"] = br
        else:
            out["raw_stats"] = None
            out["breakdown"] = None

        rows = []
        for f in fixtures_by_team.get(club.id, []):
            gw_num = gw_id_to_num.get(f.gameweek_id)
            if not gw_num:
                continue
            is_home = (f.home_team_id == club.id)
            opp = f.away.short_name if is_home else f.home.short_name
            pts = pts_by_player_gw.get((entry.player.id, f.gameweek_id), 0)
            rows.append({"gw": gw_num, "opp": opp, "ha": "H" if is_home else "A", "points": pts})
        out["recent_fixtures"] = rows

        return out

    all_players = [to_display(e) for e in entries]
    starting = [p for p in all_players if not p["is_benched"]]
    bench = [p for p in all_players if p["is_benched"]]

    # --- NEW: Fetch Active Chip ---
    active_chip_row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )
    # Convert to string to ensure Pydantic validation passes (avoids 500 error)
    active_chip = str(active_chip_row.chip) if active_chip_row else None

    return {
        "team_name": fantasy_team.name,
        "starting": starting,
        "bench": bench,
        "active_chip": active_chip
    }

async def get_player_card(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    player_id: int,
) -> Dict[str, Any]:
    # 0) verify membership in team and load player + club
    ut = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': player_id},
        include={'player': {'include': {'team': True}}},
    )
    if not ut:
        raise HTTPException(404, "Player not in your team for this gameweek.")

    player = ut.player
    club = player.team

    # 1) current GW stat row for this player
    st = await db.gameweekplayerstats.find_first(
        where={'gameweek_id': gameweek_id, 'player_id': player_id}
    )

    def _breakdown_for(position: str, st_row: Any) -> tuple[Dict[str, int], List[Dict[str, int | str]]]:
        if not st_row:
            return {}, []
        raw = {
            "played": bool(st_row.played or False),
            "goals_scored": int(st_row.goals_scored or 0),
            "assists": int(st_row.assists or 0),
            "yellow_cards": int(st_row.yellow_cards or 0),
            "red_cards": int(st_row.red_cards or 0),
            "bonus_points": int(st_row.bonus_points or 0),
            "penalties_missed": int(st_row("penalties_missed")),
            "own_goals": int(st_row("own_goals")),
        }
        pos = (position or "").upper()
        goal_pts = 10 if pos == "GK" else 6 if pos == "DEF" else 5 if pos == "MID" else 4
        breakdown = [
            {"label": "Appearance",   "value": 1 if raw["played"] else 0, "points": 1 if raw["played"] else 0},
            {"label": "Goals",        "value": raw["goals_scored"],            "points": raw["goals_scored"] * goal_pts},
            {"label": "Assists",      "value": raw["assists"],                 "points": raw["assists"] * 3},
            {"label": "Bonus",        "value": raw["bonus_points"],            "points": raw["bonus_points"]},
            {"label": "Yellow cards", "value": raw["yellow_cards"],            "points": -1 * raw["yellow_cards"]},
            {"label": "Red cards",    "value": raw["red_cards"],               "points": -3 * raw["red_cards"]},
            {"label": "Penalty Miss", "value": raw["penalties_missed"],   "points": -2 * raw["penalties_missed"]},
            {"label": "Own Goal",     "value": raw["own_goals"],          "points": -2 * raw["own_goals"]},
            {"label": "Bonus",        "value": raw["bonus_points"],            "points": raw["bonus_points"]},
        ]
        return raw, breakdown

    raw_stats, breakdown = _breakdown_for(player.position, st)
    total_points = int(st.points) if st and st.points is not None else 0

    # 2) recent fixtures: last two + current
    cur_gw = await db.gameweek.find_unique(where={'id': gameweek_id})
    if not cur_gw:
        raise HTTPException(404, "Gameweek not found")

    gw_rows = await db.gameweek.find_many(
        where={"gw_number": {"gte": max(1, cur_gw.gw_number - 2), "lte": cur_gw.gw_number}},
        order={"gw_number": "asc"}
    )
    gw_id_to_num: Dict[int, int] = {g.id: g.gw_number for g in gw_rows}
    recent_gw_ids: List[int] = [g.id for g in gw_rows]

    fixtures_recent = await db.fixture.find_many(
        where={
            "gameweek_id": {"in": recent_gw_ids},
            "OR": [
                {"home_team_id": club.id},
                {"away_team_id": club.id},
            ],
        },
        include={"home": True, "away": True},
        order={"kickoff": "asc"}
    )

    recent_stats = await db.gameweekplayerstats.find_many(
        where={"player_id": player_id, "gameweek_id": {"in": recent_gw_ids}}
    )
    pts_by_gw: Dict[int, int] = {s.gameweek_id: int(s.points or 0) for s in recent_stats}

    recent_fixtures: List[Dict[str, Any]] = []
    for f in fixtures_recent:
        gw_num = gw_id_to_num.get(f.gameweek_id)
        if not gw_num:
            continue
        is_home = f.home_team_id == club.id
        opp = f.away.short_name if is_home else f.home.short_name
        recent_fixtures.append({
            "gw": gw_num,
            "opp": opp,
            "ha": "H" if is_home else "A",
            "points": pts_by_gw.get(f.gameweek_id, 0),
        })

    return {
        "id": player.id,
        "full_name": player.full_name,
        "position": player.position,
        "price": player.price,
        "team": {"id": club.id, "name": club.name, "short_name": club.short_name} if club else None,
        "is_captain": bool(ut.is_captain),
        "is_vice_captain": bool(ut.is_vice_captain),
        "is_benched": bool(ut.is_benched),
        "points": total_points,
        "raw_stats": raw_stats or None,
        "breakdown": breakdown or None,
        "recent_fixtures": recent_fixtures,
    }

async def save_existing_team(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    new_players: List[Dict],
):
    existing = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )
    existing_ids = {e.player_id for e in existing}

    if not isinstance(new_players, list) or len(new_players) == 0:
        raise HTTPException(400, "Players payload is empty.")

    try:
        incoming_ids = [int(p['id']) for p in new_players if p and 'id' in p]
    except Exception:
        raise HTTPException(400, "All players must include a valid integer 'id'.")

    if len(incoming_ids) != 11:
        raise HTTPException(400, f"Exactly 11 players are required (got {len(incoming_ids)}).")
    if len(set(incoming_ids)) != 11:
        raise HTTPException(400, "Duplicate players detected in payload.")

    def b(v): return bool(v)
    attrs_map: Dict[int, Dict] = {int(p['id']): p for p in new_players if p and 'id' in p}

    to_create = []
    for pid in incoming_ids:
        p = attrs_map[pid]
        to_create.append({
            'user_id': user_id,
            'gameweek_id': gameweek_id,
            'player_id': pid,
            'is_captain': b(p.get('is_captain', False)),
            'is_vice_captain': b(p.get('is_vice_captain', False)),
            'is_benched': b(p.get('is_benched', False)),
            'bench_priority': p.get('bench_priority', None),
        })

    captains = [t for t in to_create if t['is_captain']]
    vices    = [t for t in to_create if t['is_vice_captain']]
    benched  = [t for t in to_create if t['is_benched']]
    starters = [t for t in to_create if not t['is_benched']]

    if len(benched) != 3:
        raise HTTPException(400, f"Exactly 3 players must be benched (got {len(benched)}).")
    if len(starters) != 8:
        raise HTTPException(400, "Exactly 8 players must be in the starting XI.")
    if len(captains) != 1:
        raise HTTPException(400, "Exactly 1 captain is required.")
    if len(vices) != 1:
        raise HTTPException(400, "Exactly 1 vice-captain is required.")
    if captains[0]['player_id'] == vices[0]['player_id']:
        raise HTTPException(400, "Captain and vice-captain must be different players.")
    if any(t['player_id'] == captains[0]['player_id'] for t in benched) or \
       any(t['player_id'] == vices[0]['player_id'] for t in benched):
        raise HTTPException(400, "Captain and vice-captain cannot be benched.")

    players_meta = await db.player.find_many(where={'id': {'in': incoming_ids}})
    if len(players_meta) != 11:
        raise HTTPException(400, "Some player IDs do not exist.")
    
    meta_map = {p.id: p for p in players_meta}

    start_pos = []
    for s in starters:
        player_obj = meta_map.get(s['player_id'])
        start_pos.append(player_obj.position)
    
    pos_counts = Counter(start_pos)
    
    if pos_counts['GK'] != 1:
        raise HTTPException(400, "Invalid Formation: Starting XI must have exactly 1 Goalkeeper.")
    
    if pos_counts['DEF'] < 2: 
        raise HTTPException(400, "Invalid Formation: Starting XI must have at least 2 Defenders.")

    if pos_counts['FWD'] < 1:
        raise HTTPException(400, "Invalid Formation: Starting XI must have at least 1 Forward.")

    gks = [p.id for p in players_meta if p.position == 'GK']
    if len(gks) != 2:
        raise HTTPException(400, f"Exactly 2 goalkeepers are required in the squad.")

    benched_ids = {t['player_id'] for t in benched}
    benched_gks = [pid for pid in gks if pid in benched_ids]
    if len(benched_gks) != 1:
        raise HTTPException(400, f"Exactly 1 goalkeeper must be benched.")

    incoming_set = set(incoming_ids)
    removed_ids = existing_ids - incoming_set
    added_ids   = incoming_set - existing_ids

    async with db.tx() as tx:
        await tx.userteam.delete_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id}
        )

        await tx.userteam.create_many(data=to_create)

        for out_id in removed_ids:
            await tx.transfer_log.create(
                data={
                    'user_id': user_id,
                    'gameweek_id': gameweek_id,
                    'out_player': int(out_id),
                    'in_player': None,
                }
            )
        for in_id in added_ids:
            await tx.transfer_log.create(
                data={
                    'user_id': user_id,
                    'gameweek_id': gameweek_id,
                    'out_player': None,
                    'in_player': int(in_id),
                }
            )

    return await get_user_team_full(db, user_id, gameweek_id)

async def set_captain(db: Prisma, user_id: str, gameweek_id: int, player_id: int):
    ut = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': player_id}
    )
    if not ut:
        raise HTTPException(status_code=404, detail="Player not in your team for this gameweek.")
    if ut.is_benched:
        raise HTTPException(status_code=400, detail="Captain must be a starter (cannot be benched).")

    async with db.tx() as tx:
        await tx.userteam.update_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'is_captain': True},
            data={'is_captain': False}
        )
        await tx.userteam.update_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': player_id},
            data={'is_captain': True}
        )
    return {"ok": True}

async def set_vice_captain(db: Prisma, user_id: str, gameweek_id: int, player_id: int):
    ut = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': player_id}
    )
    if not ut:
        raise HTTPException(status_code=404, detail="Player not in your team for this gameweek.")
    if ut.is_benched:
        raise HTTPException(status_code=400, detail="Vice-captain must be a starter (cannot be benched).")

    async with db.tx() as tx:
        await tx.userteam.update_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'is_vice_captain': True},
            data={'is_vice_captain': False}
        )
        await tx.userteam.update_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': player_id},
            data={'is_vice_captain': True}
        )
    return {"ok": True}

async def auto_correct_squad_formation(db: Prisma, players: list[schemas.PlayerSelection]) -> list[schemas.PlayerSelection]:
    if len(players) != 11:
        raise HTTPException(status_code=400, detail="Squad must contain exactly 11 players.")

    player_ids = [p.id for p in players]
    db_players = await db.player.find_many(where={'id': {'in': player_ids}})
    
    input_map = {p.id: p for p in players}
    
    rich_players = []
    for p_db in db_players:
        p_in = input_map.get(p_db.id)
        rich_players.append({
            'id': p_db.id,
            'position': p_db.position,
            'is_captain': p_in.is_captain if p_in else False,
            'is_vice_captain': p_in.is_vice_captain if p_in else False,
            'is_benched': True
        })

    gks = [p for p in rich_players if p['position'] == 'GK']
    defs = [p for p in rich_players if p['position'] == 'DEF']
    mids = [p for p in rich_players if p['position'] == 'MID']
    fwds = [p for p in rich_players if p['position'] == 'FWD']

    starters = []
    
    if gks: starters.extend(gks[:1])
    
    if len(defs) >= 2: starters.extend(defs[:2])
    else: starters.extend(defs)
    
    if len(mids) >= 3: starters.extend(mids[:3])
    else: starters.extend(mids)

    if len(fwds) >= 2: starters.extend(fwds[:2])
    else: starters.extend(fwds)

    if len(starters) < 8:
        current_ids = {p['id'] for p in starters}
        remaining = [p for p in rich_players if p['id'] not in current_ids]
        
        needed = 8 - len(starters)
        fillers = [p for p in remaining if p['position'] != 'GK']
        if len(fillers) < needed:
            fillers = remaining
            
        starters.extend(fillers[:needed])

    starter_ids = {p['id'] for p in starters}
    for p in rich_players:
        if p['id'] in starter_ids:
            p['is_benched'] = False
        else:
            p['is_benched'] = True

        if p['is_benched']:
            p['is_captain'] = False
            p['is_vice_captain'] = False

    active_starters = [p for p in rich_players if not p['is_benched']]
    if not any(p['is_captain'] for p in active_starters):
        cap_choice = next((p for p in active_starters if p['position'] == 'FWD'), 
                     next((p for p in active_starters if p['position'] == 'MID'), active_starters[0]))
        cap_choice['is_captain'] = True

    return [schemas.PlayerSelection(**p) for p in rich_players]

async def get_public_team_view(db: Prisma, user_key: str, gameweek_number: int):
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

    # 1. Get Team Data
    data = await get_user_team_full(db, str(user.id), gw.id)
    if not data:
        raise HTTPException(status_code=404, detail="No fantasy team found for this user/gameweek")
    
    from app.services.stats_service import get_leaderboard

    # 2. Get Overall Stats from Leaderboard
    try:
        lb = await get_leaderboard(db)
        me = next((r for r in lb if r.get("user_id") == str(user.id)), None)
        overall_points = int(me["total_points"]) if me else 0
        overall_rank = int(me["rank"]) if me and me.get("rank") is not None else None
    except Exception:
        overall_points, overall_rank = 0, None

    # 3. Get Specific Gameweek Score
    try:
        ugws = await db.usergameweekscore.find_first(
            where={"user_id": str(user.id), "gameweek_id": gw.id}
        )
        gw_points = int((ugws.total_points or 0) - (ugws.transfer_hits or 0)) if ugws else 0
    except Exception:
        gw_points = 0

    # 4. --- NEW LOGIC: Calculate Gameweek Average, Highest, and Rank ---
    all_gw_scores = await db.usergameweekscore.find_many(
        where={"gameweek_id": gw.id}
    )

    avg_points = 0
    max_points = 0
    gw_rank_str = "-"

    if all_gw_scores:
        # Calculate scores as (total - hits) to be fair, or just total_points based on league rules
        # Usually GW Rank is based on Total Points (before hits) or Net Points. 
        # Standard FPL uses Net Points for Head-to-Head but Gross for GW Rank usually? 
        # Actually, let's stick to Net Points (Total - Hits) as that's what 'gameweek_points' displays above.
        
        scores_list = []
        for s in all_gw_scores:
            net_score = (s.total_points or 0) - (s.transfer_hits or 0)
            scores_list.append({"uid": s.user_id, "score": net_score})
        
        # Sort descending
        scores_list.sort(key=lambda x: x["score"], reverse=True)

        if scores_list:
            max_points = scores_list[0]["score"]
            total_sum = sum(item["score"] for item in scores_list)
            avg_points = round(total_sum / len(scores_list))

            # Find rank
            # Handling ties: if scores are [50, 50, 40], ranks are 1, 1, 3
            current_rank = 0
            prev_score = None
            true_rank = 0
            
            for idx, item in enumerate(scores_list):
                if item["score"] != prev_score:
                    true_rank = idx + 1
                    prev_score = item["score"]
                
                if item["uid"] == str(user.id):
                    gw_rank_str = str(true_rank)
                    break

    manager_name = user.full_name or (user.email or "").split("@")[0]

    return {
        **data,
        "manager_name": data.get("manager_name") or manager_name,
        "stats": data.get("stats") or {
            "overall_points": overall_points,
            "total_players": len(data.get("starting") or []) + len(data.get("bench") or []),
            "gameweek_points": gw_points,
        },
        "overallRank": data.get("overallRank") or overall_rank,
        
        # --- Added Fields ---
        "average_points": avg_points,
        "highest_points": max_points,
        "gw_rank": gw_rank_str,
        "transfers": str(user.free_transfers)
    }
    