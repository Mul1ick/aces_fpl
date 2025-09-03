import random
from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from app import schemas, auth
from typing import Dict, List, Optional
import logging
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
    return await db.user.update(
        where={'id': user_id},
        data={'is_active': True}
    )

async def update_user_role(db: Prisma, user_id: str, role: str):
    return await db.user.update(
        where={'id': user_id},
        data={'role': role}
    )

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
    total_users_count = await db.user.count()
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

    # try next upcoming
    current_gw = await db.gameweek.find_first(
        where={'deadline': {'gt': now_utc}},
        order={'deadline': 'asc'}
    )
    if current_gw:
        return current_gw

    # else try most recent past
    last_gw = await db.gameweek.find_first(order={'deadline': 'desc'})
    if last_gw:
        return last_gw

    # nothing configured => explicit 404 with a clear message
    raise HTTPException(status_code=404, detail="No gameweeks configured in the database.")


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

    # 2) Points for current GW
    player_ids: List[int] = [e.player_id for e in entries]
    stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id, 'player_id': {'in': player_ids}}
    )
    logger.info(f"Stats fetched for {len(stats)} players")
    pts_map: Dict[int, int] = {s.player_id: s.points for s in stats}

    # 3) Find NEXT gameweek (by gw_number, safer than id+1)
    cur_gw = await db.gameweek.find_unique(where={'id': gameweek_id})
    logger.info(f"Current GW: {cur_gw.gw_number if cur_gw else None}")
    next_gw: Optional = None
    if cur_gw:
        next_gw = await db.gameweek.find_unique(where={'gw_number': cur_gw.gw_number + 1})
    logger.info(f"Next GW: {next_gw.gw_number if next_gw else None}")

    # 4) Build team_id -> fixture_str map for next GW
    fixture_map: Dict[int, str] = {}
    if next_gw:
        # Which club IDs do we care about?
        team_ids = list({e.player.team_id for e in entries})
        logger.info(f"Looking for fixtures for team_ids={team_ids}")

        # Get all fixtures in next GW involving any of those teams
        fixtures = await db.fixture.find_many(
            where={
                'gameweek_id': next_gw.id,
                'OR': [
                    {'home_team_id': {'in': team_ids}},
                    {'away_team_id': {'in': team_ids}},
                ]
            },
            include={'home': True, 'away': True}
        )
        logger.info(f"Found {len(fixtures)} fixtures for next GW")

        # Format helper: "OPP (H/A) • Sat 30 Aug 20:00"
        def fmt(kickoff: datetime, opp_short: str, venue: str) -> str:
            # Adjust formatting as you prefer
            return f"{opp_short} ({venue}) "

        # Build map for both home and away teams
        for f in fixtures:
            logger.debug(f"Fixture: {f.home.short_name} vs {f.away.short_name} @ {f.kickoff}")
            if f.home_team_id in team_ids:
                fixture_map[f.home_team_id] = fmt(f.kickoff, f.away.short_name, 'H')
            if f.away_team_id in team_ids:
                fixture_map[f.away_team_id] = fmt(f.kickoff, f.home.short_name, 'A')

    logger.info(f"Fixture map built: {fixture_map}")

    # 5) Shape response objects
    def to_display(entry):
        club = entry.player.team
        return {
            "id": entry.player.id,
            "full_name": entry.player.full_name,
            "position": entry.player.position,
            "price": entry.player.price,
            "is_captain": entry.is_captain,
            "is_vice_captain": entry.is_vice_captain,
            "team": {
                "id": club.id,
                "name": club.name,
                "short_name": club.short_name,
            },
            "is_benched": entry.is_benched,
            "points": pts_map.get(entry.player.id, 0),
            # 👇 NEW: this is what your frontend reads
            "fixture_str": fixture_map.get(club.id, "—"),
        }

    all_players = [to_display(e) for e in entries]
    starting = [p for p in all_players if not p["is_benched"]]
    bench = [p for p in all_players if p["is_benched"]]

    return {
        "team_name": fantasy_team.name,
        "starting": starting,
        "bench": bench
    }




async def get_leaderboard(db: Prisma):
    scores = await db.usergameweekscore.group_by(
        by=['user_id'],
        sum={'total_points': True},
        order={'_sum': {'total_points': 'desc'}}
    )

    leaderboard = []
    for rank, score in enumerate(scores, 1):
        user_details = await db.user.find_unique(
            where={'id': score['user_id']},
            include={'fantasy_team': True}
        )
        if user_details and user_details.fantasy_team:
            leaderboard.append({
                "rank": rank,
                "team_name": user_details.fantasy_team.name,
                "manager_email": user_details.email,
                "total_points": score['_sum']['total_points'] or 0
            })
    return leaderboard

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


async def transfer_player(
    db: Prisma,
    user_id: str,
    gameweek_id: int,
    out_player_id: int,
    in_player_id: int,
):
    # 0) basic checks
    if out_player_id == in_player_id:
        raise HTTPException(status_code=400, detail="Players are identical.")

    # 1) ensure there is a record to replace
    existing = await db.userteam.find_first(
        where={
            "user_id": user_id,
            "gameweek_id": gameweek_id,
            "player_id": out_player_id,
        },
        include={"player": True},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Outgoing player not in your team for this GW.")

    # 2) prevent duplicates
    dup = await db.userteam.find_first(
        where={
            "user_id": user_id,
            "gameweek_id": gameweek_id,
            "player_id": in_player_id,
        }
    )
    if dup:
        raise HTTPException(status_code=400, detail="Incoming player is already in your team.")

    # 3) validate incoming exists and matches position (keeps team valid)
    incoming = await db.player.find_unique(where={"id": in_player_id})
    if not incoming:
        raise HTTPException(status_code=404, detail="Incoming player does not exist.")

    if incoming.position != existing.player.position:
        raise HTTPException(status_code=400, detail="Incoming player must match the same position as outgoing.")

    # (Optional) enforce same real-club cap, budget, etc. here

    # 4) copy flags from outgoing to incoming (captain/vice/bench)
    is_captain = existing.is_captain
    is_vice = existing.is_vice_captain
    is_benched = existing.is_benched

    # 5) do the swap
    # delete out, insert in (simple + clear)
    await db.userteam.delete_many(
        where={
            "user_id": user_id,
            "gameweek_id": gameweek_id,
            "player_id": out_player_id,
        }
    )

    await db.userteam.create(
        data={
            "user_id": user_id,
            "gameweek_id": gameweek_id,
            "player_id": in_player_id,
            "is_captain": is_captain,
            "is_vice_captain": is_vice,
            "is_benched": is_benched,
        }
    )

    # 6) return updated team
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