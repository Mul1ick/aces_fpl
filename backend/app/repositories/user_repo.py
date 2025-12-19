from typing import List, Optional
from uuid import UUID
from prisma import Prisma
from app import schemas, auth
import logging

logger = logging.getLogger(__name__)

async def get_user_by_email(db: Prisma, email: str):
    return await db.user.find_unique(where={"email": email})

async def get_user_by_id(db: Prisma, user_id: str):
    try:
        uuid_obj = UUID(user_id)
        return await db.user.find_unique(where={"id": str(uuid_obj)})
    except (ValueError, TypeError):
        logger.warning(f"Invalid UUID passed to get_user_by_id: {user_id}")
        return None
    
async def create_user(db: Prisma, user: schemas.UserCreate):
    hashed_pw = auth.hash_password(user.password)
    new_user = await db.user.create(
        data={
            'email': user.email, 
            'hashed_password': hashed_pw,
            'full_name': user.email.split('@')[0]
        }
    )
    logger.info(f"User created successfully: {user.email}")
    return new_user

async def get_pending_users(db: Prisma):
    return await db.user.find_many(where={'is_active': False})


async def get_all_users(db: Prisma, page: int, per_page: int, search: Optional[str] = None, role: Optional[str] = None):
    skip = (page - 1) * per_page
    
    # --- UPDATED --- Build the where clause dynamically
    where_clause = {}
    if search:
        where_clause['OR'] = [
            {'email': {'contains': search, 'mode': 'insensitive'}},
            {'full_name': {'contains': search, 'mode': 'insensitive'}},
        ]
    
    if role:
        where_clause['role'] = role

    total_users = await db.user.count(where=where_clause)
    users = await db.user.find_many(
        where=where_clause,
        skip=skip,
        take=per_page,
    )
    
    return {
        "items": users,
        "total": total_users,
        "page": page,
        "per_page": per_page,
        "pages": (total_users + per_page - 1) // per_page if per_page > 0 else 0
    }

async def approve_user(db: Prisma, user_id: str):
    await db.user.update(where={'id': user_id}, data={'is_active': True})
    return await db.user.find_unique(where={'id': user_id})

async def update_user_role(db: Prisma, user_id: str, role: str):
    await db.user.update(where={'id': user_id}, data={'role': role})
    return await db.user.find_unique(where={'id': user_id})

async def bulk_approve_users(db: Prisma, user_ids: List[UUID]):
    user_id_strs = [str(uid) for uid in user_ids]
    return await db.user.update_many(
        where={'id': {'in': user_id_strs}},
        data={'is_active': True}
    )


async def user_has_team(db: Prisma, user_id: str) -> bool:
    # OPTION A: if your fantasy team model is named "FantasyTeam"
    team = await db.fantasyteam.find_first(where={"user_id": user_id})
    # OPTION B: if it’s named "Team" and represents the user’s fantasy team
    # team = await db.team.find_first(where={"user_id": user_id})
    return team is not None

async def create_google_user(db: Prisma, email: str, full_name: str):
    """Creates a pending user from Google OAuth details."""
    return await db.user.create(
        data={
            "email": email,
            "full_name": full_name,
            "hashed_password": "",  # No password for OAuth users
            "is_active": False,     # Pending approval
            "role": "user",
        }
    )