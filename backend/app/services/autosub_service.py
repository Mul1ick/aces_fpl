import logging
from typing import List, Dict, Set
from prisma import Prisma
from app.repositories.player_repo import count_players_in_team
from collections import Counter

logger = logging.getLogger("aces.autosub")

# --- 1. HELPER: DETERMINE IF PLAYER PLAYED ---
def did_player_play(stats: Dict) -> bool:
    """
    Determines if a player participated based strictly on the 'played' boolean flag.
    If played is False, they are considered to have NOT played (0 minutes), 
    and are eligible for autosub and losing their Captaincy.
    """
    if not stats:
        return False
    
    return stats.get('played', False) is True

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
    all_stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id}
    )
    stats_map = {s.player_id: s.model_dump() for s in all_stats}

    # 2. Fetch All User Teams for this GW
    user_teams = await db.userteam.find_many(
        where={'gameweek_id': gameweek_id},
        include={'player': True},
        order={'id': 'asc'} 
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
        roster = []
        for entry in squad:
            roster.append({
                'db_id': entry.id,
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
            continue

        # LOGIC A: GOALKEEPER SWAP
        gk_idx = next((i for i, idx in enumerate(inactive_starter_indices) if starters[idx]['position'] == 'GK'), None)
        
        if gk_idx is not None:
            starter_idx = inactive_starter_indices[gk_idx]
            bench_gk_idx = next((i for i, p in enumerate(bench) if p['position'] == 'GK'), None)
            
            if bench_gk_idx is not None:
                bench_gk_stats = stats_map.get(bench[bench_gk_idx]['player_id'])
                if did_player_play(bench_gk_stats):
                    logger.info(f"User {user_id}: Subbing GK {starters[starter_idx]['player_id']} OUT, {bench[bench_gk_idx]['player_id']} IN")
                    starters[starter_idx], bench[bench_gk_idx] = bench[bench_gk_idx], starters[starter_idx]
                    inactive_starter_indices.pop(gk_idx) 

        # LOGIC B: OUTFIELD SWAPS
        current_inactive_starters = [
            p for p in starters 
            if not did_player_play(stats_map.get(p['player_id'])) 
            and p['position'] != 'GK' 
        ]

        active_bench_outfield = [
            p for p in bench 
            if p['position'] != 'GK' 
            and did_player_play(stats_map.get(p['player_id']))
        ]
        
        # <--- WARNING 7 FIXED: Enforcing Bench Priority Sort
        # Keep GKs separated (already handled), but ensure we process outfield subs 
        # in the exact order the user designated (1, 2, 3). If priority is missing, they drop to the end.
        active_bench_outfield.sort(key=lambda x: x.get('bench_priority') if x.get('bench_priority') is not None else 999)
        # ------------------------------------------------------------------------------------------
        
        for bench_player in active_bench_outfield:
            if not current_inactive_starters:
                break 

            swap_successful = False
            for starter_to_remove in current_inactive_starters:
                hypothetical_starters = [s for s in starters if s != starter_to_remove] + [bench_player]
                
                if is_valid_formation(hypothetical_starters):
                    log_msg = f"User {user_id}: Autosub {starter_to_remove['player_id']} OUT"
                    if starter_to_remove.get('is_captain'):
                        log_msg += " (Captain)"
                    log_msg += f", {bench_player['player_id']} IN"
                    
                    logger.info(log_msg)
                    
                    starters.remove(starter_to_remove)
                    starters.append(bench_player)
                    bench.remove(bench_player)
                    bench.append(starter_to_remove)
                    
                    current_inactive_starters.remove(starter_to_remove)
                    swap_successful = True
                    break 
            
            if not swap_successful:
                logger.debug(f"User {user_id}: Could not sub in {bench_player['player_id']} - formation constraint.")

        # 4. COMMIT UPDATES TO DB
        async with db.tx() as tx:
            for p in starters:
                await tx.userteam.update(
                    where={'id': p['db_id']},
                    data={'is_benched': False}
                )
            for p in bench:
                await tx.userteam.update(
                    where={'id': p['db_id']},
                    data={'is_benched': True}
                )
        
        updates_made += 1

    logger.info(f"Autosub complete. Teams updated: {updates_made}")
    return updates_made