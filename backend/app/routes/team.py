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
        players=[p.dict() for p in team.players],
        team_name = team.team_name
    )

    return {"message": "Team submitted successfully"}

@router.get("/team", response_model=schemas.GetTeamResponse)
def get_team(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"📌 Request to fetch team for user: {current_user.id}")
    try:
        result = crud.get_user_team_full(db, current_user.id)
        print("✅ Result from get_user_team_full:", result)
        return result
    except Exception as e:
        print("❌ Error in get_team:", str(e))
        raise HTTPException(status_code=404, detail=str(e))