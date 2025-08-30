from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app import schemas, crud
from app.auth import get_current_user
from prisma import Prisma
from prisma import models as PrismaModels # Import Prisma's generated models

router = APIRouter()

@router.post("/submit-team")
async def submit_team(
    team: schemas.SubmitTeamRequest,
    db: Prisma = Depends(get_db),
    # CORRECT: Use the Prisma model for the type hint
    current_user: PrismaModels.User = Depends(get_current_user)
):
    current_gameweek = await crud.get_current_gameweek(db)

    await crud.save_user_team(
        db=db,
        user_id=str(current_user.id), # Use str() for safety
        gameweek_id=current_gameweek.id,
        players=[p.dict() for p in team.players],
        team_name=team.team_name
    )

    return {"message": "Team submitted successfully"}

@router.get("/team", response_model=schemas.GetTeamResponse)
async def get_team(
    db: Prisma = Depends(get_db),
    # CORRECT: Use the Prisma model for the type hint
    current_user: PrismaModels.User = Depends(get_current_user)
):
    current_gameweek = await crud.get_current_gameweek(db)
    
    try:
        result = await crud.get_user_team_full(db, str(current_user.id), current_gameweek.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))