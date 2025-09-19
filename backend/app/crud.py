import random
from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from collections import Counter
from app import schemas, auth
from typing import Dict, List, Optional,Any
import logging
from decimal import Decimal
from uuid import UUID

logger = logging.getLogger(__name__)

# --- USER FUNCTIONS ---

async def get_user_by_email(db: Prisma, email: str):
    return await db.user.find_unique(where={"email": email})

async def get_user_by_id(db: Prisma, user_id: str):
    try:
        uuid_obj = UUID(user_id)
        return await db.user.find_unique(where={"id": str(uuid_obj)})
    except (ValueError, TypeError):
        return None
    
async def create_user(db: Prisma, user: schemas.UserCreate):
    hashed_pw = auth.hash_password(user.password)
    new_user = await db.user.create(
        data={
            'email': user.email, 
            'hashed_password': hashed_pw,
            'full_name': user.email.split('@')[0]
        }
    )
    return new_user

# --- ADMIN USER FUNCTIONS ---

async def get_pending_users(db: Prisma):
    return await db.user.find_many(where={'is_active': False})

async def get_all_users(db: Prisma, page: int, per_page: int, search: Optional[str] = None, role: Optional[str] = None):
    skip = (page - 1) * per_page
    
    # --- UPDATED --- Build the where clause dynamically
    where_clause = {}
    if search:
        where_clause['OR'] = [
            {'email': {'contains': search, 'mode': 'insensitive'}},
            {'full_name': {'contains': search, 'mode': 'insensitive'}},
        ]
    
    if role:
        where_clause['role'] = role

    total_users = await db.user.count(where=where_clause)
    users = await db.user.find_many(
        where=where_clause,
        skip=skip,
        take=per_page,
    )
    
    return {
        "items": users,
        "total": total_users,
        "page": page,
        "per_page": per_page,
        "pages": (total_users + per_page - 1) // per_page if per_page > 0 else 0
    }

async def approve_user(db: Prisma, user_id: str):
    await db.user.update(where={'id': user_id}, data={'is_active': True})
    return await db.user.find_unique(where={'id': user_id})

async def update_user_role(db: Prisma, user_id: str, role: str):
    await db.user.update(where={'id': user_id}, data={'role': role})
    return await db.user.find_unique(where={'id': user_id})

async def bulk_approve_users(db: Prisma, user_ids: List[UUID]):
    user_id_strs = [str(uid) for uid in user_ids]
    return await db.user.update_many(
        where={'id': {'in': user_id_strs}},
        data={'is_active': True}
    )

# --- (The rest of your existing crud.py file remains unchanged) ---

# --- ADMIN DASHBOARD FUNCTIONS ---

async def get_dashboard_stats(db: Prisma):
    pending_users_count = await db.user.count(where={'is_active': False})
    total_users_count = await db.user.count(where={'role': 'user'})
    total_players_count = await db.player.count()
    current_gw = await get_current_gameweek(db)
    
    recent_activities = [] # Placeholder for now

    return schemas.DashboardStats(
        pending_users=pending_users_count,
        total_users=total_users_count,
        total_players=total_players_count,
        current_gameweek=current_gw,
        recent_activities=recent_activities
    )

# --- GAMEWEEK FUNCTION ---

async def get_current_gameweek(db: Prisma):
    now_utc = datetime.now(timezone.utc)

    # try next upcoming (future deadline)
    gw = await db.gameweek.find_first(
        where={'deadline': {'gt': now_utc}},
        order={'deadline': 'asc'}
    )
    if not gw:
        # fallback: most recent past
        gw = await db.gameweek.find_first(order={'deadline': 'desc'})
        if not gw:
            raise HTTPException(status_code=404, detail="No gameweeks configured in the database.")

    # 🔑 build the API schema your frontend expects
    return schemas.Gameweek(
        id=gw.id,
        gw_number=gw.gw_number,
        deadline=gw.deadline,
        name=f"Gameweek {gw.gw_number}",
        finished=gw.deadline < now_utc,
        is_current=gw.deadline > now_utc,  # adjust if you track `is_current` in DB
        is_next=False,                     # adjust if you track `is_next` in DB
        data_checked=False,                # placeholder, update if stored in DB
    )


# --- TEAM FUNCTIONS ---

async def save_user_team(db: Prisma, user_id: str, gameweek_id: int, team_name: str, players: list[dict]):
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

    player_ids = [p["id"] for p in players]
    if len(player_ids) != 11:
        raise HTTPException(status_code=400, detail="A full squad of 11 players is required.")

    player_objects = await db.player.find_many(where={'id': {'in': player_ids}})

    goalkeepers = [p for p in player_objects if p.position == 'GK']
    if len(goalkeepers) != 2:
        raise HTTPException(status_code=400, detail="You must select exactly two goalkeepers.")
    
    outfielders = [p for p in player_objects if p.position != 'GK']
    benched_gk = random.choice(goalkeepers)
    benched_outfielders = random.sample(outfielders, 2)
    benched_ids = [p.id for p in benched_outfielders] + [benched_gk.id]
    
    starters = [p for p in player_objects if p.id not in benched_ids]
    starter_ids = [p.id for p in starters]

    captain_id = random.choice(starter_ids)
    remaining_starters = [pid for pid in starter_ids if pid != captain_id]
    vice_captain_id = random.choice(remaining_starters)

    team_to_create = [
        {
            'user_id': user_id,
            'gameweek_id': gameweek_id,
            'player_id': pid,
            'is_captain': (pid == captain_id),
            'is_vice_captain': (pid == vice_captain_id),
            'is_benched': (pid in benched_ids)
        }
        for pid in player_ids
    ]
    
    await db.userteam.create_many(data=team_to_create)

async def get_user_team_full(db: Prisma, user_id: str, gameweek_id: int):
    logger.info(f"Fetching team for user_id={user_id}, gameweek_id={gameweek_id}")

    # 0) Ensure team exists and auto-carry forward
    await carry_forward_team(db, user_id, gameweek_id)
    fantasy_team = await db.fantasyteam.find_unique(where={'user_id': user_id})
    if not fantasy_team:
        logger.warning("No fantasy team found for user.")
        return {"team_name": "", "starting": [], "bench": []}

    # 1) Load current user team entries + player + club
    entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': {'include': {'team': True}}},
        order={'player_id': 'asc'}
    )
    logger.info(f"User team entries fetched: {len(entries)}")
    if not entries:
        return {"team_name": fantasy_team.name, "starting": [], "bench": []}

    player_ids: List[int] = [e.player_id for e in entries]
    team_ids: List[int] = list({e.player.team_id for e in entries})

    # 2) Points and raw stats for current GW
    stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id, 'player_id': {'in': player_ids}}
    )
    logger.info(f"Stats fetched for {len(stats)} players")
    pts_map: Dict[int, int] = {s.player_id: s.points for s in stats}
    stats_map: Dict[int, Any] = {s.player_id: s for s in stats}

    # 3) Current and next gameweeks
    cur_gw = await db.gameweek.find_unique(where={'id': gameweek_id})
    if not cur_gw:
        raise HTTPException(status_code=404, detail="Gameweek not found")
    next_gw = await db.gameweek.find_unique(where={'gw_number': cur_gw.gw_number + 1})

    team_ids: List[int] = list({e.player.team_id for e in entries})

    # 4) Build fixture_str for NEXT GW (kept for your UI)
    fixture_map_next: Dict[int, str] = {}
    if next_gw:
        fixtures_next = await db.fixture.find_many(
            where={
                'gameweek_id': next_gw.id,
                'OR': [
                    {'home_team_id': {'in': team_ids}},
                    {'away_team_id': {'in': team_ids}},
                ]
            },
            include={'home': True, 'away': True}
        )
        def fmt_next(opp_short: str, venue: str) -> str:
            return f"{opp_short} ({venue}) "
        for f in fixtures_next:
            if f.home_team_id in team_ids:
                fixture_map_next[f.home_team_id] = fmt_next(f.away.short_name, 'H')
            if f.away_team_id in team_ids:
                fixture_map_next[f.away_team_id] = fmt_next(f.home.short_name, 'A')


    # 5) Recent fixtures (last two + current) with points per player
    #    a) find GW rows
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

    # points by player across those recent GWs
    recent_stats = await db.gameweekplayerstats.find_many(
        where={"player_id": {"in": player_ids}, "gameweek_id": {"in": recent_gw_ids}}
    )
    pts_by_player_gw: Dict[tuple[int, int], int] = {
        (s.player_id, s.gameweek_id): int(s.points or 0) for s in recent_stats
    }

    def _breakdown_for(position: str, st: Any) -> tuple[dict, list[dict]]:
        raw = {
            "minutes": int(st.minutes or 0),
            "goals_scored": int(st.goals_scored or 0),
            "assists": int(st.assists or 0),
            "yellow_cards": int(st.yellow_cards or 0),
            "red_cards": int(st.red_cards or 0),
            "bonus_points": int(st.bonus_points or 0),
        }
        pos = (position or "").upper()
        goal_pts = 10 if pos == "GK" else 6 if pos == "DEF" else 5 if pos == "MID" else 4
        breakdown = [
            {"label": "Appearance",   "value": 1 if raw["minutes"] > 0 else 0, "points": 1 if raw["minutes"] > 0 else 0},
            {"label": "Goals",        "value": raw["goals_scored"],            "points": raw["goals_scored"] * goal_pts},
            {"label": "Assists",      "value": raw["assists"],                 "points": raw["assists"] * 3},
            {"label": "Yellow cards", "value": raw["yellow_cards"],            "points": -1 * raw["yellow_cards"]},
            {"label": "Red cards",    "value": raw["red_cards"],               "points": -3 * raw["red_cards"]},
            {"label": "Bonus",        "value": raw["bonus_points"],            "points": raw["bonus_points"]},
        ]
        return raw, breakdown


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
            "fixture_str": fixture_map_next.get(club.id, "—"),
        }

        st = stats_map.get(entry.player.id)
        if st:
            raw, br = _breakdown_for(entry.player.position, st)
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

    
    return {
        "team_name": fantasy_team.name,
        "starting": starting,
        "bench": bench
    }




async def get_leaderboard(db: Prisma):
    users = await db.user.find_many(
        where={'is_active': True, 'role': 'user', 'fantasy_team': {'is_not': None}},
        include={'fantasy_team': True},
    )
    if not users:
        return []

    scores_data = await db.usergameweekscore.group_by(
        by=['user_id'],
        sum={'total_points': True, 'transfer_hits': True},  # prisma-py expects `sum=...`
    )

    score_map: dict[str, int] = {}
    for item in scores_data:
        agg = item.get('_sum') or item.get('sum') or {}     # handle either result shape
        total = int(agg.get('total_points') or 0)
        hits  = int(agg.get('transfer_hits') or 0)
        score_map[str(item['user_id'])] = total - hits

    rows = [{
        "rank": 0,
        "team_name": u.fantasy_team.name,
        "manager_email": u.email,
        "user_id": str(u.id),
        "total_points": int(score_map.get(str(u.id), 0)),
    } for u in users]

    rows.sort(key=lambda r: r['total_points'], reverse=True)
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    return rows




async def carry_forward_team(db: Prisma, user_id: str, new_gameweek_id: int):
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


# app/crud.py


async def transfer_player(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    out_player_id: int,
    in_player_id: int,
):
    user = await db.user.find_unique(where={'id': user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    wildcard = await is_wildcard_active(db, user_id, gameweek_id)

    # 1) Find outgoing row
    out_entry = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': out_player_id},
        include={'player': True},
    )
    if not out_entry:
        raise HTTPException(status_code=404, detail="Outgoing player is not in your team for this GW.")

    # 2) Prevent duplicates
    already = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': in_player_id}
    )
    if already:
        return await get_user_team_full(db, user_id, gameweek_id)

    # 3) Position check
    in_player = await db.player.find_unique(where={'id': in_player_id})
    if not in_player:
        raise HTTPException(status_code=404, detail="Incoming player not found.")
    if in_player.position != out_entry.player.position:
        raise HTTPException(status_code=400, detail="Position mismatch for transfer.")

    flags = {
        'is_benched': out_entry.is_benched,
        'is_captain': out_entry.is_captain,
        'is_vice_captain': out_entry.is_vice_captain,
    }

    # Decide charge policy before tx for clarity
    charge_transfers = bool(user.played_first_gameweek and not wildcard)

    async with db.tx() as tx:
        # swap
        await tx.userteam.delete_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': out_player_id}
        )
        await tx.userteam.create(
            data={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': in_player_id, **flags}
        )

        # log the transfer action
        await tx.transfer_log.create(
            data={
                'user_id': user_id,
                'gameweek_id': gameweek_id,
                'out_player': out_player_id,
                'in_player': in_player_id,
            }
        )

        if charge_transfers:
            if user.free_transfers and user.free_transfers > 0:
                # consume one free transfer
                await tx.user.update(
                    where={'id': user_id},
                    data={'free_transfers': {'decrement': 1}}
                )
            else:
                # apply a -4 hit for this transfer
                # upsert GW score row and increment hits by 4
                await tx.usergamescore.upsert(
                    where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
                    create={
                        'user_id': user_id,
                        'gameweek_id': gameweek_id,
                        'total_points': 0,
                        'transfer_hits': 4,
                    },
                    update={'transfer_hits': {'increment': 4}},
                )
        # else: no cost during first GW or wildcard

    return await get_user_team_full(db, user_id, gameweek_id)



async def set_captain(db: Prisma, user_id: str, gameweek_id: int, player_id: int):
    # make sure the player belongs to this user's team for this GW and isn't benched
    ut = await db.userteam.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': player_id}
    )
    if not ut:
        raise HTTPException(status_code=404, detail="Player not in your team for this gameweek.")
    if ut.is_benched:
        raise HTTPException(status_code=400, detail="Captain must be a starter (cannot be benched).")

    # transaction: clear old captain, set new one
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



async def get_transfer_stats(db: Prisma, gameweek_id: int):
    # 1) Pull logs for this GW
    logs = await db.transfer_log.find_many(
        where={'gameweek_id': gameweek_id}
    )

    # 2) Count in/out
    in_counts = Counter([l.in_player for l in logs if l.in_player is not None])
    out_counts = Counter([l.out_player for l in logs if l.out_player is not None])

    top_in = in_counts.most_common(5)
    top_out = out_counts.most_common(5)

    # 3) Fetch player + team details for all involved player_ids
    player_ids = list({pid for pid, _ in top_in} | {pid for pid, _ in top_out})
    players = await db.player.find_many(
        where={'id': {'in': player_ids}},
        include={'team': True}
    )
    pmap: Dict[int, any] = {p.id: p for p in players}

    def to_rows(pairs: List[tuple[int, int]]):
        rows = []
        for pid, cnt in pairs:
            p = pmap.get(pid)
            if not p:
                rows.append({'player_id': pid, 'count': cnt})
                continue
            rows.append({
                'player_id': pid,
                'count': cnt,
                'full_name': p.full_name,
                'position': p.position,
                'team': {
                    'id': p.team.id,
                    'name': p.team.name,
                    'short_name': p.team.short_name,
                } if p.team else None
            })
        return rows

    return {
        'most_in': to_rows(top_in),
        'most_out': to_rows(top_out),
    }

async def save_existing_team(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    new_players: List[Dict],
):
    """
    Replace the user's team for the given GW with `new_players` and log transfers.
    Each item in new_players must be a dict like:
      {
        "id": <int or str>,
        "position": "GK"|"DEF"|"MID"|"FWD",          # optional if already known server-side
        "is_captain": <bool>,
        "is_vice_captain": <bool>,
        "is_benched": <bool>,
      }
    Invariants enforced:
      - Exactly 11 players total
      - Exactly 2 GK total
      - Exactly 1 GK is benched (=> starting XI has 1 GK)
      - Exactly 3 players benched
      - Exactly 1 captain, 1 vice-captain
      - Captain != Vice, neither is benched
      - (Optional UI rule) 3 DEF, 3 MID, 3 FWD total (kept to match your current UI buckets)
    """

    # --- Fetch existing to compute diff BEFORE we delete anything ---
    existing = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )
    existing_ids = {e.player_id for e in existing}

    # --- Normalize / basic guards ---
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

    # Map quick lookup for flags
    def b(v): return bool(v)  # normalize truthy/falsey to bool
    attrs_map: Dict[int, Dict] = {int(p['id']): p for p in new_players if p and 'id' in p}

    # Build new snapshot rows
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
        })

    # --- Validate flags & composition BEFORE writing ---
    captains = [t for t in to_create if t['is_captain']]
    vices    = [t for t in to_create if t['is_vice_captain']]
    benched  = [t for t in to_create if t['is_benched']]
    starters = [t for t in to_create if not t['is_benched']]

    if len(benched) != 3:
        raise HTTPException(400, f"Exactly 3 players must be benched (got {len(benched)}).")
    if len(captains) != 1:
        raise HTTPException(400, "Exactly 1 captain is required.")
    if len(vices) != 1:
        raise HTTPException(400, "Exactly 1 vice-captain is required.")
    if captains[0]['player_id'] == vices[0]['player_id']:
        raise HTTPException(400, "Captain and vice-captain must be different players.")
    if any(t['player_id'] == captains[0]['player_id'] for t in benched) or \
       any(t['player_id'] == vices[0]['player_id'] for t in benched):
        raise HTTPException(400, "Captain and vice-captain cannot be benched.")

    # Pull server-side positions to validate counts (don’t trust client)
    players_meta = await db.player.find_many(where={'id': {'in': incoming_ids}})
    if len(players_meta) != 11:
        raise HTTPException(400, "Some player IDs do not exist.")

    gks  = [p.id for p in players_meta if p.position == 'GK']
    defs = [p.id for p in players_meta if p.position == 'DEF']
    mids = [p.id for p in players_meta if p.position == 'MID']
    fwds = [p.id for p in players_meta if p.position == 'FWD']

    if len(gks) != 2:
        raise HTTPException(400, f"Exactly 2 goalkeepers are required (got {len(gks)}).")

    # Exactly 1 GK benched (=> 1 GK starter)
    benched_ids = {t['player_id'] for t in benched}
    benched_gks = [pid for pid in gks if pid in benched_ids]
    if len(benched_gks) != 1:
        raise HTTPException(400, f"Exactly 1 goalkeeper must be benched (got {len(benched_gks)}).")

    starter_ids = {t['player_id'] for t in starters}
    starting_gks = [pid for pid in gks if pid in starter_ids]
    if len(starting_gks) != 1:
        raise HTTPException(400, f"Starting XI must include exactly 1 goalkeeper (got {len(starting_gks)}).")

    # (Optional) enforce your UI buckets: 3 DEF, 3 MID, 3 FWD
    if not (len(defs) == 3 and len(mids) == 3 and len(fwds) == 3):
        raise HTTPException(400, "Team must have 3 DEF, 3 MID, and 3 FWD.")

    # Compute transfer logs diff
    incoming_set = set(incoming_ids)
    removed_ids = existing_ids - incoming_set
    added_ids   = incoming_set - existing_ids

    # --- Commit atomically ---
    async with db.tx() as tx:
        # Clear current team for this GW
        await tx.userteam.delete_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id}
        )

        # Insert validated snapshot
        await tx.userteam.create_many(data=to_create)

        # Log outgoing players
        for out_id in removed_ids:
            await tx.transfer_log.create(
                data={
                    'user_id': user_id,
                    'gameweek_id': gameweek_id,
                    'out_player': int(out_id),
                    'in_player': None,
                }
            )
        # Log incoming players
        for in_id in added_ids:
            await tx.transfer_log.create(
                data={
                    'user_id': user_id,
                    'gameweek_id': gameweek_id,
                    'out_player': None,
                    'in_player': int(in_id),
                }
            )

    # Return refreshed payload the frontend expects
    return await get_user_team_full(db, user_id, gameweek_id)

async def user_has_team(db: Prisma, user_id: str) -> bool:
    # OPTION A: if your fantasy team model is named "FantasyTeam"
    team = await db.fantasyteam.find_first(where={"user_id": user_id})
    # OPTION B: if it’s named "Team" and represents the user’s fantasy team
    # team = await db.team.find_first(where={"user_id": user_id})
    return team is not None

async def perform_gameweek_rollover_tasks(db: Prisma, completed_gw_id: int):
    """
    To be run after a gameweek deadline.
    - Sets 'played_first_gameweek' for users whose first gameweek was this one.
    - Adds 1 free transfer to every user who has already played, capped at 2.
    """
    # 1. Find all users who had a team in the completed gameweek
    users_in_completed_gw = await db.userteam.find_many(
        where={'gameweek_id': completed_gw_id},
        distinct=['user_id']
    )
    user_ids_in_gw = {u.user_id for u in users_in_completed_gw}

    if not user_ids_in_gw:
        return "No users played this gameweek. Nothing to update."

    # 2. For each of those users, find their very first gameweek entry
    first_gameweek_entries = await db.userteam.group_by(
        by=['user_id'],
        min={'gameweek_id': True},
        where={'user_id': {'in': list(user_ids_in_gw)}}
    )

    # 3. Identify users whose first gameweek was the one that just completed
    new_players_to_flag = [
        entry['user_id'] for entry in first_gameweek_entries
        if entry['_min']['gameweek_id'] == completed_gw_id
    ]

    async with db.tx() as transaction:
        # 4. Set played_first_gameweek = true ONLY for those new players
        if new_players_to_flag:
            await transaction.user.update_many(
                where={'id': {'in': new_players_to_flag}},
                data={'played_first_gameweek': True}
            )

        # 5. Add 1 free transfer to ALL users who have already played (flag is true)
        # This now correctly includes long-time players and the new players we just flagged.
        await transaction.query_raw(
            """
            UPDATE "users"
            SET free_transfers = LEAST(free_transfers + 1, 2)
            WHERE played_first_gameweek = true
            """
        )
    
    return f"Rollover tasks complete for GW {completed_gw_id}."


async def _resolve_gw(db: Prisma, gameweek_id: int | None):
    if gameweek_id is not None:
        gw = await db.gameweek.find_unique(where={'id': gameweek_id})
        if not gw: raise HTTPException(404, "Gameweek not found")
        return gw
    return await get_current_gameweek(db)  # returns schemas.Gameweek

async def get_chip_status(db: Prisma, user_id: str, gameweek_id: int) -> schemas.ChipStatus:
    # active for this GW
    active = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )
    # any chips already used this season
    used_rows = await db.userchip.find_many(where={'user_id': user_id})
    return schemas.ChipStatus(
        active=active.chip if active else None,
        used=[r.chip for r in used_rows]
    )

async def play_chip(db: Prisma, user_id: str, chip: str, gameweek_id: int | None):
    gw = await _resolve_gw(db, gameweek_id)
    # block after deadline
    now_utc = datetime.now(timezone.utc)
    if gw.deadline < now_utc:
        raise HTTPException(400, "Deadline passed for this gameweek.")

    # enforce single chip per GW and one-time use per chip
    existing_gw = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gw.id}
    )
    if existing_gw:
        raise HTTPException(400, "A chip is already active this Gameweek.")

    already_used = await db.userchip.find_first(
        where={'user_id': user_id, 'chip': chip}
    )
    if already_used:
        raise HTTPException(400, f"{chip} already used this season.")

    return await db.userchip.create(data={
        'user_id': user_id,
        'gameweek_id': gw.id,
        'chip': chip
    })

async def cancel_chip(db: Prisma, user_id: str, gameweek_id: int | None):
    gw = await _resolve_gw(db, gameweek_id)
    now_utc = datetime.now(timezone.utc)
    if gw.deadline < now_utc:
        raise HTTPException(400, "Cannot cancel after deadline.")
    await db.userchip.delete_many(where={'user_id': user_id, 'gameweek_id': gw.id})
    return {"ok": True}

async def is_wildcard_active(db: Prisma, user_id: str, gameweek_id: int) -> bool:
    row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'chip': 'WILDCARD'}
    )
    return bool(row)

async def is_triple_captain_active(db: Prisma, user_id: str, gameweek_id: int) -> bool:
    row = await db.userchip.find_first(
        where={'user_id': user_id, 'gameweek_id': gameweek_id, 'chip': 'TRIPLE_CAPTAIN'}
    )
    return bool(row)

async def compute_user_score_for_gw(db: Prisma, user_id: str, gameweek_id: int) -> int:
    # Fetch team for the GW
    entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )

    # If no entries, store 0 and return 0 minus any hits (usually 0)
    if not entries:
        gross = 0
        await db.usergameweekscore.upsert(
            where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
            data={
                'create': {'user_id': user_id, 'gameweek_id': gameweek_id, 'total_points': gross},
                'update': {'total_points': gross},
            },
        )
        ugws = await db.usergameweekscore.find_unique(
            where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}}
        )
        hits = getattr(ugws, 'transfer_hits', 0) if ugws else 0
        return gross - hits

    # Build points map for the GW
    stats = await db.gameweekplayerstats.find_many(where={'gameweek_id': gameweek_id})
    pts = {s.player_id: s.points for s in stats}  # missing => 0

    starters = [e for e in entries if not e.is_benched]
    cap = next((e for e in starters if e.is_captain), None)
    vice = next((e for e in starters if e.is_vice_captain), None)

    base = sum(pts.get(e.player_id, 0) for e in starters)

    triple = await is_triple_captain_active(db, user_id, gameweek_id)

    # Choose multiplier target: captain if played else vice if played
    bonus_target = None
    if cap and (cap.player_id in pts):
        bonus_target = cap.player_id
    elif vice and (vice.player_id in pts):
        bonus_target = vice.player_id

    if bonus_target is not None:
        if triple:
            # base already counts 1x; add +2x to make triple
            gross = base + 2 * pts[bonus_target]
        else:
            # base already counts 1x; add +1x to make double
            gross = base + pts[bonus_target]
    else:
        gross = base

    # Persist gross points
    ugws = await db.usergameweekscore.upsert(
        where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
        data={
            'create': {'user_id': user_id, 'gameweek_id': gameweek_id, 'total_points': gross},
            'update': {'total_points': gross},
        },
    )

    # Subtract transfer hits
    hits = getattr(ugws, 'transfer_hits', 0) if ugws else 0
    net = gross - hits
    return net


async def get_player_card(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    player_id: int,
) -> Dict[str, Any]:
    """
    For the given user + GW + player:
      - verify the player is in user's team for this GW
      - return price, team info, captain/vice/bench flags
      - return current-GW total points + per-stat breakdown
      - return recent_fixtures: last two GWs + current with points
    """
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
            "minutes": int(st_row.minutes or 0),
            "goals_scored": int(st_row.goals_scored or 0),
            "assists": int(st_row.assists or 0),
            "yellow_cards": int(st_row.yellow_cards or 0),
            "red_cards": int(st_row.red_cards or 0),
            "bonus_points": int(st_row.bonus_points or 0),
        }
        pos = (position or "").upper()
        goal_pts = 10 if pos == "GK" else 6 if pos == "DEF" else 5 if pos == "MID" else 4
        breakdown = [
            {"label": "Appearance",   "value": 1 if raw["minutes"] > 0 else 0, "points": 1 if raw["minutes"] > 0 else 0},
            {"label": "Goals",        "value": raw["goals_scored"],            "points": raw["goals_scored"] * goal_pts},
            {"label": "Assists",      "value": raw["assists"],                 "points": raw["assists"] * 3},
            {"label": "Yellow cards", "value": raw["yellow_cards"],            "points": -1 * raw["yellow_cards"]},
            {"label": "Red cards",    "value": raw["red_cards"],               "points": -3 * raw["red_cards"]},
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

    # points for this player across those GWs
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

    # 3) assemble card payload
    return {
        "id": player.id,
        "full_name": player.full_name,
        "position": player.position,
        "price": player.price,                       # use as-is; format in UI
        "team": {"id": club.id, "name": club.name, "short_name": club.short_name} if club else None,
        "is_captain": bool(ut.is_captain),
        "is_vice_captain": bool(ut.is_vice_captain),
        "is_benched": bool(ut.is_benched),
        "points": total_points,
        "raw_stats": raw_stats or None,
        "breakdown": breakdown or None,
        "recent_fixtures": recent_fixtures,
    }

# In backend/app/crud.py

async def get_gameweek_stats_for_user(db: Prisma, user_id: str, gameweek_id: int):
    """
    Calculates the user's points, the average points, and the highest points
    for a specific gameweek.
    """
    # 1. Get all scores for the specified gameweek
    all_scores = await db.usergameweekscore.find_many(
        where={'gameweek_id': gameweek_id}
    )

    if not all_scores:
        # If no scores are in yet, return all zeros
        return {"user_points": 0, "average_points": 0, "highest_points": 0}

    # 2. Find the current user's score
    user_score_entry = next((s for s in all_scores if s.user_id == user_id), None)
    user_points = user_score_entry.total_points if user_score_entry else 0
    
    # 3. Calculate average and highest scores
    total_points_sum = sum(s.total_points for s in all_scores)
    average_points = round(total_points_sum / len(all_scores))
    highest_points = max(s.total_points for s in all_scores)

    return {
        "user_points": user_points,
        "average_points": average_points,
        "highest_points": highest_points,
    }


async def get_manager_hub_stats(db: Prisma, user_id: str, gameweek_id: int):
    """
    Calculates the stats needed for the Manager Hub card on the dashboard.
    """
    # 1. Calculate Overall Points (sum of all gameweek scores for the user)
    overall_scores = await db.usergameweekscore.group_by(
        by=['user_id'],
        where={'user_id': user_id},
        sum={'total_points': True}
    )
    overall_points = overall_scores[0]['_sum']['total_points'] if overall_scores else 0

    # 2. Get Gameweek Points for the current week
    gameweek_score = await db.usergameweekscore.find_unique(
        where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}}
    )
    gameweek_points = gameweek_score.total_points if gameweek_score else 0

    # 3. Get Total Players (count of all active users)
    total_players = await db.user.count(where={'is_active': True, 'role': 'user'})


    # --- 4. Calculate Squad Value ---
    # Get all players in the user's current squad
    user_squad_entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': True} # Include the full player object to get the price
    )

    # Sum the prices of all players in the squad
    squad_value = sum(p.player.price for p in user_squad_entries) if user_squad_entries else 0.0

    # --- NEW: Calculate In The Bank ---
    total_budget = 110.0
    in_the_bank = total_budget - float(squad_value)

    return {
        "overall_points": overall_points or 0,
        "gameweek_points": gameweek_points,
        "total_players": total_players,
        "squad_value" : float(squad_value),
        "in_the_bank":in_the_bank
    }

# In backend/app/crud.py
from datetime import datetime, timezone

# backend/app/crud.py

async def get_team_of_the_week(db: Prisma, gameweek_number: Optional[int] = None):
    """
    Finds the highest-scoring team for a specific gameweek, or the last completed one if not specified.
    """
    target_gw = None
    if gameweek_number:
        target_gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
    else:
        now_utc = datetime.now(timezone.utc)
        target_gw = await db.gameweek.find_first(
            where={'deadline': {'lt': now_utc}},
            order={'deadline': 'desc'}
        )

    if not target_gw:
        return None

    # Find the highest score in that gameweek
    top_score = await db.usergameweekscore.find_first(
        where={'gameweek_id': target_gw.id},
        order={'total_points': 'desc'}
    )
    if not top_score:
        return None

    top_user_id = top_score.user_id

    # Fetch the manager's details
    manager = await db.user.find_unique(
        where={'id': top_user_id},
        include={'fantasy_team': True}
    )
    manager_name = manager.full_name if manager and manager.full_name else "Top Manager"
    team_name = manager.fantasy_team.name if manager and manager.fantasy_team else "Team of the Week"

    # Fetch the full team roster
    user_team_entries = await db.userteam.find_many(
        where={'user_id': top_user_id, 'gameweek_id': target_gw.id},
        include={'player': {'include': {'team': True}}}
    )
    
    player_ids = [entry.player.id for entry in user_team_entries]
    player_stats = await db.gameweekplayerstats.find_many(
        where={
            'gameweek_id': target_gw.id,
            'player_id': {'in': player_ids}
        }
    )
    points_map = {stat.player_id: stat.points for stat in player_stats}

    def to_display(entry):
        player_points = points_map.get(entry.player.id, 0)
        if entry.is_captain:
            player_points *= 2
            
        return {
            "id": entry.player.id, "full_name": entry.player.full_name,
            "position": entry.player.position, "price": entry.player.price,
            "is_captain": entry.is_captain, "is_vice_captain": entry.is_vice_captain,
            "is_benched": entry.is_benched, "team": entry.player.team,
            "points": player_points
        }

    all_players = [to_display(p) for p in user_team_entries]
    
    return {
        "manager_name": manager_name,
        "team_name": team_name,
        "points": top_score.total_points,
        "starting": [p for p in all_players if not p["is_benched"]],
        "bench": [p for p in all_players if p["is_benched"]]
    }

# In backend/app/crud.py

from collections import Counter # Make sure this is imported at the top

# ... keep other functions

async def confirm_transfers(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    transfers: List[schemas.TransferItem],
):
    """
    Validates and executes a batch of transfers in an atomic transaction
    based on the custom 11-player squad rules.
    """
    # --- 1. PRE-FLIGHT CHECKS ---
    if not transfers:
        raise HTTPException(status_code=400, detail="No transfers provided.")

    user = await db.user.find_unique(where={'id': user_id}, include={'fantasy_team': True})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    gw = await db.gameweek.find_unique(where={'id': gameweek_id})
    if not gw or gw.deadline < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="The transfer deadline has passed.")

    wildcard_active = await is_wildcard_active(db, user_id, gameweek_id)

    # --- 2. FETCH INITIAL STATE ---
    current_team_entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': {'include': {'team': True}}}
    )
    current_player_ids = {entry.player_id for entry in current_team_entries}
    
    out_player_ids = {t.out_player_id for t in transfers}
    in_player_ids = {t.in_player_id for t in transfers}

    # --- 3. VALIDATION ---

    # a) Ownership Validation
    if not out_player_ids.issubset(current_player_ids):
        raise HTTPException(status_code=400, detail="You are trying to transfer out a player you do not own.")

    # b) Duplication & Total Player Count Validation
    provisional_player_ids = (current_player_ids - out_player_ids).union(in_player_ids)
    # CHANGED: Validate for a total of 11 players
    if len(provisional_player_ids) != 11:
        raise HTTPException(status_code=400, detail=f"Invalid transfer combination. Your squad must have exactly 11 players.")
        
    # c) Budget Validation
    all_involved_players = await db.player.find_many(where={'id': {'in': list(out_player_ids.union(in_player_ids))}})
    player_prices = {p.id: p.price for p in all_involved_players}
    
    value_of_outgoing_players = sum(player_prices.get(pid, 0) for pid in out_player_ids)
    cost_of_incoming_players = sum(player_prices.get(pid, 0) for pid in in_player_ids)
    
    current_squad_value = sum(entry.player.price for entry in current_team_entries)
    
    # CHANGED: Budget is now 110.0m
    total_budget = Decimal('110.0') 
    bank = total_budget - current_squad_value
    
    new_bank = bank + value_of_outgoing_players - cost_of_incoming_players
    if new_bank < 0:
        raise HTTPException(status_code=400, detail=f"Insufficient funds. You are £{-new_bank:.1f}m short.")

    # d) Squad Composition Validation (Team & Position Counts)
    provisional_players = await db.player.find_many(where={'id': {'in': list(provisional_player_ids)}}, include={'team': True})
    
    team_counts = Counter(p.team.id for p in provisional_players if p.team)
    for team_id, count in team_counts.items():
        # CHANGED: Enforce a maximum of 2 players per team
        if count > 2:
            player_in_team = next((p for p in provisional_players if p.team and p.team.id == team_id), None)
            team_name = player_in_team.team.name if player_in_team else "a single team"
            raise HTTPException(status_code=400, detail=f"You can't have more than 2 players from {team_name}.")

    position_counts = Counter(p.position for p in provisional_players)
    # CHANGED: Enforce your required 2-3-3-3 formation
    required_positions = {'GK': 2, 'DEF': 3, 'MID': 3, 'FWD': 3}
    if position_counts != required_positions:
        raise HTTPException(status_code=400, detail=f"Invalid squad structure. You must have 2 GKs, 3 DEFs, 3 MIDs, and 3 FWDs.")

    # --- 4. CALCULATE TRANSFER COST ---
    point_cost = 0
    free_transfers_used = 0
    if not wildcard_active and user.played_first_gameweek:
        num_transfers = len(transfers)
        available_ft = user.free_transfers or 0
        
        paid_transfers = max(0, num_transfers - available_ft)
        point_cost = paid_transfers * 4
        free_transfers_used = min(num_transfers, available_ft)


    # --- 5. ATOMIC DATABASE TRANSACTION ---
    async with db.tx() as tx:
        await tx.userteam.delete_many(
            where={'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': {'in': list(out_player_ids)}}
        )
        await tx.userteam.create_many(
            data=[{'user_id': user_id, 'gameweek_id': gameweek_id, 'player_id': pid} for pid in in_player_ids]
        )
        for t in transfers:
            await tx.transfer_log.create(data={
                'user_id': user_id,
                'gameweek_id': gameweek_id,
                'out_player': t.out_player_id,
                'in_player': t.in_player_id,
            })
        if point_cost > 0:
            await tx.usergameweekscore.upsert(
                where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
                data={  # <-- Wrap with a 'data' dictionary
                    'create': {
                        'user_id': user_id,
                        'gameweek_id': gameweek_id,
                        'transfer_hits': point_cost
                    },
                    'update': {
                        'transfer_hits': {'increment': point_cost}
                    },
                }
            )
        if free_transfers_used > 0:
            await tx.user.update(
                where={'id': user_id},
                data={'free_transfers': {'decrement': free_transfers_used}}
            )

    return {"message": "Transfers confirmed successfully!", "cost": point_cost}