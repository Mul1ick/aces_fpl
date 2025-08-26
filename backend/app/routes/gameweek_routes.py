from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Gameweek

router = APIRouter()

@router.get("/gameweek/current")
def get_current_gameweek(db: Session = Depends(get_db)):
    gameweek = db.query(Gameweek).order_by(Gameweek.id.desc()).first()
    if not gameweek:
        raise HTTPException(status_code=404, detail="No gameweek found.")
    return gameweek