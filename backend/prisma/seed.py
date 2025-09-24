# import asyncio
# from datetime import datetime, timedelta
# import random
# import sys
# import os
# from zoneinfo import ZoneInfo

# # Add the project root (`backend`) to the Python path to allow for `app` module imports
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# from prisma import Prisma
# from app.auth import hash_password


# # --- Configuration ---
# # Start the season "now" so you can test immediately. First GW is ~1 minute from now.
# def get_season_start_now():
#     now = datetime.now(ZoneInfo("Asia/Kolkata")).replace(second=0, microsecond=0)
#     return now + timedelta(minutes=15)


# SEASON_START_DATE = get_season_start_now()


# # --- Seed Data ---

# TEAMS = [
#     {"name": "Umang Foundation Trust", "short_name": "UMA"},
#     {"name": "Satans", "short_name": "SAT"},
#     {"name": "Roarers", "short_name": "ROA"},
#     {"name": "Southside", "short_name": "SOU"},
#     {"name": "Traana", "short_name": "TRA"},
#     {"name": "Titans", "short_name": "TIT"},
# ]

# def get_player_data():
#     """
#     Extracts, normalizes, and assigns positions to all players.
#     """
    
#     # Raw data extracted from the image
#     raw_data = {
#         "UMA": [
#             ("Shalibhadra Daga", 3), ("Kaif Munee", 25), ("Kanav Sachdev", 15),
#             ("Siddharth Castelino (Casta)", 10), ("Mohit Thakurel", 10), ("Krish Sharma", 9),
#             ("Manav Gagvani", 17), ("Varun Chandiramani", 7), ("Vishal devadiga", 1),
#             ("Aneesh Malankar", 1), ("Joel Fernandes", 5), ("Virgil Braganza (GK)", 8),
#             ("Gautam G", 1)
#         ],
#         "SAT": [
#             ("Dharmendra Bhurj", 8), ("Pranit Vyas", 25), ("Ross O'Rely", 15),
#             ("Jagdish Lobo", 10), ("Pawan Rai", 10), ("Gerard A", 8),
#             ("Sahaj (Guru)", 7), ("Anmol", 24), ("Sahaj", 5),
#             ("Nisheet k", 5), ("Rajeev Asija", 5), ("Rahul Kakad", 2),
#             ("Sachin K", 1)
#         ],
#         "ROA": [ # Previously Mumbai Hotspurs
#             ("Dane", 9), ("Vrushabh Sikarwar", 25), ("Puneet Chadha", 15),
#             ("Shaurya Bhandari", 10), ("Pritish Roongta", 5), ("Dave Deohans", 14),
#             ("Joshua Samuel", 14), ("Aman K", 26), ("Manav SK", 1),
#             ("Ibadur Haque", 5), ("Jeff Bhatija", 5), ("Akshay Karwa", 1),
#             ("Abhishek Negi", 1)
#         ],
#         "TIT": [
#             ("Yash Patwa", 9), ("Yash Pathak", 25), ("Raj Badhuria", 15),
#             ("Yug Nair", 10), ("Rahul Laud", 10), ("Kabir Khan", 11),
#             ("Param Sabnani", 14), ("Jeet Antani", 1), ("Shrineel Belgaon", 11),
#             ("Tanish Jain", 5), ("Rishabh Lunia", 5), ("Khushal D", 10),
#             ("Harish", 1)
#         ],
#         "TRA": [ # Previously Bandra United FC
#             ("Wren Dabreo", 12), ("Raunak Killinger", 25), ("Joshua Vessoakar", 15),
#             ("Sushant Pawar", 10), ("Rohan Jadhav", 11), ("Mathais Coutinho", 11),
#             ("Tabish Amrar", 10), ("Kurt Baptista", 26), ("Aamir Petiwala", 1),
#             ("Randell Dsouza", 1), ("MM", 5), ("Joywin Fernandes", 1),
#             ("Kapil B", 1)
#         ],
#         "SOU": [
#             ("Rushab Lakhwani", 4), ("Miguel", 25), ("Alvro", 15),
#             ("Pranal Shetty", 10), ("Shubham P", 7), ("Aarav Hazari", 1),
#             ("Pratham PM", 1), ("Anish Bhabdha", 9), ("Tejas More", 2),
#             ("Puneet Samra", 1), ("Karan", 5), ("Divya Mulani", 7),
#             ("Amweeshak", 1)
#         ]
#     }

#     normalized_players = {}
    
#     # Define a balanced outfield distribution for a 13-player squad
#     outfield_positions = ['DEF'] * 4 + ['MID'] * 5 + ['FWD'] * 3

#     for short_name, player_list in raw_data.items():
#         # Shuffle positions for each team to ensure randomness
#         random.shuffle(outfield_positions)
        
#         team_players = []
#         for i, (name, old_price) in enumerate(player_list):
#             # Normalize price
#             new_price = round(old_price * (110 / 132), 1)
            
#             # Assign position
#             if i == 0:
#                 position = "GK"
#             else:
#                 # Pop a position from the shuffled list
#                 position = outfield_positions[i-1]
                
#             team_players.append({
#                 "full_name": name,
#                 "position": position,
#                 "price": new_price
#             })
#         normalized_players[short_name] = team_players
        
#     return normalized_players

# PLAYERS = get_player_data()


# def generate_round_robin_fixtures(team_ids):
#     """Generates a double round-robin schedule."""
#     team_ids = list(team_ids)
#     if len(team_ids) % 2 != 0:
#         team_ids.append(None)

#     n = len(team_ids)
#     schedule = []
#     for _ in range(n - 1):
#         mid = n // 2
#         l1 = team_ids[:mid]
#         l2 = team_ids[mid:]
#         l2.reverse()

#         round_fixtures = []
#         for i in range(mid):
#             if l1[i] is not None and l2[i] is not None:
#                 round_fixtures.append((l1[i], l2[i]))
#         schedule.append(round_fixtures)
#         team_ids.insert(1, team_ids.pop())

#     full_schedule = []
#     for round_fixtures in schedule:
#         full_schedule.append(round_fixtures)
#     for round_fixtures in schedule:
#         full_schedule.append([(away, home) for home, away in round_fixtures])

#     return full_schedule


# async def clear_data(db: Prisma):
#     """Wipes all data from the database to ensure a clean slate."""
#     print("🧹 Wiping existing data...")
#     await db.userchip.delete_many()
#     await db.transfer_log.delete_many()
#     await db.usergameweekscore.delete_many()
#     await db.gameweekplayerstats.delete_many()
#     await db.userteam.delete_many()
#     await db.fixture.delete_many()
#     await db.gameweek.delete_many()
#     await db.player.delete_many()
#     await db.team.delete_many()
#     await db.fantasyteam.delete_many()
#     await db.user.delete_many()
#     print("✅ Data wiped successfully.")


# async def main() -> None:
#     db = Prisma()
#     await db.connect()

#     await clear_data(db)

#     # --- Admin User ---
#     print("Seeding admin user...")
#     ADMIN_EMAIL = "admin@acesfpl.com"
#     ADMIN_PASSWORD = "adminPassword"
#     pwd_hash = hash_password(ADMIN_PASSWORD)

#     admin = await db.user.upsert(
#         where={"email": ADMIN_EMAIL},
#         data={
#             "create": {
#                 "email": ADMIN_EMAIL,
#                 "hashed_password": pwd_hash,
#                 "role": "admin",
#                 "is_active": True,
#                 "full_name": "Admin",
#             },
#             "update": {
#                 "hashed_password": pwd_hash,
#                 "role": "admin",
#                 "is_active": True,
#                 "full_name": "Admin",
#             },
#         },
#     )
#     print(f"✅ Admin ready: {admin.email}")

#     # --- 1. Create Teams ---
#     print("Seeding teams...")
#     created_teams = await db.team.create_many(data=TEAMS, skip_duplicates=True)
#     print(f"✅ Created {created_teams} teams.")

#     # --- 2. Create Players ---
#     print("Seeding players...")
#     all_teams = await db.team.find_many()
#     team_map = {team.short_name: team.id for team in all_teams}

#     player_count = 0
#     for short_name, players in PLAYERS.items():
#         team_id = team_map.get(short_name)
#         if not team_id:
#             continue
#         player_data = [{"team_id": team_id, **player} for player in players]
#         created = await db.player.create_many(data=player_data, skip_duplicates=True)
#         player_count += created
#     print(f"✅ Created {player_count} players.")

#     # --- 3. Create Gameweeks (spread over 7 days) ---
#     print("Seeding 10 gameweeks over 7 days...")
#     gameweek_data = [
#         {
#             "gw_number": i,
#             "deadline": SEASON_START_DATE + timedelta(minutes=20 * (i - 1)),
#         }
#         for i in range(1, 11)
#     ]
#     await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
#     print("✅ Created 10 gameweeks.")

#     # --- 4. Create Test User + Team + Score rows ---
#     print("Creating test user...")
#     test_email = "test@example.com"
#     test_password = "password"
#     test_user = await db.user.create(
#         data={
#             "email": test_email,
#             "hashed_password": hash_password(test_password),
#             "role": "user",
#             "is_active": True,
#             "full_name": "Test User",
#             "fantasy_team": {"create": {"name": "Test FC"}},
#         },
#         include={"fantasy_team": True},
#     )
#     print(f"✅ Test User: {test_email} / {test_password}")

#     gws = await db.gameweek.find_many()
#     await db.usergameweekscore.create_many(
#         data=[{"user_id": test_user.id, "gameweek_id": gw.id} for gw in gws],
#         skip_duplicates=True,
#     )
#     print("✅ Seeded test user UserGameweekScore rows.")

#     # --- 5. Create Fixtures for the season ---
#     print("Generating and seeding fixtures...")
#     all_gws = sorted(gws, key=lambda x: x.gw_number)
#     team_ids = [team.id for team in all_teams]
#     fixture_schedule = generate_round_robin_fixtures(team_ids)

#     total_fixtures_created = 0
#     for i, round_fixtures in enumerate(fixture_schedule):
#         if i >= len(all_gws):
#             break
#         gameweek = all_gws[i]
#         fixtures_data = [
#             {
#                 "gameweek_id": gameweek.id,
#                 "home_team_id": home_id,
#                 "away_team_id": away_id,
#                 "kickoff": gameweek.deadline - timedelta(minutes=random.randint(5, 15)),
#             }
#             for home_id, away_id in round_fixtures
#         ]
#         created_count = await db.fixture.create_many(
#             data=fixtures_data, skip_duplicates=True
#         )
#         total_fixtures_created += created_count
#         print(f"  - Created {created_count} fixtures for Gameweek {gameweek.gw_number}")

#     print(f"✅ Created a total of {total_fixtures_created} fixtures across {len(fixture_schedule)} gameweeks.")

#     await db.disconnect()


# if __name__ == "__main__":
#     asyncio.run(main())


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
    return now + timedelta(minutes=15)


SEASON_START_DATE = get_season_start_now()


# --- Seed Data ---

# UPDATED: New team list based on your provided data
TEAMS = [
    {"name": "Southside", "short_name": "SOU"},
    {"name": "Trana", "short_name": "TRA"},
    {"name": "Titans", "short_name": "TIT"},
    {"name": "Roarers", "short_name": "ROA"},
    {"name": "Satans", "short_name": "SAT"},
    {"name": "Umang", "short_name": "UMA"}, # Assuming Umang -> Umang Foundation Trust
]

def get_player_data():
    """
    Returns the structured player data for seeding based on the new list.
    """
    # UPDATED: This dictionary now contains the exact player data you provided.
    player_data = {
        "SOU": [
            {'full_name': 'Cleetus Chandrashekhar', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Aadil Jafferbhoy', 'price': 13.0, 'position': 'DEF'},
            {'full_name': 'Mohammedali Rajani', 'price': 5.0, 'position': 'GK'},
            {'full_name': 'Alvaro', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Pranal Shetty', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Anish Bhabdha', 'price': 9.0, 'position': 'FWD'},
            {'full_name': 'Aarav Hazari', 'price': 1.0, 'position': 'MID'},
            {'full_name': 'Miguel', 'price': 25.0, 'position': 'FWD'},
            {'full_name': 'Karan', 'price': 5.0, 'position': 'FWD'},
            {'full_name': 'Akhil Hazari', 'price': 3.0, 'position': 'DEF'},
            {'full_name': 'Alejandro Guillermo Banares', 'price': 24.0, 'position': 'DEF'},
            {'full_name': 'Divyesh Patel', 'price': 1.0, 'position': 'MID'},
            {'full_name': 'Pratham M', 'price': 1.0, 'position': 'DEF'}
        ],
        "TRA": [
            {'full_name': 'Zaid Ansari', 'price': 15.0, 'position': 'FWD'},
            {'full_name': 'Hanzalah Mohammed Elyas Kapadia', 'price': 17.0, 'position': 'MID'},
            {'full_name': 'Rushab Lakhwani', 'price': 5.0, 'position': 'GK'},
            {'full_name': 'Mir Mehta', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Showkat Ansari', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Tabish Armar', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Aamir Mazhar Ghadially', 'price': 10.0, 'position': 'MID'},
            {'full_name': 'Humaid Muazzam Armar', 'price': 7.0, 'position': 'MID'},
            {'full_name': 'Aamir Petiwala', 'price': 1.0, 'position': 'FWD'},
            {'full_name': 'Gufranullah Rizwanullah Khan', 'price': 7.0, 'position': 'DEF'},
            {'full_name': 'Mohammed Abdar Chasmawala', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Armaan Vardhan', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Manav J', 'price': 1.0, 'position': 'DEF'}
        ],
        "TIT": [
            {'full_name': 'Raj Bhadhuria', 'price': 25.0, 'position': 'FWD'},
            {'full_name': 'Gyan Savir Saldanha', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Yug Nair', 'price': 10.0, 'position': 'GK'},
            {'full_name': 'Rahul Sachdev', 'price': 13.0, 'position': 'FWD'},
            {'full_name': 'Jeet Antani', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Tanish Jain', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Kabir Khan', 'price': 11.0, 'position': 'MID'},
            {'full_name': 'Param Sabnani', 'price': 11.0, 'position': 'DEF'},
            {'full_name': 'Rishabh Lunia', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Manav Gagvani', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Aditya Sandeep Bamb', 'price': 14.0, 'position': 'DEF'},
            {'full_name': 'Ishaan Rajnish Jindal', 'price': 11.0, 'position': 'FWD'},
            {'full_name': 'Tushar Kant', 'price': 1.0, 'position': 'DEF'}
        ],
        "ROA": [
            {'full_name': 'Karan Khanna', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Dave Deohans', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Dane Pereira', 'price': 5.0, 'position': 'GK'},
            {'full_name': 'Siddharth Castellino', 'price': 10.0, 'position': 'MID'},
            {'full_name': 'Ibadur Haque', 'price': 5.0, 'position': 'FWD'},
            {'full_name': 'Shlok Vyas', 'price': 20.0, 'position': 'MID'},
            {'full_name': 'Saheb Singh Satinder Pal Ahuja', 'price': 15.0, 'position': 'DEF'},
            {'full_name': 'Kirk Anthony Quadros', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Uzair Patankar', 'price': 17.0, 'position': 'MID'},
            {'full_name': 'Nelson Wilfred Aranha', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Srivinayak Shivkumar Tatikonda', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Akshay Karwa', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Abhishek Negi', 'price': 1.0, 'position': 'DEF'}
        ],
        "SAT": [
            {'full_name': 'Pranit Vyas', 'price': 25.0, 'position': 'FWD'},
            {'full_name': 'Rohan Jadhav', 'price': 24.0, 'position': 'DEF'},
            {'full_name': 'Anirudh Iyer', 'price': 8.0, 'position': 'GK'},
            {'full_name': 'Jagdish Lobo', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Rajeev Asija', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Abdur Rehman Noor Mohamed Azeez', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Amogh Sanjeev Jadal', 'price': 11.0, 'position': 'MID'},
            {'full_name': 'Nathan Clifton Murzello', 'price': 10.0, 'position': 'MID'},
            {'full_name': 'Shrineel Belgaonkar', 'price': 1.0, 'position': 'FWD'},
            {'full_name': 'Siddharth Rupali Bhonsle', 'price': 9.0, 'position': 'MID'},
            {'full_name': 'Inshaal Sheredil Dhanjee', 'price': 1.0, 'position': 'FWD'},
            {'full_name': 'Shubhrajyoti Das', 'price': 11.0, 'position': 'DEF'},
            {'full_name': 'Mathais Coutinho', 'price': 10.0, 'position': 'MID'}
        ],
        "UMA": [
            {'full_name': 'Titus Andrew Uttankar', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Pranit Vikas Gaikwad', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Yashraj Singh', 'price': 12.0, 'position': 'GK'},
            {'full_name': 'Kaif Muneer', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Krish Sharma', 'price': 9.0, 'position': 'MID'},
            {'full_name': 'Aneesh Malankar', 'price': 5.0, 'position': 'FWD'},
            {'full_name': 'Joel Fernandes', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Joshua Vessoakar', 'price': 21.0, 'position': 'DEF'},
            {'full_name': 'Shubham Pandey', 'price': 6.0, 'position': 'DEF'},
            {'full_name': 'Dhaval Dinesh Savla', 'price': 1.0, 'position': 'DEF'},
            {'full_name': 'Dev Gupta', 'price': 3.0, 'position': 'MID'},
            {'full_name': 'Tejash Pavanjyot Kohli', 'price': 1.0, 'position': 'MID'},
            {'full_name': 'Rohil Malankar', 'price': 1.0, 'position': 'FWD'}
        ]
    }
    return player_data

PLAYERS = get_player_data()


def generate_round_robin_fixtures(team_ids):
    """Generates a double round-robin schedule."""
    team_ids = list(team_ids)
    if len(team_ids) % 2 != 0:
        team_ids.append(None)

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
        team_ids.insert(1, team_ids.pop())

    full_schedule = []
    for round_fixtures in schedule:
        full_schedule.append(round_fixtures)
    for round_fixtures in schedule:
        full_schedule.append([(away, home) for home, away in round_fixtures])

    return full_schedule


async def clear_data(db: Prisma):
    """Wipes all data from the database to ensure a clean slate."""
    print("🧹 Wiping existing data...")
    # Delete in an order that respects foreign key constraints
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


async def main() -> None:
    db = Prisma()
    await db.connect()

    await clear_data(db)

    # --- Admin User ---
    print("Seeding admin user...")
    ADMIN_EMAIL = "admin@acesfpl.com"
    ADMIN_PASSWORD = "adminPassword"
    pwd_hash = hash_password(ADMIN_PASSWORD)

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

    # --- 3. Create Gameweeks (spread over 7 days) ---
    print("Seeding 10 gameweeks over 7 days...")
    gameweek_data = [
        {
            "gw_number": i,
            "deadline": SEASON_START_DATE + timedelta(minutes=20 * (i - 1)),
        }
        for i in range(1, 11)
    ]
    await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
    print("✅ Created 10 gameweeks.")

    # --- 4. Create Test User + Team + Score rows ---
    print("Creating test user...")
    test_email = "test@example.com"
    test_password = "password"
    test_user = await db.user.create(
        data={
            "email": test_email,
            "hashed_password": hash_password(test_password),
            "role": "user",
            "is_active": True,
            "full_name": "Test User",
            "fantasy_team": {"create": {"name": "Test FC"}},
        },
        include={"fantasy_team": True},
    )
    print(f"✅ Test User: {test_email} / {test_password}")

    gws = await db.gameweek.find_many()
    await db.usergameweekscore.create_many(
        data=[{"user_id": test_user.id, "gameweek_id": gw.id} for gw in gws],
        skip_duplicates=True,
    )
    print("✅ Seeded test user UserGameweekScore rows.")

    # --- 5. Create Fixtures for the season ---
    print("Generating and seeding fixtures...")
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
                "kickoff": gameweek.deadline - timedelta(minutes=5),
            }
            for home_id, away_id in round_fixtures
        ]
        created_count = await db.fixture.create_many(
            data=fixtures_data, skip_duplicates=True
        )
        total_fixtures_created += created_count
        print(f"  - Created {created_count} fixtures for Gameweek {gameweek.gw_number}")

    print(f"✅ Created a total of {total_fixtures_created} fixtures across {len(fixture_schedule)} gameweeks.")

    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())