import asyncio
from datetime import datetime, timedelta
import random
import sys
import os
from zoneinfo import ZoneInfo

# Add the project root (`backend`) to the Python path to allow for `app` module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prisma import Prisma
from app.auth import hash_password


# --- Configuration ---
# Start the season "now" so you can test immediately. First GW is ~1 minute from now.
def get_season_start_now():
    now = datetime.now(ZoneInfo("Asia/Kolkata")).replace(second=0, microsecond=0)
    return now + timedelta(minutes=1)


SEASON_START_DATE = get_season_start_now()


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
    "SAT": [  # Manchester United
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
    "BAN": [  # Manchester City
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
    "MHS": [  # Tottenham Hotspur
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
    "SOU": [  # Arsenal
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
    "TIT": [  # Liverpool
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
    "UMA": [  # Chelsea
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
    team_ids = list(team_ids)  # avoid mutating caller list
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
    await db.fantasyteam.delete_many()
    await db.user.delete_many()
    print("✅ Data wiped successfully.")


async def quick_simulate_gws(db: Prisma, gw_numbers=(1, 2)):
    """Optional: mark fixtures finished with random scores for given GWs."""
    print(f"Simulating gameweeks: {gw_numbers}")
    for gw_no in gw_numbers:
        gw = await db.gameweek.find_first(where={"gw_number": gw_no})
        if not gw:
            continue
        fixtures = await db.fixture.find_many(where={"gameweek_id": gw.id})
        for fx in fixtures:
            hs = random.randint(0, 4)
            as_ = random.randint(0, 4)
            await db.fixture.update(
                where={"id": fx.id},
                data={"home_score": hs, "away_score": as_, "stats_entered": True},
            )
    print("Simulation done.")


async def main() -> None:
    db = Prisma()
    await db.connect()

    await clear_data(db)

        # --- Admin User ---
    print("Seeding admin user...")
    ADMIN_EMAIL = "admin@acesfpl.com"
    ADMIN_PASSWORD = "adminPassword"  # rotate in prod
    pwd_hash = hash_password(ADMIN_PASSWORD)  # -> stores into `hashed_password`

    admin = await db.user.upsert(
        where={"email": ADMIN_EMAIL},
        data={
            "create": {
                "email": ADMIN_EMAIL,
                "hashed_password": pwd_hash,
                "role": "admin",
                "is_active": True,
                "full_name": "Admin",
            },
            "update": {
                "hashed_password": pwd_hash,
                "role": "admin",
                "is_active": True,
                "full_name": "Admin",
            },
        },
    )
    print(f"✅ Admin ready: {admin.email}")

    # --- 1. Create Teams ---
    print("Seeding teams...")
    created_teams = await db.team.create_many(data=TEAMS, skip_duplicates=True)
    print(f"✅ Created {created_teams} teams.")

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

    # --- 3. Create Gameweeks (25 minutes apart, starting now) ---
    print("Seeding 10 gameweeks...")
    gameweek_data = [
        {
            "gw_number": i,
            "deadline": SEASON_START_DATE + timedelta(minutes=25 * (i - 1)),
        }
        for i in range(1, 11)
    ]
    await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
    print("✅ Created 10 gameweeks.")

    # --- 4. Create Admin User + Team + Score rows ---
    print("Creating admin user...")
    admin_email = "admin@example.com"
    admin_password = "admin123"  # change in prod
    admin = await db.user.create(
        data={
            "email": admin_email,
            "hashed_password": hash_password(admin_password),
            "role": "admin",
            "is_active": True,
            "full_name": "League Admin",
            "fantasy_team": {"create": {"name": "Admin XI"}},
        },
        include={"fantasy_team": True},
    )
    print(f"✅ Admin: {admin_email} / {admin_password}")

    gws = await db.gameweek.find_many()
    await db.usergameweekscore.create_many(
        data=[{"user_id": admin.id, "gameweek_id": gw.id} for gw in gws],
        skip_duplicates=True,
    )
    print("✅ Seeded admin UserGameweekScore rows.")

    # --- 5. Create Fixtures for the whole season ---
    print("Generating and seeding fixtures for 10 Gameweeks...")
    all_gws = sorted(gws, key=lambda x: x.gw_number)
    team_ids = [team.id for team in all_teams]
    fixture_schedule = generate_round_robin_fixtures(team_ids)

    total_fixtures_created = 0
    for i, round_fixtures in enumerate(fixture_schedule):
        if i >= len(all_gws):
            break
        gameweek = all_gws[i]
        fixtures_data = [
            {
                "gameweek_id": gameweek.id,
                "home_team_id": home_id,
                "away_team_id": away_id,
                # Kickoff shortly before the deadline for quick sims
                "kickoff": gameweek.deadline - timedelta(minutes=random.randint(5, 15)),
            }
            for home_id, away_id in round_fixtures
        ]
        created_count = await db.fixture.create_many(
            data=fixtures_data, skip_duplicates=True
        )
        total_fixtures_created += created_count
        print(f"  - Created {created_count} fixtures for Gameweek {gameweek.gw_number}")

    print(f"✅ Created a total of {total_fixtures_created} fixtures.")

    # --- 6. Optional: quick simulation for GW1–2 ---
    # Uncomment to prefill scores so UI can show results immediately.
    # await quick_simulate_gws(db, gw_numbers=(1, 2))

    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())