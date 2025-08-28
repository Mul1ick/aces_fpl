from sqlalchemy.orm import Session
from app import models, schemas, auth
from sqlalchemy.orm import Session, joinedload
from app.models import FantasyTeam, UserTeam, Player

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


def get_user_team_full(db: Session, user_id: str):
    # Get fantasy team name
    team = db.query(FantasyTeam).filter(FantasyTeam.user_id == user_id).first()
    if not team:
        raise Exception("Team not found for this user")

    # Get user team players for current gameweek (hardcoded to 1 for now)
    user_team_entries = (
        db.query(UserTeam)
        .filter(UserTeam.user_id == user_id, UserTeam.gameweek_id == 3)
        .options(joinedload(UserTeam.player).joinedload(Player.team))  # eager load player.team
        .all()
    )

    # Convert entries to PlayerDisplay
    def to_display(entry):
        return {
            "id": entry.player.id,
            "full_name": entry.player.full_name,
            "position": entry.player.position,
            "price": entry.player.price,
            "is_captain": entry.is_captain,
            "is_vice_captain": entry.is_vice_captain,
            "team": entry.player.team,
        }

    sorted_entries = sorted(user_team_entries, key=lambda x: x.player.position)
    starting = [to_display(p) for p in sorted_entries[:11]]
    bench = [to_display(p) for p in sorted_entries[11:]]

    return {
        "team_name": team.name,
        "starting": starting,
        "bench": bench
    }