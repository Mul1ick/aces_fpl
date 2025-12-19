from fastapi import APIRouter, Depends
from prisma import Prisma
from app.database import get_db

# --- IMPORT SERVICES & REPOS ---
from app.repositories.fixture_repo import get_all_fixtures
from app.services.fixture_service import get_next_fixture_map_service

router = APIRouter(prefix="/fixtures", tags=["fixtures"])

@router.get("/fixtures/next-map")
async def next_fixture_map(db: Prisma = Depends(get_db)):
    return await get_next_fixture_map_service(db)

@router.get("/")
async def list_fixtures(
    db: Prisma = Depends(get_db),
    gameweek_id: int | None = None
):
    return await get_all_fixtures(db, gameweek_id)