from pydantic import BaseModel, EmailStr
from uuid import UUID
from pydantic import ConfigDict
from typing import List

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True

class TeamOut(BaseModel):
    name: str
    short_name: str

    model_config = ConfigDict(from_attributes=True)

class PlayerOut(BaseModel):
    id:int
    full_name: str
    position: str
    price: float
    team: TeamOut   # Nested

    model_config = ConfigDict(from_attributes=True)

class PlayerSelection(BaseModel):
    id: int
    position:str
    is_captain: bool = False
    is_vice_captain: bool = False
    is_benched: bool = False

class SubmitTeamRequest(BaseModel):
    team_name:str
    players: List[PlayerSelection]

class PlayerDisplay(BaseModel):
    id: int
    full_name: str
    position: str
    price: float
    is_captain: bool
    is_vice_captain: bool
    team: TeamOut  # already defined
    is_benched:bool

    model_config = ConfigDict(from_attributes=True)

class GetTeamResponse(BaseModel):
    team_name: str
    starting: List[PlayerDisplay]
    bench: List[PlayerDisplay]

class LeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    total_points: int