from app import schemas

def calculate_player_points(position: str, stats: schemas.PlayerStatIn) -> int:
    points = 0
    #if stats.played: points += 1
    if stats.goals_scored > 0:
        if position == "GK": points += stats.goals_scored * 10
        elif position == "DEF": points += stats.goals_scored * 6
        elif position == "MID": points += stats.goals_scored * 5
        elif position == "FWD": points += stats.goals_scored * 4
    points += stats.assists * 3
    points += stats.bonus_points
    if stats.clean_sheets:
        if position in ["GK", "DEF"]: points += 4
        elif position == "MID": points += 1
    if position in ["GK", "DEF"]:
        points -= (stats.goals_conceded // 2)
    points += stats.penalties_saved * 5  # Standard FPL is +5 for pen save
    points -= stats.penalties_missed * 2
    points -= stats.own_goals * 2
    points -= stats.yellow_cards * 1
    points -= stats.red_cards * 3
    return points