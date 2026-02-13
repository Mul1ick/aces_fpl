import logging
from typing import List, Dict, Set
from prisma import Prisma
from app.repositories.player_repo import count_players_in_team
from collections import Counter

logger = logging.getLogger("aces.autosub")

# --- 1. HELPER: DETERMINE IF PLAYER PLAYED ---
def did_player_play(stats: Dict) -> bool:
    """
    Determines if a player participated in the match.
    Logic:
    1. If Total Points != 0 -> They played.
    2. If Total Points == 0 BUT they have stats (e.g. Yellow Card + Conceded Goals),
       then they played (Net 0).
    3. If Total Points == 0 AND No stats -> They did not play.
    """
    if not stats:
        return False
    
    # If points are non-zero, they definitely played
    if stats.get('points', 0) != 0:
        return True

    # If points are 0, check for ANY statistical entry (The "Net 0" Check)
    # We ignore 'minutes' as per requirements.
    stat_keys = [
        'goals_scored', 'assists', 'yellow_cards', 'red_cards', 
        'bonus_points', 'clean_sheets', 'goals_conceded', 
        'own_goals', 'penalties_missed','penalties_saved'
    ]
    
    for key in stat_keys:
        if stats.get(key, 0) != 0:
            return True # Found a stat entry, so they played

    return False

# --- 2. HELPER: VALIDATE FORMATION ---
def is_valid_formation(starters: List[Dict]) -> bool:
    """
    Checks if the starting lineup is valid according to Aces 8-man rules:
    - Exactly 1 GK
    - At least 2 DEF
    - At least 1 FWD
    """
    positions = Counter(p['position'] for p in starters)
    
    if positions['GK'] != 1: return False
    if positions['DEF'] < 2: return False
    if positions['FWD'] < 1: return False
    
    return True

# --- 3. CORE LOGIC ---
async def process_autosubs_for_gameweek(db: Prisma, gameweek_id: int):
    logger.info(f"Starting Autosub process for GW {gameweek_id}")
    
    # 1. Fetch All Stats for this GW
    # Map: player_id -> stats_dict
    all_stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id}
    )
    stats_map = {s.player_id: s.model_dump() for s in all_stats}

    # 2. Fetch All User Teams for this GW
    # We need player positions, so we include player info
    user_teams = await db.userteam.find_many(
        where={'gameweek_id': gameweek_id},
        include={'player': True},
        order={'id': 'asc'} # Order ensures stable bench priority if not explicitly defined
    )

    # Group by User
    teams_by_user: Dict[str, List] = {}
    for entry in user_teams:
        if entry.user_id not in teams_by_user:
            teams_by_user[entry.user_id] = []
        teams_by_user[entry.user_id].append(entry)

    updates_made = 0

    # 3. Process Each Team
    for user_id, squad in teams_by_user.items():
        
        # SQUAD PARSING
        # We convert to a mutable list of dicts to simulate swaps easily
        # structure: {id, player_id, position, is_benched, ...}
        roster = []
        for entry in squad:
            roster.append({
                'db_id': entry.id, # The UserTeam row ID
                'player_id': entry.player_id,
                'position': entry.player.position,
                'is_benched': entry.is_benched,
                'is_captain': entry.is_captain,
                'is_vice_captain': entry.is_vice_captain,
                'bench_priority': entry.bench_priority,
                
            })

        starters = [p for p in roster if not p['is_benched']]
        bench = [p for p in roster if p['is_benched']]

        # IDENTIFY INACTIVE PLAYERS
        inactive_starter_indices = []
        for i, p in enumerate(starters):
            p_stats = stats_map.get(p['player_id'])
            if not did_player_play(p_stats):
                inactive_starter_indices.append(i)

        if not inactive_starter_indices:
            continue # No subs needed for this user

        # LOGIC A: GOALKEEPER SWAP
        # Check if the starting GK is inactive
        gk_idx = next((i for i, idx in enumerate(inactive_starter_indices) if starters[idx]['position'] == 'GK'), None)
        
        if gk_idx is not None:
            starter_idx = inactive_starter_indices[gk_idx]
            # Find Bench GK
            bench_gk_idx = next((i for i, p in enumerate(bench) if p['position'] == 'GK'), None)
            
            if bench_gk_idx is not None:
                bench_gk_stats = stats_map.get(bench[bench_gk_idx]['player_id'])
                # Only swap if Bench GK actually played
                if did_player_play(bench_gk_stats):
                    # Perform Swap
                    logger.info(f"User {user_id}: Subbing GK {starters[starter_idx]['player_id']} OUT, {bench[bench_gk_idx]['player_id']} IN")
                    
                    # Swap in local list
                    starters[starter_idx], bench[bench_gk_idx] = bench[bench_gk_idx], starters[starter_idx]
                    
                    # Update DB immediately (or collect and bulk update)
                    # For safety, we update row by row here or batched later. 
                    # Let's collect DB updates.
                    # Remove from inactive list since we resolved it
                    inactive_starter_indices.pop(gk_idx) 

        # LOGIC B: OUTFIELD SWAPS
        # Iterate through remaining inactive starters
        # We must re-evaluate inactive_starter_indices because indices might have shifted if we were using pop(), 
        # but here we just swapped active/bench, the 'starters' list length is constant.
        
        # Re-scan for current inactive outfielders
        current_inactive_starters = [
            p for p in starters 
            if not did_player_play(stats_map.get(p['player_id'])) 
            and p['position'] != 'GK' # GK handled above
        ]

        # Get active outfield bench players
        active_bench_outfield = [
            p for p in bench 
            if p['position'] != 'GK' 
            and did_player_play(stats_map.get(p['player_id']))
        ]

        # Attempt to swap
        # Priority: Bench Order (First available active bench player tries to replace first inactive starter)
        
        for bench_player in active_bench_outfield:
            if not current_inactive_starters:
                break # All holes filled

            # Try to slot this bench player into the first VALID hole
            swap_successful = False
            for starter_to_remove in current_inactive_starters:
                
                # HYPOTHETICAL FORMATION CHECK
                # Create a temporary starters list with the swap
                hypothetical_starters = [s for s in starters if s != starter_to_remove] + [bench_player]
                
                if is_valid_formation(hypothetical_starters):
                    # VALID SWAP!
                    logger.info(f"User {user_id}: Autosub {starter_to_remove['player_id']} OUT, {bench_player['player_id']} IN")
                    
                    # 1. Update lists
                    starters.remove(starter_to_remove)
                    starters.append(bench_player)
                    bench.remove(bench_player)
                    bench.append(starter_to_remove) # Put inactive player on bench
                    
                    # 2. Update tracking lists
                    current_inactive_starters.remove(starter_to_remove)
                    
                    swap_successful = True
                    break # Move to next active bench player (this one is used)
            
            if not swap_successful:
                logger.debug(f"User {user_id}: Could not sub in {bench_player['player_id']} - formation constraint.")

        # 4. COMMIT UPDATES TO DB
        # We simply update the 'is_benched' flags based on our final 'starters' list
        async with db.tx() as tx:
            # Set all final starters to is_benched=False
            for p in starters:
                await tx.userteam.update(
                    where={'id': p['db_id']},
                    data={'is_benched': False}
                )
            # Set all final bench to is_benched=True
            for p in bench:
                await tx.userteam.update(
                    where={'id': p['db_id']},
                    data={'is_benched': True}
                )
        
        updates_made += 1

    logger.info(f"Autosub complete. Teams updated: {updates_made}")
    return updates_made