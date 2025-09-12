import asyncio
from datetime import datetime, timedelta
import random
import sys
import os

# Add the project root (`backend`) to the Python path to allow for `app` module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prisma import Prisma
from app.auth import hash_password


# --- Configuration ---
# All gameweek deadlines will be calculated relative to this date.
# We'll set it to the next upcoming Saturday at 11:00 AM local time.
def get_next_saturday():
    now = datetime.now()
    days_ahead = (5 - now.weekday() + 7) % 7  # 5 is Saturday
    next_saturday = now + timedelta(days=days_ahead)
    return next_saturday.replace(hour=11, minute=0, second=0, microsecond=0)

SEASON_START_DATE = get_next_saturday()

# --- Seed Data ---

TEAMS = [
    {"name": "Satan", "short_name": "SAT"},
    {"name": "Bandra United", "short_name": "BAN"},
    {"name": "Mumbai Hotspurs", "short_name": "MHS"},
    {"name": "Southside", "short_name": "SOU"},
    {"name": "Titans", "short_name": "TIT"},
    {"name": "Umaag Foundation Trust", "short_name": "UMA"},
]

# Real players assigned to the fictional teams
PLAYERS = {
    "SAT": [ # Manchester United
        {"full_name": "André Onana", "position": "GK", "price": 5.0},
        {"full_name": "Altay Bayındır", "position": "GK", "price": 4.0},
        {"full_name": "Diogo Dalot", "position": "DEF", "price": 5.0},
        {"full_name": "Raphaël Varane", "position": "DEF", "price": 5.5},
        {"full_name": "Lisandro Martínez", "position": "DEF", "price": 5.0},
        {"full_name": "Casemiro", "position": "MID", "price": 5.5},
        {"full_name": "Bruno Fernandes", "position": "MID", "price": 10.0},
        {"full_name": "Mason Mount", "position": "MID", "price": 7.0},
        {"full_name": "Marcus Rashford", "position": "FWD", "price": 8.5},
        {"full_name": "Rasmus Højlund", "position": "FWD", "price": 7.5},
        {"full_name": "Alejandro Garnacho", "position": "FWD", "price": 5.0},
    ],
    "BAN": [ # Manchester City
        {"full_name": "Ederson Moraes", "position": "GK", "price": 5.5},
        {"full_name": "Stefan Ortega", "position": "GK", "price": 4.0},
        {"full_name": "Kyle Walker", "position": "DEF", "price": 5.5},
        {"full_name": "Rúben Dias", "position": "DEF", "price": 6.0},
        {"full_name": "Nathan Aké", "position": "DEF", "price": 5.0},
        {"full_name": "Rodri", "position": "MID", "price": 6.0},
        {"full_name": "Kevin De Bruyne", "position": "MID", "price": 12.5},
        {"full_name": "Phil Foden", "position": "MID", "price": 8.0},
        {"full_name": "Bernardo Silva", "position": "MID", "price": 6.5},
        {"full_name": "Erling Haaland", "position": "FWD", "price": 14.0},
        {"full_name": "Julián Álvarez", "position": "FWD", "price": 6.5},
    ],
    "MHS": [ # Tottenham Hotspur
        {"full_name": "Guglielmo Vicario", "position": "GK", "price": 5.0},
        {"full_name": "Fraser Forster", "position": "GK", "price": 4.0},
        {"full_name": "Pedro Porro", "position": "DEF", "price": 5.5},
        {"full_name": "Cristian Romero", "position": "DEF", "price": 5.0},
        {"full_name": "Micky van de Ven", "position": "DEF", "price": 4.5},
        {"full_name": "James Maddison", "position": "MID", "price": 8.0},
        {"full_name": "Son Heung-min", "position": "MID", "price": 10.0},
        {"full_name": "Dejan Kulusevski", "position": "MID", "price": 7.0},
        {"full_name": "Yves Bissouma", "position": "MID", "price": 5.0},
        {"full_name": "Richarlison", "position": "FWD", "price": 7.0},
        {"full_name": "Brennan Johnson", "position": "FWD", "price": 6.0},
    ],
    "SOU": [ # Arsenal
        {"full_name": "David Raya", "position": "GK", "price": 5.0},
        {"full_name": "Aaron Ramsdale", "position": "GK", "price": 4.5},
        {"full_name": "Ben White", "position": "DEF", "price": 5.5},
        {"full_name": "William Saliba", "position": "DEF", "price": 5.5},
        {"full_name": "Gabriel Magalhães", "position": "DEF", "price": 5.0},
        {"full_name": "Declan Rice", "position": "MID", "price": 5.5},
        {"full_name": "Martin Ødegaard", "position": "MID", "price": 8.5},
        {"full_name": "Bukayo Saka", "position": "MID", "price": 9.0},
        {"full_name": "Gabriel Martinelli", "position": "MID", "price": 8.0},
        {"full_name": "Kai Havertz", "position": "FWD", "price": 7.5},
        {"full_name": "Gabriel Jesus", "position": "FWD", "price": 8.0},
    ],
    "TIT": [ # Liverpool
        {"full_name": "Alisson Becker", "position": "GK", "price": 5.5},
        {"full_name": "Caoimhín Kelleher", "position": "GK", "price": 4.0},
        {"full_name": "Trent Alexander-Arnold", "position": "DEF", "price": 8.0},
        {"full_name": "Virgil van Dijk", "position": "DEF", "price": 6.0},
        {"full_name": "Ibrahima Konaté", "position": "DEF", "price": 5.0},
        {"full_name": "Alexis Mac Allister", "position": "MID", "price": 6.0},
        {"full_name": "Dominik Szoboszlai", "position": "MID", "price": 7.0},
        {"full_name": "Mohamed Salah", "position": "FWD", "price": 13.0},
        {"full_name": "Luis Díaz", "position": "FWD", "price": 7.5},
        {"full_name": "Darwin Núñez", "position": "FWD", "price": 7.5},
        {"full_name": "Diogo Jota", "position": "FWD", "price": 8.0},
    ],
    "UMA": [ # Chelsea
        {"full_name": "Robert Sánchez", "position": "GK", "price": 4.5},
        {"full_name": "Đorđe Petrović", "position": "GK", "price": 4.0},
        {"full_name": "Reece James", "position": "DEF", "price": 5.5},
        {"full_name": "Wesley Fofana", "position": "DEF", "price": 4.5},
        {"full_name": "Levi Colwill", "position": "DEF", "price": 4.5},
        {"full_name": "Enzo Fernández", "position": "MID", "price": 5.0},
        {"full_name": "Moisés Caicedo", "position": "MID", "price": 5.0},
        {"full_name": "Raheem Sterling", "position": "FWD", "price": 7.0},
        {"full_name": "Cole Palmer", "position": "FWD", "price": 6.0},
        {"full_name": "Christopher Nkunku", "position": "FWD", "price": 7.5},
        {"full_name": "Nicolas Jackson", "position": "FWD", "price": 7.0},
    ],
}

def generate_round_robin_fixtures(team_ids):
    """Generates a double round-robin schedule."""
    if len(team_ids) % 2 != 0:
        team_ids.append(None)  # Add a dummy team for even scheduling

    n = len(team_ids)
    schedule = []
    for _ in range(n - 1):
        mid = n // 2
        l1 = team_ids[:mid]
        l2 = team_ids[mid:]
        l2.reverse()

        round_fixtures = []
        for i in range(mid):
            if l1[i] is not None and l2[i] is not None:
                round_fixtures.append((l1[i], l2[i]))
        schedule.append(round_fixtures)

        # Rotate teams
        team_ids.insert(1, team_ids.pop())

    # Create home and away fixtures
    full_schedule = []
    for round_fixtures in schedule:
        full_schedule.append(round_fixtures)
    for round_fixtures in schedule:
        full_schedule.append([(away, home) for home, away in round_fixtures])
        
    return full_schedule


async def clear_data(db: Prisma):
    """Wipes all data from the database to ensure a clean slate."""
    print("🧹 Wiping existing data...")
    # The order is important to respect foreign key constraints
    await db.userchip.delete_many()
    await db.transfer_log.delete_many()
    await db.usergameweekscore.delete_many()
    await db.gameweekplayerstats.delete_many()
    await db.userteam.delete_many()
    await db.fixture.delete_many()
    await db.gameweek.delete_many()
    await db.player.delete_many()
    await db.team.delete_many()
<<<<<<< HEAD
    print("✅ Cleanup complete.")

    # --- NEW: Seed Admin User ---
    print("\n🔑 Seeding Admin User...")
    hashed_password = pwd_context.hash(ADMIN_PASSWORD)
    await db.user.upsert(
        where={'email': ADMIN_EMAIL},
        data={
            'create': {
                'email': ADMIN_EMAIL,
                'hashed_password': hashed_password,
                'role': 'admin',
                'is_active': True,
                'full_name': 'Admin User'
            },
            'update': {
                'hashed_password': hashed_password,
                'role': 'admin',
                'is_active': True
            }
        }
    )
    print(f"✅ Admin user '{ADMIN_EMAIL}' created/updated.")


    # --- 1. Seed Teams ---
    print("\n🌱 Seeding Teams...")
    await db.team.create_many(data=TEAMS_DATA)
    teams = await db.team.find_many()
    print(f"✅ Created {len(teams)} teams.")

    # --- 2. Seed Players ---
    print("\n🌱 Seeding Players...")
    
    for position in REAL_PLAYERS:
        random.shuffle(REAL_PLAYERS[position])

    players_to_create = []
    for team in teams:
        for position in POSITIONS:
            for _ in range(PLAYERS_PER_TEAM_PER_POSITION):
                if not REAL_PLAYERS[position]:
                    player_name = f"Placeholder {position} {random.randint(1, 100)}"
                else:
                    player_name = REAL_PLAYERS[position].pop()

                price = {
                    "GK": Decimal(random.uniform(4.0, 5.5)),
                    "DEF": Decimal(random.uniform(4.5, 7.5)),
                    "MID": Decimal(random.uniform(5.0, 13.0)),
                    "FWD": Decimal(random.uniform(6.0, 14.0)),
                }.get(position, Decimal(5.0))

                players_to_create.append({
                    'full_name': player_name,
                    'position': position,
                    'price': price,
                    'team_id': team.id,
                })
    
    await db.player.create_many(data=players_to_create)
    all_players = await db.player.find_many()
    print(f"✅ Created {len(all_players)} players.")

    # --- 3. Seed Gameweeks ---
    print("\n🌱 Seeding Gameweeks...")
    gameweeks_to_create = []
    start_deadline = datetime.now(timezone.utc).replace(hour=15, minute=30, second=0, microsecond=0) + timedelta(days=5)
    for i in range(1, TOTAL_GAMEWEEKS + 1):
        gameweeks_to_create.append({
            'gw_number': i,
            'deadline': start_deadline + timedelta(weeks=i-1)
        })
    
    await db.gameweek.create_many(data=gameweeks_to_create)
    gameweeks = await db.gameweek.find_many(order={'gw_number': 'asc'})
    print(f"✅ Created {len(gameweeks)} gameweeks.")

    # --- 4. Seed Fixtures ---
    print("\n🌱 Seeding Fixtures...")
    fixtures_to_create = []
    team_ids = [team.id for team in teams]

    for gw in gameweeks:
        random.shuffle(team_ids)
        for i in range(0, len(team_ids), 2):
            if i + 1 < len(team_ids):
                fixtures_to_create.append({
                    'gameweek_id': gw.id,
                    'home_team_id': team_ids[i],
                    'away_team_id': team_ids[i+1],
                    'kickoff': gw.deadline - timedelta(days=1, hours=random.randint(3, 20))
                })

    await db.fixture.create_many(data=fixtures_to_create)
    fixture_count = await db.fixture.count()
    print(f"✅ Created {fixture_count} fixtures.")

    # --- 5. Seed Gameweek Player Stats ---
    print("\n🌱 Seeding sample player stats...")
    stats_to_create = []
    for gw in gameweeks[:2]: # Only for the first 2 "past" gameweeks
        for player in all_players:
            if random.random() < 0.8: # ~80% of players play
                goals = random.choices([0, 1, 2], weights=[85, 12, 3], k=1)[0]
                assists = random.choices([0, 1, 2], weights=[80, 17, 3], k=1)[0]
                points = (goals * 5) + (assists * 3)

                stats_to_create.append({
                    'gameweek_id': gw.id,
                    'player_id': player.id,
                    'points': points,
                    'goals_scored': goals,
                    'assists': assists,
                    'minutes': random.choice([60, 75, 90]),
                    'bonus_points': random.choices([0, 1, 2, 3], weights=[70, 15, 10, 5], k=1)[0]
                })
    
    if stats_to_create:
        await db.gameweekplayerstats.create_many(data=stats_to_create)
        print(f"✅ Created {len(stats_to_create)} sample player stat entries.")

    print("\n🚀 Seeding complete! Your database is ready.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
=======
    await db.fantasyteam.delete_many()
    await db.user.delete_many()
    print("✅ Data wiped successfully.")


async def main() -> None:
    db = Prisma()
    await db.connect()

    await clear_data(db)

    # --- 1. Create Teams ---
    print("Seeding teams...")
    team_records = await db.team.create_many(data=TEAMS, skip_duplicates=True)
    print(f"✅ Created {team_records} teams.")

    # --- 2. Create Players ---
    print("Seeding players...")
    all_teams = await db.team.find_many()
    team_map = {team.short_name: team.id for team in all_teams}
    
    player_count = 0
    for short_name, players in PLAYERS.items():
        team_id = team_map.get(short_name)
        if not team_id:
            continue
        
        player_data = [{"team_id": team_id, **player} for player in players]
        created = await db.player.create_many(data=player_data, skip_duplicates=True)
        player_count += created
    print(f"✅ Created {player_count} players.")

    # --- 3. Create Gameweeks ---
    print("Seeding 10 gameweeks...")
    gameweek_data = [
        {"gw_number": i, "deadline": SEASON_START_DATE + timedelta(weeks=i-1)}
        for i in range(1, 11)
    ]
    await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
    print("✅ Created 10 gameweeks.")

    # --- 4. Create Fixtures for the whole season ---
    print("Generating and seeding fixtures for 10 Gameweeks...")
    all_gws = await db.gameweek.find_many(order={"gw_number": "asc"})
    team_ids = [team.id for team in all_teams]
    
    fixture_schedule = generate_round_robin_fixtures(team_ids)
    
    total_fixtures_created = 0
    for i, round_fixtures in enumerate(fixture_schedule):
        gameweek = all_gws[i]
        fixtures_data = [
            {
                "gameweek_id": gameweek.id,
                "home_team_id": home_id,
                "away_team_id": away_id,
                "kickoff": gameweek.deadline - timedelta(days=random.randint(1, 3), hours=random.randint(2, 8))
            }
            for home_id, away_id in round_fixtures
        ]
        created_count = await db.fixture.create_many(data=fixtures_data, skip_duplicates=True)
        total_fixtures_created += created_count
        print(f"  - Created {created_count} fixtures for Gameweek {gameweek.gw_number}")
        
    print(f"✅ Created a total of {total_fixtures_created} fixtures.")

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

>>>>>>> Aryan
