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
    full_name: str
    position: str
    price: float
    team: TeamOut   # Nested

    model_config = ConfigDict(from_attributes=True)

class PlayerSelection(BaseModel):
    id: int
    position: str

class SubmitTeamRequest(BaseModel):
    team_name: str
    players: List[PlayerSelection]