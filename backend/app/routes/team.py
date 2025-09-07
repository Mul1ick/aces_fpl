from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app import schemas, crud
from app.auth import get_current_user
from prisma import Prisma
from prisma import models as PrismaModels # Import Prisma's generated models
from app.schemas import SetArmbandRequest,SaveTeamPayload


router = APIRouter()

@router.post("/submit-team")
async def submit_team(
    team: schemas.SubmitTeamRequest,
    db: Prisma = Depends(get_db),
    # CORRECT: Use the Prisma model for the type hint
    current_user: PrismaModels.User = Depends(get_current_user)
):
    current_gameweek = await crud.get_current_gameweek(db)

    
    await crud.save_user_team(
        db=db,
        user_id=str(current_user.id), # Use str() for safety
        gameweek_id=current_gameweek.id,
        players=[p.dict() for p in team.players],
        team_name=team.team_name
    )

    return {"message": "Team submitted successfully"}

@router.get("/team", response_model=schemas.GetTeamResponse)
async def get_team(
    db: Prisma = Depends(get_db),
    # CORRECT: Use the Prisma model for the type hint
    current_user: PrismaModels.User = Depends(get_current_user)
):
    current_gameweek = await crud.get_current_gameweek(db)
    print(f"✅ LOG: Current Gameweek ID is {current_gameweek.id}")
    
    try:
        result = await crud.get_user_team_full(db, str(current_user.id), current_gameweek.id)
        if not result:   # 👈 add this block
            raise HTTPException(status_code=404, detail="Team not found")
        
        return result
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    
@router.post("/transfer", response_model=schemas.GetTeamResponse)
async def transfer_player_route(
    payload: schemas.TransferRequest,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user),
):
    current_gw = await crud.get_current_gameweek(db)
    updated = await crud.transfer_player(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=current_gw.id,
        out_player_id=payload.out_player_id,
        in_player_id=payload.in_player_id,
    )
    return updated



@router.post("/armband")
async def set_armband(
    payload: SetArmbandRequest,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_gw = await crud.get_current_gameweek(db)

    if payload.kind == "C":
        await crud.set_captain(db, str(current_user.id), current_gw.id, payload.player_id)
    else:
        await crud.set_vice_captain(db, str(current_user.id), current_gw.id, payload.player_id)

    return await crud.get_user_team_full(db, str(current_user.id), current_gw.id)

@router.post("/save-team")
async def save_team(
    payload: schemas.SaveTeamPayload,
    db: Prisma = Depends(get_db),
    user=Depends(get_current_user)
):
    gw = await crud.get_current_gameweek(db)
    if not gw:
        raise HTTPException(404, "No gameweek")

    updated = await crud.save_existing_team(
        db=db,
        user_id=str(user.id),
        gameweek_id=gw.id,
        # CORRECTED: Convert Pydantic models to dictionaries
        new_players=[p.dict() for p in payload.players]
    )
    return updated