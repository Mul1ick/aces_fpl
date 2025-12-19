from prisma import Prisma

async def get_fixture_by_id(db: Prisma, fixture_id: int):
    return await db.fixture.find_unique(where={"id": fixture_id})

async def get_fixtures_in_gameweek(db: Prisma, gameweek_id: int):
    return await db.fixture.find_many(
        where={"gameweek_id": gameweek_id},
        include={"home": True, "away": True},
        order={"kickoff": "asc"}
    )

async def get_all_fixtures(db: Prisma, gameweek_id: int | None = None):
    where = {}
    if gameweek_id:
        where["gameweek_id"] = gameweek_id
    
    return await db.fixture.find_many(
        where=where,
        include={"home": True, "away": True},
        order={"kickoff": "asc"}
    )

async def get_fixture_for_history(db: Prisma, gameweek_id: int, team_id: int):
    """Finds the fixture for a specific team in a specific gameweek."""
    return await db.fixture.find_first(
        where={
            'gameweek_id': gameweek_id, 
            'OR': [{'home_team_id': team_id}, {'away_team_id': team_id}]
        },
        include={'home': True, 'away': True}
    )

async def get_upcoming_fixtures_for_team(db: Prisma, team_id: int, start_gw_number: int, limit: int = 5):
    return await db.fixture.find_many(
        where={
            'gameweek': {'gw_number': {'gte': start_gw_number}},
            'OR': [{'home_team_id': team_id}, {'away_team_id': team_id}]
        },
        include={'gameweek': True, 'home': True, 'away': True},
        order={'gameweek': {'gw_number': 'asc'}},
        take=limit
    )