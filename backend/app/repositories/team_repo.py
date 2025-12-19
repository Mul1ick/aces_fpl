from prisma import Prisma
from app import schemas


async def get_all_teams_with_counts(db: Prisma):
    teams = await db.team.find_many(order={"name": "asc"})
    player_counts = await db.player.group_by(by=['team_id'], count={'_all': True})
    count_map = {item['team_id']: item['_count']['_all'] for item in player_counts}
    
    # Matching the shape expected by schemas.TeamOutWithCount
    return [
        {"id": t.id, "name": t.name, "short_name": t.short_name, "player_count": count_map.get(t.id, 0)} 
        for t in teams
    ]

async def create_team(db: Prisma, payload: schemas.TeamCreate):
    return await db.team.create(data=payload.model_dump())

async def update_team(db: Prisma, team_id: int, payload: schemas.TeamUpdate):
    return await db.team.update(
        where={"id": team_id}, 
        data=payload.model_dump(exclude_unset=True, exclude_none=True)
    )

async def delete_team(db: Prisma, team_id: int):
    await db.team.delete(where={"id": team_id})

async def get_team_by_name_or_short(db: Prisma, name: str, short_name: str):
    return await db.team.find_first(
        where={"OR": [{"name": name}, {"short_name": short_name}]}
    )

async def get_team_by_id(db: Prisma, team_id: int):
    return await db.team.find_unique(where={"id": team_id})

async def get_top_pick_for_gameweek(db: Prisma, gameweek_id: int, field: str = None):
    """
    Finds the player with the highest count for a specific field (is_captain, is_vice_captain, or general selection).
    """
    where_clause = {'gameweek_id': gameweek_id}
    if field:
        where_clause[field] = True

    agg = await db.userteam.group_by(
        by=['player_id'],
        where=where_clause,
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    
    if not agg:
        return None

    player = await db.player.find_unique(where={'id': agg[0]['player_id']}, include={'team': True})
    if player and player.team:
        return {"name": player.full_name, "team_name": player.team.name}
    return None