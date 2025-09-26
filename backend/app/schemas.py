from pydantic import BaseModel, EmailStr, ConfigDict,Field,field_validator
from uuid import UUID
from typing import List, Optional, TypeVar, Generic,Literal,Dict,Any
from datetime import datetime

# --- Generic Type for Paginated Response ---
PlayerStatus = Literal['ACTIVE', 'INJURED', 'SUSPENDED']

T = TypeVar('T')

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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
    has_team: bool
    free_transfers: int = 0                 # ← add default
    played_first_gameweek: bool = False

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

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None

# --- Player Schemas ---
class PlayerBase(BaseModel):
    full_name: str
    position: str
    price: float
    team_id: int
    status: PlayerStatus
    


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
    recent_fixtures: Optional[List[Dict[str, Any]]] = None
    raw_stats: Optional[Dict[str, int]] = None   # minutes, goals_scored, assists, yellow_cards, red_cards, bonus_points
    breakdown: Optional[List[Dict[str, int | str]]] = None
    model_config = ConfigDict(from_attributes=True)

class GetTeamResponse(BaseModel):
    team_name: str
    starting: List[PlayerDisplay]
    bench: List[PlayerDisplay]

class LeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    total_points: int
    manager_email: str
    user_id: str

# --- Admin Dashboard Schemas ---
class Gameweek(BaseModel):
    id: int
    gw_number: int
    deadline: datetime
    name: str
    finished: bool
    is_current: bool
    is_next: bool
    data_checked: bool

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


Position = Literal['GK', 'DEF', 'MID', 'FWD']
class PlayerUpdate(BaseModel):
    full_name: Optional[str] = None
    position: Optional[Position] = None
    price: Optional[float] = None
    status: Optional[PlayerStatus] = None
    team_id: Optional[int] = None

    @field_validator('price', mode='before')
    @classmethod
    def _price(cls, v):
        return None if v is None else float(v)

    @field_validator('team_id', mode='before')
    @classmethod
    def _team(cls, v):
        return None if v is None else int(v)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TeamOutWithCount(TeamOut):
    player_count: int


class TeamTiny(BaseModel):
    id: int
    name: str
    short_name: str
    logo_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class FixtureOut(BaseModel):
    id: int
    gameweek_id: int
    home_team_id: int
    away_team_id: int
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    stats_entered: Optional[bool] = None
    home_team: TeamTiny
    away_team: TeamTiny
    model_config = ConfigDict(from_attributes=True)

class GameweekOutWithFixtures(BaseModel):
    id: int
    gw_number: int
    deadline: datetime
    fixtures: List[FixtureOut] = []
    model_config = ConfigDict(from_attributes=True)

class PlayerSelection(BaseModel):
    id: int
    is_captain: bool = False
    is_vice_captain: bool = False
    is_benched: bool = False

class SaveTeamPayload(BaseModel):
    players: List[PlayerSelection]

ChipName = Literal['TRIPLE_CAPTAIN', 'WILDCARD']

class PlayChipRequest(BaseModel):
    chip: ChipName
    gameweek_id: Optional[int] = None  # default = current GW

class ChipStatus(BaseModel):
    active: Optional[ChipName] = None
    used: List[ChipName] = []


class PlayerStatIn(BaseModel):
    player_id: int
    played: bool = False                # NEW: To track if the player played
    goals_scored: int = 0
    assists: int = 0
    clean_sheets: bool = False          # NEW: Direct toggle from the modal
    goals_conceded: int = 0             # NEW: Per-player stat
    own_goals: int = 0                  # NEW
    penalties_missed: int = 0           # NEW
    yellow_cards: int = 0
    red_cards: int = 0
    bonus_points: int = 0


class SubmitFixtureStats(BaseModel):
    fixture_id: int
    home_score: int = Field(ge=0)
    away_score: int = Field(ge=0)
    player_stats: List[PlayerStatIn]

class PlayerStatOut(BaseModel):
    player_id: int
    goals_scored: int
    assists: int
    yellow_cards: int
    red_cards: int
    bonus_points: int
    minutes: int

class FixtureStatsOut(BaseModel):
    home_score: int | None = None
    away_score: int | None = None
    player_stats: list[PlayerStatOut]


class GameweekStatsOut(BaseModel):
    user_points: int
    average_points: int
    highest_points: int

class ManagerHubStats(BaseModel):
    overall_points: int
    gameweek_points: int
    total_players: int
    squad_value: float
    in_the_bank: float
    gameweek_transfers: int
    total_transfers: int

class TeamOfTheWeekOut(BaseModel):
    manager_name: str
    team_name: str
    points: int
    starting: List[PlayerDisplay]
    bench: List[PlayerDisplay]

class LeaderboardEntry(BaseModel):
    rank: int
    team_name: str
    manager_email: EmailStr  # Add this field
    total_points: int
    user_id: str


class TransferItem(BaseModel):
    out_player_id: int
    in_player_id: int

class ConfirmTransfersRequest(BaseModel):
    transfers: List[TransferItem]

