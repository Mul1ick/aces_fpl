from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from prisma import Prisma
from datetime import datetime, timezone

router = APIRouter()

@router.get("/gameweek/current")
async def get_current_gameweek(db: Prisma = Depends(get_db)):
    """
    Finds the current gameweek, defined as the one with the soonest
    deadline that is still in the future. Falls back to the most
    recent gameweek if all deadlines have passed.
    """
    now_utc = datetime.now(timezone.utc)
    
    # Find the next gameweek whose deadline has not passed yet
    gameweek = await db.gameweek.find_first(
        where={'deadline': {'gt': now_utc}},
        order={'deadline': 'asc'}
    )

    # If all deadlines have passed, fall back to the most recent one
    if not gameweek:
        gameweek = await db.gameweek.find_first(
            order={'deadline': 'desc'}
        )
    
    # CORRECTED: Fixed the typo here
    if not gameweek:
        raise HTTPException(status_code=404, detail="No gameweek found.")
        
    return gameweek