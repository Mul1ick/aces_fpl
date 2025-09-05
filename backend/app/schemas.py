from pydantic import BaseModel, EmailStr, ConfigDict,Field
from uuid import UUID
from typing import List, Optional, TypeVar, Generic
from datetime import datetime

# --- Generic Type for Paginated Response ---
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    per_page: int
    pages: int

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: UUID
    is_active: bool
    role: str
    # created_at is no longer required by the API response
    
    class Config:
        from_attributes = True

class UserUpdateRole(BaseModel):
    role: str # 'admin' or 'user'

class BulkApproveRequest(BaseModel):
    user_ids: List[UUID]

# --- Token Schema ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# --- Team Schemas ---
class TeamBase(BaseModel):
    name: str
    short_name: str

class TeamCreate(TeamBase):
    pass

class TeamOut(TeamBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Player Schemas ---
class PlayerBase(BaseModel):
    full_name: str
    position: str
    price: float
    team_id: int

class PlayerCreate(PlayerBase):
    pass

class PlayerOut(PlayerBase):
    id: int
    team: TeamOut
    model_config = ConfigDict(from_attributes=True)

# --- FPL Specific Schemas (from your original file) ---
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
    team: TeamOut
    is_benched:bool
    points: int
    fixture_str: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class GetTeamResponse(BaseModel):
    team_name: str
    starting: List[PlayerDisplay]
    bench: List[PlayerDisplay]

class LeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    total_points: int

# --- Admin Dashboard Schemas ---
class Gameweek(BaseModel):
    id: int
    gw_number: int
    deadline: datetime
    model_config = ConfigDict(from_attributes=True)

class Activity(BaseModel):
    id: str
    type: str
    description: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    pending_users: int
    total_users: int
    total_players: int
    current_gameweek: Optional[Gameweek] = None
    recent_activities: List[Activity]

class TransferRequest(BaseModel):
    out_player_id: int
    in_player_id: int

class SetArmbandRequest(BaseModel):
    player_id: int
    kind: str = Field(pattern="^(C|VC)$")  # C = captain, VC = vice-captain

class SaveTeamPayload(BaseModel):
    players: list[dict]