from sqlalchemy.orm import Session
from app import models, schemas, auth

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_pw = auth.hash_password(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def approve_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.is_active = True
        db.commit()
    return user

def get_user_by_id(db: Session, user_id: str):
    return db.query(models.User).filter(models.User.id == user_id).first()

def save_user_team(db, user_id: str, gameweek_id: int,   players: list[dict]):
    for player in players:
        entry = models.UserTeam(
            user_id=user_id,
            gameweek_id=gameweek_id,
            player_id=player["id"]
            

        )
        db.add(entry)
    db.commit()