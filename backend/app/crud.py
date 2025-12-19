import random
from datetime import datetime, timezone
from fastapi import HTTPException
from prisma import Prisma
from collections import Counter
from app import schemas, auth
from typing import Dict, List, Optional,Any
import logging
from decimal import Decimal
from uuid import UUID
from prisma import models as PrismaModels # <--- ADD THIS LINE
from collections import defaultdict 

from app.services.team_service import (
    save_user_team, 
    carry_forward_team, 
    get_user_team_full,
    get_player_card
)
from app.services.transfer_service import (
    is_wildcard_active,
    transfer_player, 
    confirm_transfers
)
from app.utils.team_algo import _normalize_8p3


logger = logging.getLogger(__name__)

# --- USER FUNCTIONS ---

alog = logging.getLogger("aces.crud")







# --- (The rest of your existing crud.py file remains unchanged) ---

# --- ADMIN DASHBOARD FUNCTIONS ---


# --- GAMEWEEK FUNCTION ---




# --- TEAM FUNCTIONS ---








# app/crud.py







async def user_has_team(db: Prisma, user_id: str) -> bool:
    # OPTION A: if your fantasy team model is named "FantasyTeam"
    team = await db.fantasyteam.find_first(where={"user_id": user_id})
    # OPTION B: if it’s named "Team" and represents the user’s fantasy team
    # team = await db.team.find_first(where={"user_id": user_id})
    return team is not None

# In backend/app/crud.py








# In backend/app/crud.py

# In backend/app/crud.py
from datetime import datetime, timezone

# backend/app/crud.py


from collections import Counter # Make sure this is imported at the top

# ... keep other functions

# In backend/app/crud.py


