from fastapi import APIRouter, Depends, HTTPException
from prisma import models as PrismaModels
from prisma import Prisma

from app import schemas
from app.auth import get_current_user
from app.database import get_db

# --- SERVICES & REPOS ---
from app.services.team_service import (
    auto_correct_squad_formation,
    save_user_team,
    get_user_team_full,
    save_existing_team,
    set_captain,
    set_vice_captain,
    get_player_card,
    get_public_team_view
)
from app.services.transfer_service import transfer_player
from app.repositories.gameweek_repo import get_current_gameweek

router = APIRouter()

@router.post("/submit-team")
async def submit_team(
    team: schemas.SubmitTeamRequest,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    corrected_players = await auto_correct_squad_formation(db, team.players)
    current_gameweek = await get_current_gameweek(db)

    await save_user_team(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=current_gameweek.id,
        players=[p.dict() for p in corrected_players],
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
        gw = await get_current_gameweek(db)
        gameweek_id = gw.id
    else:
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail=f"Gameweek {gameweek_number} not found.")
        gameweek_id = gw.id
    
    try:
        result = await get_user_team_full(db, str(current_user.id), gameweek_id)
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
    current_gw = await get_current_gameweek(db)
    updated = await transfer_player(
        db=db,
        user_id=str(current_user.id),
        gameweek_id=current_gw.id,
        out_player_id=payload.out_player_id,
        in_player_id=payload.in_player_id,
    )
    return updated

@router.post("/armband")
async def set_armband(
    payload: schemas.SetArmbandRequest,
    db: Prisma = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_gw = await get_current_gameweek(db)

    if payload.kind == "C":
        await set_captain(db, str(current_user.id), current_gw.id, payload.player_id)
    else:
        await set_vice_captain(db, str(current_user.id), current_gw.id, payload.player_id)

    return await get_user_team_full(db, str(current_user.id), current_gw.id)

@router.post("/save-team")
async def save_team(
    payload: schemas.SaveTeamPayload,
    db: Prisma = Depends(get_db),
    user=Depends(get_current_user)
):
    gw = await get_current_gameweek(db)
    # The payload.players comes in as Pydantic models, we convert to dict here
    updated = await save_existing_team(
        db=db,
        user_id=str(user.id),
        gameweek_id=gw.id,
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
    return await get_player_card(db, current_user.id, gameweek_id, player_id)

@router.get("/user/{user_key}/by-gameweek-number/{gameweek_number}")
async def get_user_team_by_gameweek_number_endpoint(
    user_key: str,
    gameweek_number: int,
    db: Prisma = Depends(get_db),
    _: PrismaModels.User = Depends(get_current_user),
):
    # All the complex logic was moved to get_public_team_view in team_service.py
    return await get_public_team_view(db, user_key, gameweek_number)