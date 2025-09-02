from fastapi import APIRouter, Depends, HTTPException, Query
from prisma import Prisma
from app import schemas, crud, auth
from app.database import get_db
from typing import List, Optional
from uuid import UUID

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(auth.get_current_admin_user)]
)

# --- DASHBOARD ---
@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
async def get_dashboard_stats(db: Prisma = Depends(get_db)):
    """
    Get statistics for the admin dashboard.
    """
    stats = await crud.get_dashboard_stats(db)
    if not stats:
        raise HTTPException(status_code=404, detail="Could not retrieve dashboard stats.")
    return stats

# --- USER MANAGEMENT ---

@router.get("/users/pending", response_model=List[schemas.UserOut])
async def get_pending_users(db: Prisma = Depends(get_db)):
    """
    Get a list of all users awaiting approval.
    """
    return await crud.get_pending_users(db)

@router.get("/users", response_model=schemas.PaginatedResponse[schemas.UserOut])
async def get_all_users(
    db: Prisma = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None) # --- NEW --- Add role filter
):
    """
    Get a paginated list of all users, with optional search and role filtering.
    """
    # --- UPDATED --- Pass the new role filter to the crud function
    return await crud.get_all_users(db, page=page, per_page=per_page, search=search, role=role)


@router.post("/users/{user_id}/approve", response_model=schemas.UserOut)
async def approve_user(user_id: str, db: Prisma = Depends(get_db)):
    """
    Approve a single user by their ID.
    """
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.approve_user(db, user_id)

@router.post("/users/bulk-approve", response_model=dict)
async def bulk_approve_users(request: schemas.BulkApproveRequest, db: Prisma = Depends(get_db)):
    """
    Approve multiple users in a single request.
    """
    result = await crud.bulk_approve_users(db, request.user_ids)
    return {"message": f"Successfully approved {result.count} users."}

@router.post("/users/{user_id}/role", response_model=schemas.UserOut)
async def update_user_role(user_id: str, request: schemas.UserUpdateRole, db: Prisma = Depends(get_db)):
    """
    Update a user's role (e.g., promote to admin).
    """
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await crud.update_user_role(db, user_id, request.role)

