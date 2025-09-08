import asyncio
from prisma import Prisma
from decimal import Decimal
from datetime import datetime, timedelta, timezone
import random
# --- NEW: Import for password hashing ---
from passlib.context import CryptContext

# --- Configuration ---
# --- NEW: Admin User Credentials ---
ADMIN_EMAIL = "admin@aces.com"
ADMIN_PASSWORD = "adminPassword" # IMPORTANT: Use a strong password in a real production environment

TEAMS_DATA = [
    {'name': 'Satan', 'short_name': 'SAT'},
    {'name': 'Bandra United', 'short_name': 'BAN'},
    {'name': 'Mumbai Hotspurs', 'short_name': 'MHS'},
    {'name': 'Southside', 'short_name': 'SOU'},
    {'name': 'Titans', 'short_name': 'TIT'},
    {'name': 'Umaag Foundation Trust', 'short_name': 'UMA'},
]
POSITIONS = ["GK", "DEF", "MID", "FWD"]
PLAYERS_PER_TEAM_PER_POSITION = 2
TOTAL_GAMEWEEKS = 5

# --- Real Player Names ---
REAL_PLAYERS = {
    "GK": [
        "Alisson Becker", "Ederson Moraes", "David Raya", "Guglielmo Vicario", "André Onana", "Nick Pope",
        "Emiliano Martínez", "Jordan Pickford", "Bernd Leno", "Robert Sánchez", "Neto Murara", "Alphonse Areola",
    ],
    "DEF": [
        "Virgil van Dijk", "William Saliba", "Gabriel Magalhães", "Rúben Dias", "Joško Gvardiol", "Trent Alexander-Arnold",
        "Kyle Walker", "Ben White", "Lisandro Martínez", "Kieran Trippier", "Reece James", "Ben Chilwell",
        "Pervis Estupiñán", "Sven Botman", "Destiny Udogie", "Levi Colwill", "John Stones", "Manuel Akanji",
        "Luke Shaw", "Raphaël Varane", "Dan Burn", "Fabian Schär", "Cristian Romero", "Pedro Porro",
    ],
    "MID": [
        "Kevin De Bruyne", "Martin Ødegaard", "Bruno Fernandes", "Bukayo Saka", "Mohamed Salah", "Son Heung-min",
        "Rodri", "Declan Rice", "James Maddison", "Phil Foden", "Marcus Rashford", "Kaoru Mitoma",
        "Jarrod Bowen", "Enzo Fernández", "Alexis Mac Allister", "Dominik Szoboszlai", "Bernardo Silva",
        "Jack Grealish", "Mason Mount", "Casemiro", "Bruno Guimarães", "Joelinton", "Eberechi Eze", "Michael Olise",
    ],
    "FWD": [
        "Erling Haaland", "Ollie Watkins", "Alexander Isak", "Julián Álvarez", "Darwin Núñez",
        "Gabriel Jesus", "Rasmus Højlund", "Christopher Nkunku", "Ivan Toney", "Evan Ferguson",
        "Cody Gakpo", "Nicolas Jackson",
    ],
}

# --- NEW: Password hashing context ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def main():
    """
    Main function to seed the database.
    - Cleans up existing data.
    - Creates an admin user.
    - Creates teams, players, gameweeks, fixtures, and sample stats.
    """
    db = Prisma()
    await db.connect()

    print("🧹 Cleaning up old game data (keeping users)...")
    await db.userteam.delete_many()
    await db.usergameweekscore.delete_many()
    await db.gameweekplayerstats.delete_many()
    await db.fixture.delete_many()
    await db.gameweek.delete_many()
    await db.player.delete_many()
    await db.team.delete_many()
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