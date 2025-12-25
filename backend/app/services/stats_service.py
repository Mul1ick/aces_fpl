import logging
from typing import Dict, List, Optional, Any
from collections import Counter
from fastapi import HTTPException
from prisma import Prisma
from app import schemas
from app.repositories.gameweek_repo import get_current_gameweek
from app.services.team_service import carry_forward_team
from app.services.chip_service import is_triple_captain_active

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
    points_map = {stat.player_id: stat.points for stat in player_stats}

    def to_display(entry):
        player_points = points_map.get(entry.player.id, 0)
        
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
            "points": player_points
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

