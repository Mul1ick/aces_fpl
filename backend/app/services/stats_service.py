import logging
from typing import Dict, List, Optional, Any
from collections import Counter
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
from app.repositories.gameweek_repo import get_current_gameweek
from app.services.team_service import carry_forward_team
from app.services.chip_service import is_triple_captain_active
from app.utils.stats_utils import calculate_breakdown
from app.repositories.team_repo import get_team_by_id
from app.repositories.player_repo import get_players_by_ids

import logging

logger = logging.getLogger("aces.chips")


async def get_dashboard_stats(db: Prisma):
    pending_users_count = await db.user.count(where={'is_active': False})
    total_users_count = await db.user.count(where={'role': 'user'})
    total_players_count = await db.player.count()
    current_gw = await get_current_gameweek(db)
    
    recent_activities = [] # Placeholder for now

    return schemas.DashboardStats(
        pending_users=pending_users_count,
        total_users=total_users_count,
        total_players=total_players_count,
        current_gameweek=current_gw,
        recent_activities=recent_activities
    )


async def get_leaderboard(db: Prisma):
    users = await db.user.find_many(
        where={'is_active': True, 'role': 'user', 'fantasy_team': {'is_not': None}},
        include={'fantasy_team': True},
    )
    if not users:
        return []

    scores_data = await db.usergameweekscore.group_by(
        by=['user_id'],
        sum={'total_points': True, 'transfer_hits': True},  # prisma-py expects `sum=...`
    )

    score_map: dict[str, int] = {}
    for item in scores_data:
        agg = item.get('_sum') or item.get('sum') or {}     # handle either result shape
        total = int(agg.get('total_points') or 0)
        hits  = int(agg.get('transfer_hits') or 0)
        score_map[str(item['user_id'])] = total - hits

    rows = [{
        "rank": 0,
        "team_name": u.fantasy_team.name,
        "manager_email": u.email,
        "user_id": str(u.id),
        "total_points": int(score_map.get(str(u.id), 0)),
    } for u in users]

    rows.sort(key=lambda r: r['total_points'], reverse=True)
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    return rows


async def get_transfer_stats(db: Prisma, gameweek_id: int):
    # 1) Pull logs for this GW
    logs = await db.transfer_log.find_many(
        where={'gameweek_id': gameweek_id}
    )

    # 2) Count in/out
    in_counts = Counter([l.in_player for l in logs if l.in_player is not None])
    out_counts = Counter([l.out_player for l in logs if l.out_player is not None])

    top_in = in_counts.most_common(5)
    top_out = out_counts.most_common(5)

    # 3) Fetch player + team details for all involved player_ids
    player_ids = list({pid for pid, _ in top_in} | {pid for pid, _ in top_out})
    players = await db.player.find_many(
        where={'id': {'in': player_ids}},
        include={'team': True}
    )
    pmap: Dict[int, any] = {p.id: p for p in players}

    def to_rows(pairs: List[tuple[int, int]]):
        rows = []
        for pid, cnt in pairs:
            p = pmap.get(pid)
            if not p:
                rows.append({'player_id': pid, 'count': cnt})
                continue
            rows.append({
                'player_id': pid,
                'count': cnt,
                'full_name': p.full_name,
                'position': p.position,
                'team': {
                    'id': p.team.id,
                    'name': p.team.name,
                    'short_name': p.team.short_name,
                } if p.team else None
            })
        return rows

    return {
        'most_in': to_rows(top_in),
        'most_out': to_rows(top_out),
    }


async def compute_user_score_for_gw(db: Prisma, user_id: str, gameweek_id: int) -> int:
    await carry_forward_team(db, user_id, gameweek_id)
    # Fetch team for the GW
    entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id}
    )

    # If no entries, store 0 and return 0 minus any hits (usually 0)
    if not entries:
        gross = 0
        await db.usergameweekscore.upsert(
            where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
            data={
                'create': {'user_id': user_id, 'gameweek_id': gameweek_id, 'total_points': gross},
                'update': {'total_points': gross},
            },
        )
        ugws = await db.usergameweekscore.find_unique(
            where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}}
        )
        hits = getattr(ugws, 'transfer_hits', 0) if ugws else 0
        return gross - hits

    # Build points map for the GW
    stats = await db.gameweekplayerstats.find_many(where={'gameweek_id': gameweek_id})
    pts = {s.player_id: s.points for s in stats}  # missing => 0
    played_map = {s.player_id: getattr(s, 'played', False) for s in stats}


    starters = [e for e in entries if not e.is_benched]
    cap = next((e for e in starters if e.is_captain), None)
    vice = next((e for e in starters if e.is_vice_captain), None)

    base = sum(pts.get(e.player_id, 0) for e in starters)

    triple = await is_triple_captain_active(db, user_id, gameweek_id)

    # Choose multiplier target: captain if played else vice if played
    bonus_target = None
    if cap and played_map.get(cap.player_id, False):
        bonus_target = cap.player_id
    # 2. Else try Vice: Takes armband if Cap didn't play (even if Vice didn't play either)
    elif vice:
        bonus_target = vice.player_id

    if bonus_target is not None:
        bonus_points = pts.get(bonus_target, 0)
        if triple:
            # base already counts 1x; add +2x to make triple
            gross = base + 2 * pts[bonus_target]
        else:
            # base already counts 1x; add +1x to make double
            gross = base + pts[bonus_target]
    else:
        gross = base

    # Persist gross points
    ugws = await db.usergameweekscore.upsert(
        where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}},
        data={
            'create': {'user_id': user_id, 'gameweek_id': gameweek_id, 'total_points': gross},
            'update': {'total_points': gross},
        },
    )

    # Subtract transfer hits
    hits = getattr(ugws, 'transfer_hits', 0) if ugws else 0
    net = gross - hits
    return net

async def get_manager_hub_stats(db: Prisma, user_id: str, gameweek_id: int):
    """
    Calculates the stats needed for the Manager Hub card on the dashboard.
    """
    # 1. Calculate Overall Points (sum of all gameweek scores for the user)
    overall_scores = await db.usergameweekscore.group_by(
        by=['user_id'],
        where={'user_id': user_id},
        sum={'total_points': True}
    )
    overall_points = overall_scores[0]['_sum']['total_points'] if overall_scores else 0

    # 2. Get Gameweek Points for the current week
    gameweek_score = await db.usergameweekscore.find_unique(
        where={'user_id_gameweek_id': {'user_id': user_id, 'gameweek_id': gameweek_id}}
    )
    gameweek_points = gameweek_score.total_points if gameweek_score else 0

    # 3. Get Total Players (count of all active users)
    total_players = await db.user.count(where={'is_active': True, 'role': 'user'})


    # --- 4. Calculate Squad Value ---
    # Get all players in the user's current squad
    user_squad_entries = await db.userteam.find_many(
        where={'user_id': user_id, 'gameweek_id': gameweek_id},
        include={'player': True} # Include the full player object to get the price
    )

    # Sum the prices of all players in the squad
    squad_value = sum(p.player.price for p in user_squad_entries) if user_squad_entries else 0.0

    # --- NEW: Calculate In The Bank ---
    total_budget = 100.0
    in_the_bank = total_budget - float(squad_value)

    gameweek_transfers_count = await db.transfer_log.count(
        where={
            "user_id": user_id,
            "gameweek_id": gameweek_id
        }
    )
    
    total_transfers_count = await db.transfer_log.count(
        where={"user_id": user_id}
    )


    return {
        "overall_points": overall_points or 0,
        "gameweek_points": gameweek_points,
        "total_players": total_players,
        "squad_value" : float(squad_value),
        "in_the_bank":in_the_bank,
        "gameweek_transfers": gameweek_transfers_count,
        "total_transfers": total_transfers_count,
    }


async def get_team_of_the_week(db: Prisma, gameweek_number: Optional[int] = None):
    """
    Finds the highest-scoring team for a specific gameweek, or the last completed one if not specified.
    """
    target_gw = None
    if gameweek_number:
        target_gw = await db.gameweek.find_unique(where={'gw_number': gameweek_number})
    else:
        # 1. CHANGE: Logic for finding the gameweek was updated.
        # ---------------------------------------------------------------------
        # Instead of just finding the latest gameweek whose deadline has passed,
        # this now finds the latest gameweek that has an official 'FINISHED' status.
        # This is more reliable because it ensures the Team of the Week is only
        # shown after you, the admin, have finalized all scores and bonus points.
        target_gw = await db.gameweek.find_first(
            where={'status': 'FINISHED'},
            order={'gw_number': 'desc'}
        )

    if not target_gw:
        return None

    # Find the highest score in that gameweek
    top_score = await db.usergameweekscore.find_first(
        where={'gameweek_id': target_gw.id},
        order={'total_points': 'desc'}
    )
    if not top_score:
        return None

    top_user_id = top_score.user_id

    # Fetch the manager's details
    manager = await db.user.find_unique(
        where={'id': top_user_id},
        include={'fantasy_team': True}
    )
    manager_name = manager.full_name if manager and manager.full_name else "Top Manager"
    team_name = manager.fantasy_team.name if manager and manager.fantasy_team else "Team of the Week"

    # Fetch the full team roster
    user_team_entries = await db.userteam.find_many(
        where={'user_id': top_user_id, 'gameweek_id': target_gw.id},
        include={'player': {'include': {'team': True}}}
    )
    
    player_ids = [entry.player.id for entry in user_team_entries]
    player_stats = await db.gameweekplayerstats.find_many(
        where={
            'gameweek_id': target_gw.id,
            'player_id': {'in': player_ids}
        }
    )
    points_map = {stat.player_id: stat for stat in player_stats}

    def to_display(entry):
        player_points = points_map.get(entry.player.id)
        final_points = player_points.points if player_points else 0

        raw_stats, breakdown_list = calculate_breakdown(entry.player.position, player_points)
        
        return {
            "id": entry.player.id, "full_name": entry.player.full_name,
            "position": entry.player.position,
            
            # 2. CHANGE: Fixed a bug with the player price.
            # ---------------------------------------------------------------------
            # The database stores 'price' as a special Decimal type.
            # We must convert it to a float() so the API can send it as a
            # standard number that the frontend can understand.
            "price": float(entry.player.price),
            
            "is_captain": entry.is_captain, "is_vice_captain": entry.is_vice_captain,
            "is_benched": entry.is_benched, "team": entry.player.team,
            "points": final_points,
            "stats": raw_stats,
            "breakdown": breakdown_list
        }

    all_players = [to_display(p) for p in user_team_entries]
    
    return {
        "manager_name": manager_name,
        "team_name": team_name,
        "points": top_score.total_points,
        "starting": [p for p in all_players if not p["is_benched"]],
        "bench": [p for p in all_players if p["is_benched"]]
    }


async def get_gameweek_stats_for_user(db: Prisma, user_id: str, gameweek_id: int):
    """
    Calculates the user's points, the average points, and the highest points
    for a specific gameweek.
    """
    # 1. Get all scores for the specified gameweek
    all_scores = await db.usergameweekscore.find_many(
        where={'gameweek_id': gameweek_id}
    )

    if not all_scores:
        # If no scores are in yet, return all zeros
        return {"user_points": 0, "average_points": 0, "highest_points": 0}

    # 2. Find the current user's score
    user_score_entry = next((s for s in all_scores if s.user_id == user_id), None)
    user_points = user_score_entry.total_points if user_score_entry else 0
    
    # 3. Calculate average and highest scores
    total_points_sum = sum(s.total_points for s in all_scores)
    average_points = round(total_points_sum / len(all_scores))
    highest_points = max(s.total_points for s in all_scores)

    return {
        "user_points": user_points,
        "average_points": average_points,
        "highest_points": highest_points,
    }

async def calculate_dream_team(db: Prisma, gameweek_id: int):
    """
    Calculates the 'Dream Team' for a specific gameweek based on the
    11-man squad limit: 2 GK, 3 DEF, 3 MID, 3 FWD.
    From that 11, it picks the optimal starting 8.
    """
    
    # 1. Fetch all stats for this GW with Player and Team info
    stats = await db.gameweekplayerstats.find_many(
        where={'gameweek_id': gameweek_id},
        include={'player': {'include': {'team': True}}},
        order={'points': 'desc'} # Primary sort by points
    )

    if not stats:
        return None

    # 2. Bucket by Position
    # We sort by points DESC. Secondary sort usually price or ID, 
    # but strictly points is fine for Dream Team.
    gks = [s for s in stats if s.player.position == 'GK']
    defs = [s for s in stats if s.player.position == 'DEF']
    mids = [s for s in stats if s.player.position == 'MID']
    fwds = [s for s in stats if s.player.position == 'FWD']

    # 3. Select the "Squad of 11" (The Pool)
    # 2 GK, 3 DEF, 3 MID, 3 FWD
    pool_gk = gks[:2]
    pool_def = defs[:3]
    pool_mid = mids[:3]
    pool_fwd = fwds[:3]

    # If we don't have enough players in a position to fill a dream team, 
    # we return what we have (early season edge case)
    if len(pool_gk) < 1 or len(pool_def) < 2 or len(pool_mid) < 1 or len(pool_fwd) < 1:
        # Fallback or simple error handling
        return None

    # 4. The "Starting 8" Optimization (Lock & Fill)
    starters = []
    
    # A. Lock Essentials (5 Spots)
    # We take the absolute best from each mandatory slot
    starters.append(pool_gk[0])  # 1st Best GK
    starters.append(pool_def[0]) # 1st Best DEF
    starters.append(pool_def[1]) # 2nd Best DEF
    starters.append(pool_mid[0]) # 1st Best MID
    starters.append(pool_fwd[0]) # 1st Best FWD

    # B. Define the Remaining Pool for Flex (6 Candidates)
    # The 2nd GK is usually NOT eligible for Flex in football logic (only 1 GK on pitch).
    # So the 2nd GK goes straight to bench.
    bench_gk = pool_gk[1] if len(pool_gk) > 1 else None
    
    flex_candidates = []
    if len(pool_def) > 2: flex_candidates.append(pool_def[2])
    if len(pool_mid) > 1: flex_candidates.extend(pool_mid[1:])
    if len(pool_fwd) > 1: flex_candidates.extend(pool_fwd[1:])

    # C. Fill Flex Spots (Top 3 from candidates)
    # Sort candidates by points descending
    flex_candidates.sort(key=lambda x: x.points, reverse=True)
    
    # Take top 3
    flex_picks = flex_candidates[:3]
    starters.extend(flex_picks)

    # D. Assign Bench
    # The bench is the 2nd GK + the rejects from flex candidates
    bench_outfield = flex_candidates[3:]
    bench = []
    if bench_gk: bench.append(bench_gk)
    bench.extend(bench_outfield)

    # 5. Format for Response (Reusing PlayerDisplay logic roughly)
    def map_to_view(stat_entry, is_starter):
        # We need to simulate Captaincy for visual flair (Highest scorer gets C)
        return {
            "id": stat_entry.player.id,
            "full_name": stat_entry.player.full_name,
            "position": stat_entry.player.position,
            "team": stat_entry.player.team, # Full team object
            "price": float(stat_entry.player.price),
            "points": stat_entry.points,
            "is_captain": False,      # Will calculate below
            "is_vice_captain": False, # Will calculate below
            "is_benched": not is_starter,
            "raw_stats": {
                "goals_scored": stat_entry.goals_scored,
                "assists": stat_entry.assists,
                "clean_sheets": stat_entry.clean_sheets,
                "bonus_points": stat_entry.bonus_points,
                "played": stat_entry.played
            }
        }

    formatted_starters = [map_to_view(s, True) for s in starters]
    formatted_bench = [map_to_view(b, False) for b in bench]

    # Assign Captain (Top scorer in starters)
    formatted_starters.sort(key=lambda x: x['points'], reverse=True)
    if formatted_starters:
        formatted_starters[0]['is_captain'] = True
        if len(formatted_starters) > 1:
            formatted_starters[1]['is_vice_captain'] = True

    total_points = sum(p['points'] for p in formatted_starters)

    return {
        "manager_name": "Aces AI",
        "team_name": "Dream Team",
        "points": total_points,
        "starting": formatted_starters,
        "bench": formatted_bench
    }

async def calculate_team_of_the_season(db: Prisma):
    """
    Calculates the Team of the Season based on total points accumulated
    from GW1 to present, using the Aces Squad (11) & Starting 8 rules.
    """
    # 1. Aggregate total points for all players
    # UPDATED: Removed the 'having' clause that filtered out 0-point players
    agg_stats = await db.gameweekplayerstats.group_by(
        by=['player_id'],
        sum={'points': True},
        # having={'points': {'_sum': {'gt': 0}}}, <--- REMOVED THIS LINE
        order={'_sum': {'points': 'desc'}}
    )

    if not agg_stats:
        return None

    # 2. Fetch Player Details
    player_ids = [item['player_id'] for item in agg_stats]
    players_data = await db.player.find_many(
        where={'id': {'in': player_ids}},
        include={'team': True}
    )
    
    # Create a rich object with points attached
    rich_players = []
    player_map = {p.id: p for p in players_data}
    
    for item in agg_stats:
        pid = item['player_id']
        total_pts = item['_sum']['points'] or 0 # Ensure 0 if None
        if pid in player_map:
            p = player_map[pid]
            rich_players.append({
                "id": p.id,
                "full_name": p.full_name,
                "position": p.position,
                "team": p.team,
                "price": float(p.price),
                "points": total_pts,
                "raw_stats": {"played": True} 
            })

    # 3. Bucket by Position (Sorted by Total Points DESC)
    gks = [p for p in rich_players if p['position'] == 'GK']
    defs = [p for p in rich_players if p['position'] == 'DEF']
    mids = [p for p in rich_players if p['position'] == 'MID']
    fwds = [p for p in rich_players if p['position'] == 'FWD']

    # 4. Select the "Squad of 11" (The Pool)
    pool_gk = gks[:2]
    pool_def = defs[:3]
    pool_mid = mids[:3]
    pool_fwd = fwds[:3]

    # Check validity (Must have enough players in DB/Stats table to form a squad)
    if len(pool_gk) < 1 or len(pool_def) < 2 or len(pool_mid) < 1 or len(pool_fwd) < 1:
        return None 

    # 5. The "Starting 8" Optimization (Lock & Fill)
    starters = []
    
    # Lock Essentials
    starters.append(pool_gk[0])
    starters.append(pool_def[0])
    starters.append(pool_def[1])
    starters.append(pool_mid[0])
    starters.append(pool_fwd[0])

    # Flex Pool
    bench_gk = pool_gk[1] if len(pool_gk) > 1 else None
    flex_candidates = []
    if len(pool_def) > 2: flex_candidates.append(pool_def[2])
    if len(pool_mid) > 1: flex_candidates.extend(pool_mid[1:])
    if len(pool_fwd) > 1: flex_candidates.extend(pool_fwd[1:])

    # Sort Flex by points
    flex_candidates.sort(key=lambda x: x['points'], reverse=True)
    
    # Pick Top 3 Flex
    starters.extend(flex_candidates[:3])

    # Bench (Remaining)
    bench_outfield = flex_candidates[3:]
    bench = []
    if bench_gk: bench.append(bench_gk)
    bench.extend(bench_outfield)

    # 6. Assign Captaincy (Top scorer)
    starters.sort(key=lambda x: x['points'], reverse=True)
    starters = [{**p, "is_captain": i==0, "is_vice_captain": i==1, "is_benched": False} for i, p in enumerate(starters)]
    bench = [{**p, "is_captain": False, "is_vice_captain": False, "is_benched": True} for p in bench]

    total_season_points = sum(p['points'] for p in starters)

    return {
        "manager_name": "Aces AI",
        "team_name": "Team of the Season",
        "points": total_season_points,
        "starting": starters,
        "bench": bench
    }
