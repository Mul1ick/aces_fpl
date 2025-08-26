from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric,DateTime
from sqlalchemy.dialects.postgresql import UUID 
from sqlalchemy.orm import relationship
from app.database import Base
import uuid 

# ─────────────────────────────
# ✅ Team model (MUST be defined before Player)
# ─────────────────────────────
class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    short_name = Column(String(3), unique=True, nullable=False)

    players = relationship("Player", back_populates="team")

# ─────────────────────────────
# ✅ User model
# ─────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=False)

# ─────────────────────────────
# ✅ Player model
# ─────────────────────────────
class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    price = Column(Numeric(5, 2), nullable=False)

    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    team = relationship("Team", back_populates="players")

class UserTeam(Base):
    __tablename__ = "user_teams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    gameweek_id = Column(Integer, ForeignKey("gameweeks.id"))
    player_id = Column(Integer, ForeignKey("players.id"))
    player_role = Column(String)
    team_name = Column(String)


class Gameweek(Base):
    __tablename__ = "gameweeks"

    id = Column(Integer, primary_key=True, index=True)
    gw_number = Column(Integer, nullable=False)
    deadline = Column(DateTime, nullable=False)