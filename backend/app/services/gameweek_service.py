from fastapi import HTTPException
from prisma import Prisma
from app.repositories.gameweek_repo import determine_active_gameweek
from app.repositories.team_repo import get_top_pick_for_gameweek

async def get_current_gameweek_with_stats(db: Prisma):
    gameweek = await determine_active_gameweek(db)
    
    if not gameweek:
        raise HTTPException(status_code=404, detail="No gameweek could be determined as current.")
    
    # Fetch Aggregated Stats
    most_captained = await get_top_pick_for_gameweek(db, gameweek.id, 'is_captain')
    most_vice_captained = await get_top_pick_for_gameweek(db, gameweek.id, 'is_vice_captain')
    most_selected = await get_top_pick_for_gameweek(db, gameweek.id, None) # None means just count all rows
    
    # Chip Count (Small enough query to keep inline or move to a chip_repo later)
    chips_played = await db.userchip.count(where={'gameweek_id': gameweek.id})
    
    response_data = gameweek.model_dump()
    response_data.update({
        "most_captained": most_captained,
        "most_vice_captained": most_vice_captained,
        "most_selected": most_selected,
        "chips_played": chips_played
    })
    
    return response_data