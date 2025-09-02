import random
from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from app import schemas, auth
from typing import Dict, List, Optional
from uuid import UUID

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
    current_gw = await db.gameweek.find_first(
        where={'deadline': {'gt': now_utc}},
        order={'deadline': 'asc'}
    )
    if not current_gw:
        current_gw = await db.gameweek.find_first(order={'deadline': 'desc'})
    return current_gw


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
    team = await db.fantasyteam.find_unique(where={'user_id': user_id})
    if not team:
        return {"team_name": "", "starting": [], "bench": []}

    user_team_entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': {'include': {'team': True}}},
        order={'player_id': 'asc'}
    )

    player_ids: List[int] = [e.player_id for e in user_team_entries]
    stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id, 'player_id': {'in': player_ids}}
    )
    pts_map: Dict[int, int] = {s.player_id: s.points for s in stats}

    if not user_team_entries:
        return {"team_name": team.name, "starting": [], "bench": []}

    def to_display(entry):
        club = entry.player.team
        return {
            "id": entry.player.id,
            "full_name": entry.player.full_name,
            "position": entry.player.position,
            "price": entry.player.price,
            "is_captain": entry.is_captain,
            "is_vice_captain": entry.is_vice_captain,
            'team': {
                'id': club.id,
                'name': club.name,
                'short_name': club.short_name,
            },
            "is_benched": entry.is_benched,
            'points': pts_map.get(entry.player.id, 0),
        }

    all_players = [to_display(p) for p in user_team_entries]
    
    starting = [p for p in all_players if not p["is_benched"]]
    bench = [p for p in all_players if p["is_benched"]]

    return {
        "team_name": team.name,
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

