# app/utils/stats_utils.py
from typing import Any, Tuple, Dict, List

def calculate_breakdown(position: str, st: Any) -> Tuple[Dict, List[Dict]]:
    """
    Central logic for calculating fantasy points breakdown.
    Can be used by Team View, Dream Team, Admin Panel, etc.
    """
    # Handle missing stats gracefully
    if not st:
        return {}, []

    # 1. Extract Raw Stats
    # Supports both object access (st.played) and dict access (st['played']) just in case
    def get(key, default=0):
        return getattr(st, key, default) or default

    raw = {
        #"played": bool(get("played", False)),
        "goals_scored": int(get("goals_scored")),
        "assists": int(get("assists")),
        "yellow_cards": int(get("yellow_cards")),
        "red_cards": int(get("red_cards")),
        "bonus_points": int(get("bonus_points")),
        "clean_sheets": int(get("clean_sheets")),
        "penalties_missed": int(get("penalties_missed")),
        "own_goals": int(get("own_goals")),
        "goals_conceded": int(get("goals_conceded")),
    }

    # 2. Determine Point Values based on Position
    pos = (position or "").upper()
    
    # Goal Points
    if pos in ["GK", "GKP"]: goal_pts = 10
    elif pos == "DEF": goal_pts = 6
    elif pos == "MID": goal_pts = 5
    else: goal_pts = 4

    # Clean Sheet Points
    if pos in ["GK", "GKP", "DEF"]: cs_pts = 4
    elif pos == "MID": cs_pts = 1
    else: cs_pts = 0

    gc_pts = 0
    if pos in ["GK", "GKP", "DEF"]:
        gc_pts = -1 * (raw["goals_conceded"] // 2)

    # 3. Build the Breakdown List (for the Popup)
    breakdown = [
        #{"label": "Appearance",   "value": 1 if raw["played"] else 0, "points": 1 if raw["played"] else 0},
        {"label": "Goals",        "value": raw["goals_scored"],       "points": raw["goals_scored"] * goal_pts},
        {"label": "Assists",      "value": raw["assists"],            "points": raw["assists"] * 3},
        {"label": "Clean Sheet",  "value": raw["clean_sheets"],       "points": raw["clean_sheets"] * cs_pts},
        {"label": "Goals Conceded", "value": raw["goals_conceded"],   "points": gc_pts},
        {"label": "Yellow cards", "value": raw["yellow_cards"],       "points": -1 * raw["yellow_cards"]},
        {"label": "Red cards",    "value": raw["red_cards"],          "points": -3 * raw["red_cards"]},
        {"label": "Penalty Miss", "value": raw["penalties_missed"],   "points": -2 * raw["penalties_missed"]},
        {"label": "Own Goal",     "value": raw["own_goals"],          "points": -2 * raw["own_goals"]},
        {"label": "Bonus",        "value": raw["bonus_points"],       "points": raw["bonus_points"]},
    ]
    
    return raw, breakdown