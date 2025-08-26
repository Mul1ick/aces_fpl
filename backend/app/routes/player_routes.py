from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas import PlayerOut

router = APIRouter(
    prefix="/players",
    tags=["Players"]
)

@router.get("/", response_model=list[PlayerOut])
def get_players(db: Session = Depends(get_db)):
    return db.query(models.Player).all()