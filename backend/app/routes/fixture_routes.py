# app/routes/fixture_routes.py
from fastapi import APIRouter, Depends
from prisma import Prisma
from app.database import get_db
from app.crud import get_current_gameweek

router = APIRouter(prefix="/fixtures", tags=["fixtures"])

@router.get("/fixtures/next-map")
async def next_fixture_map(db: Prisma = Depends(get_db)):
    cur = await get_current_gameweek(db)
    nxt = await db.gameweek.find_unique(where={'gw_number': cur.gw_number + 1})
    if not nxt:
        return {}

    fixtures = await db.fixture.find_many(
        where={'gameweek_id': nxt.id},
        include={'home': True, 'away': True}
    )

    def fmt(f):
        # "OPP (H/A) • Sat 13 Sep 14:30"
        from datetime import datetime
        dow = f.kickoff.strftime('%a')
        day = f.kickoff.strftime('%d')
        mon = f.kickoff.strftime('%b')
        time_str = f.kickoff.strftime('%H:%M')
        return dow, day, mon, time_str

    out = {}
    for f in fixtures:
        dow, day, mon, time_str = fmt(f)
        out[f.home_team_id] = f"{f.away.short_name} (H) • {dow} {day} {mon} {time_str}"
        out[f.away_team_id] = f"{f.home.short_name} (A) • {dow} {day} {mon} {time_str}"
    return out


@router.get("/")
async def list_fixtures(
    db: Prisma = Depends(get_db),
    gameweek_id: int | None = None
):
    where = {}
    if gameweek_id:
        where["gameweek_id"] = gameweek_id
    fixtures = await db.fixture.find_many(
        where=where,
        include={"home": True, "away": True},
        order={"kickoff": "asc"}
    )
    return fixtures