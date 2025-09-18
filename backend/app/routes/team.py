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

@router.get("/team/by-gameweek-number/{gameweek_number}", response_model=schemas.GetTeamResponse)
@router.get("/team", response_model=schemas.GetTeamResponse, include_in_schema=False)
async def get_team(
    gameweek_number: int | None = None,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    gameweek_id: int
    if gameweek_number is None:
        gw = await crud.get_current_gameweek(db)
        gameweek_id = gw.id
    else:
        # --- MODIFIED: Find the gameweek by its number to get the ID ---
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail=f"Gameweek {gameweek_number} not found.")
        gameweek_id = gw.id
    
    print(f"✅ LOG: Gameweek Number {gameweek_number} corresponds to ID {gameweek_id}")
    
    try:
        result = await crud.get_user_team_full(db, str(current_user.id), gameweek_id)
        if not result:
            raise HTTPException(status_code=404, detail="Team not found for this gameweek")
        
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


@router.get("/teams/{gameweek_id}/players/{player_id}/card")
async def get_player_card_endpoint(
    gameweek_id: int,
    player_id: int,
    db: Prisma = Depends(get_db),
    current_user: schemas.UserOut = Depends(get_current_user)
):
    return await crud.get_player_card(db, current_user.id, gameweek_id, player_id)