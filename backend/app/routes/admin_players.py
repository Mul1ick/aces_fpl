from fastapi import APIRouter, Depends, Query
from prisma import Prisma
from app.database import get_db
from app import auth, crud, schemas

router = APIRouter(prefix="/admin/players", tags=["Admin: Players"], dependencies=[Depends(auth.get_current_admin_user)])

@router.get("", response_model=schemas.PlayersPage)
async def list_players(
    q: str | None = None,
    team_id: int | None = Query(None),
    position: str | None = Query(None),
    status: str | None = Query(None),
    sort: str | None = Query(None, description="e.g. 'price:desc' or 'full_name:asc'"),
    page: int = 1,
    page_size: int = 25,
    db: Prisma = Depends(get_db),
):
    return await crud.admin_list_players(db, page, page_size, q, team_id, position, status, sort)

@router.post("", response_model=schemas.PlayerOut)
async def create_player(payload: schemas.AdminPlayerCreate, db: Prisma = Depends(get_db)):
    return await crud.admin_create_player(db, payload)

@router.get("/{player_id}", response_model=schemas.PlayerOut)
async def get_player(player_id:int, db: Prisma = Depends(get_db)):
    return await crud.admin_get_player(db, player_id)

@router.put("/{player_id}", response_model=schemas.PlayerOut)
async def update_player(player_id:int, payload: schemas.AdminPlayerUpdate, db: Prisma = Depends(get_db)):
    return await crud.admin_update_player(db, player_id, payload)

@router.delete("/{player_id}")
async def delete_player(player_id:int, db: Prisma = Depends(get_db)):
    return await crud.admin_delete_player(db, player_id)