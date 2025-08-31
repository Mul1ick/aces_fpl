import random
from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from app import schemas, auth

# --- USER FUNCTIONS ---

async def get_user_by_email(db: Prisma, email: str):
    return await db.user.find_unique(where={"email": email})

async def get_user_by_id(db: Prisma, user_id: str):
    return await db.user.find_unique(where={"id": user_id})

async def create_user(db: Prisma, user: schemas.UserCreate):
    hashed_pw = auth.hash_password(user.password)
    new_user = await db.user.create(
        data={'email': user.email, 'hashed_password': hashed_pw}
    )
    return new_user

async def approve_user(db: Prisma, user_id: str):
    return await db.user.update(
        where={'id': user_id},
        data={'is_active': True}
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
    if not current_gw:
        raise HTTPException(status_code=404, detail="No gameweeks found.")
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

    print(f"✅ LOG: Searching for team with user_id='{user_id}' and gameweek_id={gameweek_id}")
    user_team_entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': {'include': {'team': True}}}
    )
    if not user_team_entries:
        return {"team_name": team.name, "starting": [], "bench": []}
    print(f"✅ LOG: Found {len(user_team_entries)} entries in the database.")

    def to_display(entry):
        return {
            "id": entry.player.id,
            "full_name": entry.player.full_name,
            "position": entry.player.position,
            "price": entry.player.price,
            "is_captain": entry.is_captain,
            "is_vice_captain": entry.is_vice_captain,
            "team": entry.player.team,
            "is_benched": entry.is_benched
        }

    all_players = [to_display(p) for p in user_team_entries]
    
    starting = [p for p in all_players if not p["is_benched"]]
    bench = [p for p in all_players if p["is_benched"]]

    return {
        "team_name": team.name,
        "starting": starting,
        "bench": bench
    }

# In backend/app/crud.py

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