from fastapi import APIRouter, Depends
from app.database import get_db
from app import models
from app.schemas import PlayerOut
from prisma import Prisma

router = APIRouter(
    prefix="/players",
    tags=["Players"]
)

@router.get("/", response_model=list[PlayerOut])
async def get_players(db: Prisma = Depends(get_db)):
    # Use Prisma's 'find_many' and include the related team
    players = await db.player.find_many(
        include={'team': True}
    )
    return players