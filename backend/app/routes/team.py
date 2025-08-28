from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, models, auth
from app.schemas import SubmitTeamRequest
from app.auth import get_current_user

router = APIRouter()

@router.post("/submit-team")
def submit_team(
    team: SubmitTeamRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 🚨 You can dynamically get current gameweek, here we hardcode to 3
    gameweek_id = 3

    # Save to DB
    crud.save_user_team(
        db=db,
        user_id=current_user.id,
        gameweek_id=gameweek_id,
        players=[p.dict() for p in team.players]
    )

    return {"message": "Team submitted successfully"}