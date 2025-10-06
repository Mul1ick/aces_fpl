from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from prisma import Prisma
from datetime import datetime, timezone
from app.auth import get_current_user
from typing import Optional
from prisma import models as PrismaModels
from app import schemas, crud
from datetime import datetime, timezone

router = APIRouter()

# --- ADDED: New endpoint to get all gameweeks ---
@router.get("/")
async def get_all_gameweeks(db: Prisma = Depends(get_db)):
    """
    Returns a list of all gameweeks, sorted by their number.
    """
    return await db.gameweek.find_many(order={'gw_number': 'asc'})

# @router.get("/gameweek/current")
# async def get_current_gameweek(db: Prisma = Depends(get_db)):
#     """
#     Finds the current gameweek based on its status.
#     Priority: LIVE > UPCOMING > Last FINISHED.
#     """
#     # 1. Prioritize finding the LIVE gameweek
#     gameweek = await db.gameweek.find_first(
#         where={'status': 'LIVE'},
#         order={'gw_number': 'asc'}
#     )
#     # 2. If no gameweek is LIVE, find the next UPCOMING one
#     if not gameweek:
#         gameweek = await db.gameweek.find_first(
#             where={'status': 'UPCOMING'},
#             order={'gw_number': 'asc'}
#         )
#     # 3. If none are LIVE or UPCOMING, find the most recently FINISHED one
#     if not gameweek:
#         gameweek = await db.gameweek.find_first(
#             where={'status': 'FINISHED'},
#             order={'gw_number': 'desc'}
#         )
    
#     if not gameweek:
#         raise HTTPException(status_code=404, detail="No gameweek could be determined as current.")
    
#     # --- The rest of the function for fetching stats (most captained, etc.) remains the same ---
#     cap_agg = await db.userteam.group_by(
#         by=['player_id'],
#         where={'gameweek_id': gameweek.id, 'is_captain': True},
#         count={'_all': True},
#         order={'_count': {'player_id': 'desc'}},
#         take=1
#     )
#     most_captained = None
#     if cap_agg:
#         player = await db.player.find_unique(where={'id': cap_agg[0]['player_id']}, include={'team': True})
#         if player and player.team:
#             most_captained = {"name": player.full_name, "team_name": player.team.name}

#     vc_agg = await db.userteam.group_by(
#         by=['player_id'],
#         where={'gameweek_id': gameweek.id, 'is_vice_captain': True},
#         count={'_all': True},
#         order={'_count': {'player_id': 'desc'}},
#         take=1
#     )
#     most_vice_captained = None
#     if vc_agg:
#         player = await db.player.find_unique(where={'id': vc_agg[0]['player_id']}, include={'team': True})
#         if player and player.team:
#             most_vice_captained = {"name": player.full_name, "team_name": player.team.name}

#     selected_agg = await db.userteam.group_by(
#         by=['player_id'],
#         where={'gameweek_id': gameweek.id},
#         count={'_all': True},
#         order={'_count': {'player_id': 'desc'}},
#         take=1
#     )
#     most_selected = None
#     if selected_agg:
#         player = await db.player.find_unique(where={'id': selected_agg[0]['player_id']}, include={'team': True})
#         if player and player.team:
#             most_selected = {"name": player.full_name, "team_name": player.team.name}

#     chips_played = await db.userchip.count(where={'gameweek_id': gameweek.id})
    
#     response_data = gameweek.model_dump()
#     response_data.update({
#         "most_captained": most_captained,
#         "most_vice_captained": most_vice_captained,
#         "most_selected": most_selected,
#         "chips_played": chips_played
#     })
    
#     return response_data

@router.get("/gameweek/current")
async def get_current_gameweek(db: Prisma = Depends(get_db)):
    """
    Finds the current gameweek with improved logic to match official FPL behavior.
    - If a LIVE gameweek's deadline has passed, it's the current one.
    - Otherwise, it shows the most recently FINISHED gameweek.
    """
    # --- Block 1: Initialization ---
    # Get the current time in UTC to reliably compare against the database deadlines.
    now_utc = datetime.now(timezone.utc)
    gameweek = None
    # --- End of Block 1 ---


    # --- Block 2: Find the Active Gameweek ---
    # The primary goal is to find a gameweek that is currently 'LIVE' and whose
    # deadline has already passed, meaning matches are in progress.
    live_gameweek = await db.gameweek.find_first(
        where={'status': 'LIVE'},
        order={'gw_number': 'asc'}
    )
    if live_gameweek and live_gameweek.deadline < now_utc:
        gameweek = live_gameweek
    # --- End of Block 2 ---


    # --- Block 3: Fallback to Last Finished Gameweek ---
    # If no gameweek is actively in progress (e.g., it's Tuesday and the next
    # deadline is Friday), this logic finds the most recently completed gameweek
    # to show the user their final points and rank. This is the key change.
    if not gameweek:
        gameweek = await db.gameweek.find_first(
            where={'status': 'FINISHED'},
            order={'gw_number': 'desc'}
        )
    # --- End of Block 3 ---


    # --- Block 4: Fallback for Pre-Season ---
    # If no gameweeks are 'LIVE' or 'FINISHED', it means the season hasn't started.
    # This block finds the very first 'UPCOMING' gameweek (i.e., Gameweek 1).
    if not gameweek:
        gameweek = await db.gameweek.find_first(
            where={'status': 'UPCOMING'},
            order={'gw_number': 'asc'}
        )
    # --- End of Block 4 ---


    # --- Block 5: Error Handling ---
    # If after all checks no gameweek can be found, it means the database is empty,
    # and we should return an error.
    if not gameweek:
        raise HTTPException(status_code=404, detail="No gameweek could be determined as current.")
    # --- End of Block 5 ---


    # --- Block 6: Fetch Gameweek Statistics ---
    # Now that we have definitively found the correct gameweek to display,
    # the rest of the function gathers interesting stats for that specific gameweek,
    # such as the most captained and most selected players.
    cap_agg = await db.userteam.group_by(
        by=['player_id'],
        where={'gameweek_id': gameweek.id, 'is_captain': True},
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    most_captained = None
    if cap_agg:
        player = await db.player.find_unique(where={'id': cap_agg[0]['player_id']}, include={'team': True})
        if player and player.team:
            most_captained = {"name": player.full_name, "team_name": player.team.name}

    vc_agg = await db.userteam.group_by(
        by=['player_id'],
        where={'gameweek_id': gameweek.id, 'is_vice_captain': True},
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    most_vice_captained = None
    if vc_agg:
        player = await db.player.find_unique(where={'id': vc_agg[0]['player_id']}, include={'team': True})
        if player and player.team:
            most_vice_captained = {"name": player.full_name, "team_name": player.team.name}

    selected_agg = await db.userteam.group_by(
        by=['player_id'],
        where={'gameweek_id': gameweek.id},
        count={'_all': True},
        order={'_count': {'player_id': 'desc'}},
        take=1
    )
    most_selected = None
    if selected_agg:
        player = await db.player.find_unique(where={'id': selected_agg[0]['player_id']}, include={'team': True})
        if player and player.team:
            most_selected = {"name": player.full_name, "team_name": player.team.name}

    chips_played = await db.userchip.count(where={'gameweek_id': gameweek.id})
    # --- End of Block 6 ---

    
    # --- Block 7: Assemble and Return Final Response ---
    # The final step is to combine the determined gameweek's data with all the
    # aggregate stats we just calculated into a single response object for the frontend.
    response_data = gameweek.model_dump()
    response_data.update({
        "most_captained": most_captained,
        "most_vice_captained": most_vice_captained,
        "most_selected": most_selected,
        "chips_played": chips_played
    })
    
    return response_data
    # --- End of Block 7 ---

@router.get("/{gameweek_number}/stats", response_model=schemas.GameweekStatsOut)
@router.get("/stats", response_model=schemas.GameweekStatsOut, include_in_schema=False)
async def get_gameweek_stats(
    gameweek_number: int | None = None,
    db: Prisma = Depends(get_db),
    current_user: PrismaModels.User = Depends(get_current_user)
):
    gameweek_id: int
    if gameweek_number is None:
        current_gameweek = await crud.get_current_gameweek(db)
        gameweek_id = current_gameweek.id
    else:
        # --- MODIFIED: Find the gameweek by its number to get the ID ---
        gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
        if not gw:
            raise HTTPException(status_code=404, detail=f"Gameweek {gameweek_number} not found.")
        gameweek_id = gw.id
        
    return await crud.get_gameweek_stats_for_user(
        db,
        user_id=str(current_user.id),
        gameweek_id=gameweek_id
    )

@router.get("/team-of-the-week", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_latest_team_of_the_week(db: Prisma = Depends(get_db)):
    """
    Gets the Team of the Week for the last completed gameweek.
    """
    team_data = await crud.get_team_of_the_week(db)
    if not team_data:
        raise HTTPException(status_code=404, detail="Team of the Week not available.")
    return team_data

# ✅ ADD THIS: Route for TeamView (gets a specific TOTW by number)
@router.get("/team-of-the-week/{gameweek_number}", response_model=Optional[schemas.TeamOfTheWeekOut])
async def get_team_of_the_week_for_gameweek(gameweek_number: int, db: Prisma = Depends(get_db)):
    """
    Gets the Team of the Week for a specific gameweek number.
    """
    team_data = await crud.get_team_of_the_week(db, gameweek_number=gameweek_number)
    if not team_data:
        raise HTTPException(
            status_code=404,
            detail=f"Team of the Week for gameweek {gameweek_number} not found or not yet calculated."
        )
    return team_data

@router.get("/next-actionable")
async def get_next_actionable_gameweek(db: Prisma = Depends(get_db)):
    """
    Finds the next gameweek a user can make changes for, respecting deadlines.
    """
    now_utc = datetime.now(timezone.utc)
    gameweek_to_return = None

    # 1. Check for a live gameweek
    live_gw = await db.gameweek.find_first(
        where={'status': 'LIVE'},
        order={'gw_number': 'asc'}
    )

    # 2. If a live gameweek exists, check its deadline
    if live_gw:
        # If the deadline is still in the future, this is our actionable gameweek
        if live_gw.deadline > now_utc:
            gameweek_to_return = live_gw
        # If the deadline has passed, we need to find the *next* upcoming one
        else:
            gameweek_to_return = await db.gameweek.find_first(
                where={'status': 'UPCOMING'},
                order={'gw_number': 'asc'}
            )
            
    # 3. If no live gameweek was found at all, just find the next upcoming one
    if not gameweek_to_return:
        gameweek_to_return = await db.gameweek.find_first(
            where={'status': 'UPCOMING'},
            order={'gw_number': 'asc'}
        )

    if not gameweek_to_return:
        raise HTTPException(status_code=404, detail="No actionable gameweek found.")
        
    return gameweek_to_return