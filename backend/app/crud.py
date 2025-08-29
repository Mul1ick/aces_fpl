import random
from sqlalchemy.orm import Session
from app import models, schemas, auth
from sqlalchemy.orm import Session, joinedload
from app.models import FantasyTeam, UserTeam, Player
from fastapi import HTTPException

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

def save_user_team(db: Session, user_id: str, gameweek_id: int, team_name: str, players: list[dict]):

    
 
    # --- This part for saving the fantasy team name stays the same ---
    db_fantasy_team = db.query(FantasyTeam).filter(FantasyTeam.user_id == user_id).first()
    if db_fantasy_team:
        db_fantasy_team.name = team_name
    else:
        db_fantasy_team = FantasyTeam(name=team_name, user_id=user_id)
        db.add(db_fantasy_team)

    # --- Delete the user's old team for this gameweek to avoid duplicates ---
    db.query(UserTeam).filter(
        UserTeam.user_id == user_id,
        UserTeam.gameweek_id == gameweek_id
    ).delete()

    # --- NEW LOGIC: Randomly assign roles to the 11 players ---
    player_ids = [p["id"] for p in players]
    if len(player_ids) != 11:
        raise HTTPException(status_code=400, detail="A full squad of 11 players is required.")
    player_objects = db.query(Player).filter(Player.id.in_(player_ids)).all()

    goalkeepers = [p for p in player_objects if p.position == 'GK']
    outfielders = [p for p in player_objects if p.position != 'GK']

    if len(goalkeepers) != 2:
        raise HTTPException(status_code=400, detail="You must select exactly two goalkeepers.")

    # 1. Randomly bench one goalkeeper
    benched_gk = random.choice(goalkeepers)
    starting_gk = [gk for gk in goalkeepers if gk != benched_gk][0]

    # 2. Randomly bench two outfield players
    benched_outfielders = random.sample(outfielders, 2)
    starting_outfielders = [p for p in outfielders if p not in benched_outfielders]

    # Combine the benched player IDs
    benched_ids = [p.id for p in benched_outfielders] + [benched_gk.id]
    
    # Combine the starting player objects for captaincy selection
    starters = starting_outfielders + [starting_gk]
    starter_ids = [p.id for p in starters]

    # 3. Select captain and vice-captain from the 8 starters
    captain_id = random.choice(starter_ids)
    remaining_starters = [pid for pid in starter_ids if pid != captain_id]
    vice_captain_id = random.choice(remaining_starters)

    # --- (Insert new team logic remains the same) ---
    for player_id in player_ids:
        entry = UserTeam(
            user_id=user_id,
            gameweek_id=gameweek_id,
            player_id=player_id,
            is_captain=(player_id == captain_id),
            is_vice_captain=(player_id == vice_captain_id),
            is_benched=(player_id in benched_ids)
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
            "is_benched":entry.is_benched
        }

    all_players = [to_display(p) for p in user_team_entries]
    
    starting = [p for p in all_players if not p["is_benched"]]
    bench = [p for p in all_players if p["is_benched"]]


    return {
        "team_name": team.name,
        "starting": starting,
        "bench": bench
    }