from typing import Optional, List
from prisma import Prisma
from app import schemas

async def get_players_filtered(db: Prisma, q: Optional[str], team_id: Optional[int], position: Optional[str], status: Optional[str]):
    where: dict = {}
    if q:
        where["OR"] = [
            {"full_name": {"contains": q, "mode": "insensitive"}}, 
            {"team": {"name": {"contains": q, "mode": "insensitive"}}}
        ]
    if team_id is not None: where["team_id"] = team_id
    if position: where["position"] = position
    if status and status != "all": where["status"] = status
    
    return await db.player.find_many(
        where=where, 
        include={"team": True}, 
        order={"full_name": "asc"}
    )

async def create_player(db: Prisma, payload: schemas.PlayerCreate):
    created = await db.player.create(data=payload.model_dump())
    return await db.player.find_unique(where={"id": created.id}, include={"team": True})

async def update_player(db: Prisma, player_id: int, payload: schemas.PlayerUpdate):
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "team_id" in data: 
        data["team"] = {"connect": {"id": data.pop("team_id")}}
    
    await db.player.update(where={"id": player_id}, data=data)
    return await db.player.find_unique(where={"id": player_id}, include={"team": True})

async def delete_player(db: Prisma, player_id: int):
    await db.player.delete(where={"id": player_id})

async def get_player_by_id(db: Prisma, player_id: int):
    return await db.player.find_unique(where={"id": player_id})

async def get_players_by_ids(db: Prisma, ids: List[int]):
    return await db.player.find_many(where={'id': {'in': ids}})

async def count_players_in_team(db: Prisma, team_id: int) -> int:
    return await db.player.count(where={"team_id": team_id})

async def get_all_players_with_teams(db: Prisma):
    return await db.player.find_many(include={'team': True})

async def get_all_player_total_points(db: Prisma):
    """Returns a dictionary {player_id: total_points}"""
    stats = await db.gameweekplayerstats.group_by(
        by=['player_id'],
        sum={'points': True},
    )
    return {
        stat['player_id']: stat['_sum']['points'] or 0 for stat in stats
    }

async def get_player_history_stats(db: Prisma, player_id: int):
    return await db.gameweekplayerstats.find_many(
        where={'player_id': player_id},
        include={'gameweek': True},
        order={'gameweek': {'gw_number': 'desc'}}
    )

async def get_player_with_team(db: Prisma, player_id: int):
    return await db.player.find_unique(
        where={'id': player_id}, 
        include={'team': True}
    )