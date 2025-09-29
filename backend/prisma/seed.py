import asyncio
from datetime import datetime, timedelta
import sys
import os
from zoneinfo import ZoneInfo

# Add the project root (`backend`) to the Python path to allow for `app` module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prisma import Prisma
from app.auth import hash_password

# --- CONFIGURATION FOR THE INVESTOR PITCH DEMO ---

# Base date for the simulation (Tomorrow)
PITCH_DAY_TOMORROW = datetime.now(ZoneInfo("Asia/Kolkata")).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
PITCH_DAY_AFTER = PITCH_DAY_TOMORROW + timedelta(days=1)

# --- MODIFIED: New compressed schedule for the pitch ---
GAMEWEEK_SCHEDULE = {
    1: PITCH_DAY_TOMORROW.replace(hour=11, minute=0),  # Tomorrow at 11 AM
    2: PITCH_DAY_TOMORROW.replace(hour=14, minute=0),  # Tomorrow at 2 PM
    3: PITCH_DAY_TOMORROW.replace(hour=17, minute=0),  # Tomorrow at 5 PM
    4: PITCH_DAY_TOMORROW.replace(hour=20, minute=0),  # Tomorrow at 8 PM
    5: PITCH_DAY_AFTER.replace(hour=11, minute=0),   # Day after at 11 AM
    6: PITCH_DAY_AFTER.replace(hour=14, minute=0),   # Day after at 2 PM
    7: PITCH_DAY_AFTER.replace(hour=17, minute=0),   # Day after at 5 PM
    8: PITCH_DAY_AFTER.replace(hour=20, minute=0),   # Day after at 8 PM
    9: PITCH_DAY_AFTER.replace(hour=22, minute=0),
    10: PITCH_DAY_AFTER.replace(hour=23, minute=0)
}

# --- MODIFIED: New fixture list from the provided image ---
FIXTURE_DATA = {
    1: [("Southside", "Titans"), ("Satans", "Roarers"), ("Trana", "Umang")],
    2: [("Southside", "Roarers"), ("Titans", "Trana"), ("Satans", "Umang")],
    3: [("Southside", "Trana"), ("Titans", "Umang"), ("Roarers", "Satans")],
    4: [("Southside", "Umang"), ("Titans", "Roarers"), ("Trana", "Satans")],
    5: [("Southside", "Satans"), ("Titans", "Umang"), ("Trana", "Roarers")],
    6: [("Southside", "Titans"), ("Satans", "Roarers"), ("Trana", "Umang")],
    7: [("Southside", "Roarers"), ("Titans", "Trana"), ("Satans", "Umang")],
    8: [("Southside", "Trana"), ("Titans", "Umang"), ("Roarers", "Satans")],
    9: [("Southside", "Umang"), ("Titans", "Roarers"), ("Trana", "Satans")],
    10: [("Southside", "Satans"), ("Titans", "Umang"), ("Trana", "Roarers")],
}

TEAMS = [
    {"name": "Southside", "short_name": "SOU"}, {"name": "Trana", "short_name": "TRA"},
    {"name": "Titans", "short_name": "TIT"}, {"name": "Roarers", "short_name": "ROA"},
    {"name": "Satans", "short_name": "SAT"}, {"name": "Umang", "short_name": "UMA"},
]

def get_player_data():
    # This data remains the same
    return {
        "SOU": [{'full_name': 'Cleetus Chandrashekhar', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Aadil Jafferbhoy', 'price': 13.0, 'position': 'DEF'}, {'full_name': 'Mohammedali Rajani', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Alvaro', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Pranal Shetty', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Anish Bhabdha', 'price': 9.0, 'position': 'FWD'}, {'full_name': 'Aarav Hazari', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Miguel', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Karan', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Akhil Hazari', 'price': 3.0, 'position': 'DEF'}, {'full_name': 'Alejandro Guillermo Banares', 'price': 24.0, 'position': 'DEF'}, {'full_name': 'Divyesh Patel', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Pratham M', 'price': 1.0, 'position': 'DEF'}],
        "TRA": [{'full_name': 'Zaid Ansari', 'price': 15.0, 'position': 'FWD'}, {'full_name': 'Hanzalah Mohammed Elyas Kapadia', 'price': 17.0, 'position': 'MID'}, {'full_name': 'Rushab Lakhwani', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Mir Mehta', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Showkat Ansari', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Tabish Armar', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Aamir Mazhar Ghadially', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Humaid Muazzam Armar', 'price': 7.0, 'position': 'MID'}, {'full_name': 'Aamir Petiwala', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Gufranullah Rizwanullah Khan', 'price': 7.0, 'position': 'DEF'}, {'full_name': 'Mohammed Abdar Chasmawala', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Armaan Vardhan', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Manav J', 'price': 1.0, 'position': 'DEF'}],
        "TIT": [{'full_name': 'Raj Bhadhuria', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Gyan Savir Saldanha', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Yug Nair', 'price': 10.0, 'position': 'GK'}, {'full_name': 'Rahul Sachdev', 'price': 13.0, 'position': 'FWD'}, {'full_name': 'Jeet Antani', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Tanish Jain', 'price': 5.0, 'position': 'DEF'}, {'full_name': 'Kabir Khan', 'price': 11.0, 'position': 'MID'}, {'full_name': 'Param Sabnani', 'price': 11.0, 'position': 'DEF'}, {'full_name': 'Rishabh Lunia', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Manav Gagvani', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Aditya Sandeep Bamb', 'price': 14.0, 'position': 'DEF'}, {'full_name': 'Ishaan Rajnish Jindal', 'price': 11.0, 'position': 'FWD'}, {'full_name': 'Tushar Kant', 'price': 1.0, 'position': 'DEF'}],
        "ROA": [{'full_name': 'Karan Khanna', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Dave Deohans', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Dane Pereira', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Siddharth Castellino', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Ibadur Haque', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Shlok Vyas', 'price': 20.0, 'position': 'MID'}, {'full_name': 'Saheb Singh Satinder Pal Ahuja', 'price': 15.0, 'position': 'DEF'}, {'full_name': 'Kirk Anthony Quadros', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Uzair Patankar', 'price': 17.0, 'position': 'MID'}, {'full_name': 'Nelson Wilfred Aranha', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Srivinayak Shivkumar Tatikonda', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Akshay Karwa', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Abhishek Negi', 'price': 1.0, 'position': 'DEF'}],
        "SAT": [{'full_name': 'Pranit Vyas', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Rohan Jadhav', 'price': 24.0, 'position': 'DEF'}, {'full_name': 'Anirudh Iyer', 'price': 8.0, 'position': 'GK'}, {'full_name': 'Jagdish Lobo', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Rajeev Asija', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Abdur Rehman Noor Mohamed Azeez', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Amogh Sanjeev Jadal', 'price': 11.0, 'position': 'MID'}, {'full_name': 'Nathan Clifton Murzello', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Shrineel Belgaonkar', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Siddharth Rupali Bhonsle', 'price': 9.0, 'position': 'MID'}, {'full_name': 'Inshaal Sheredil Dhanjee', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Shubhrajyoti Das', 'price': 11.0, 'position': 'DEF'}, {'full_name': 'Mathais Coutinho', 'price': 10.0, 'position': 'MID'}],
        "UMA": [{'full_name': 'Titus Andrew Uttankar', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Pranit Vikas Gaikwad', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Yashraj Singh', 'price': 12.0, 'position': 'GK'}, {'full_name': 'Kaif Muneer', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Krish Sharma', 'price': 9.0, 'position': 'MID'}, {'full_name': 'Aneesh Malankar', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Joel Fernandes', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Joshua Vessoakar', 'price': 21.0, 'position': 'DEF'}, {'full_name': 'Shubham Pandey', 'price': 6.0, 'position': 'DEF'}, {'full_name': 'Dhaval Dinesh Savla', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Dev Gupta', 'price': 3.0, 'position': 'MID'}, {'full_name': 'Tejash Pavanjyot Kohli', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Rohil Malankar', 'price': 1.0, 'position': 'FWD'}]
    }
PLAYERS = get_player_data()

async def clear_data(db: Prisma):
    print("🧹 Wiping existing data...")
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

    print("Seeding admin and test users...")
    users_to_create = [
        {"email": "admin@acesfpl.com", "full_name": "Admin User", "password": "adminPassword", "role": "admin", "is_active": True},
        {"email": "test@example.com", "full_name": "Test User", "password": "password", "role": "user", "is_active": True}
    ]
    for user_data in users_to_create:
        await db.user.create(data={
            "email": user_data["email"], "hashed_password": hash_password(user_data["password"]),
            "role": user_data["role"], "is_active": user_data["is_active"], "full_name": user_data["full_name"],
        })
    print("✅ Admin and test users created.")

    print("Seeding teams and players...")
    await db.team.create_many(data=TEAMS, skip_duplicates=True)
    all_teams = await db.team.find_many()
    team_map_name = {team.name: team.id for team in all_teams}
    team_map_short = {team.short_name: team.id for team in all_teams}
    for short_name, players in PLAYERS.items():
        team_id = team_map_short.get(short_name)
        if team_id:
            await db.player.create_many(data=[{"team_id": team_id, **p} for p in players], skip_duplicates=True)
    print("✅ Teams and players seeded.")

    print("Creating gameweeks for the pitch schedule...")
    gameweek_data = []
    for gw_num, deadline in GAMEWEEK_SCHEDULE.items():
        gameweek_data.append({"gw_number": gw_num, "deadline": deadline, "status": "UPCOMING"})
    await db.gameweek.create_many(data=gameweek_data)
    print(f"✅ All {len(gameweek_data)} gameweeks created with UPCOMING status.")

    print("Creating fixtures from schedule...")
    all_gws = await db.gameweek.find_many()
    gameweek_map = {gw.gw_number: gw.id for gw in all_gws}

    for gw_num, fixtures in FIXTURE_DATA.items():
        gameweek_id = gameweek_map.get(gw_num)
        if gameweek_id:
            fixtures_to_create = []
            for home_name, away_name in fixtures:
                home_id = team_map_name.get(home_name); away_id = team_map_name.get(away_name)
                if home_id and away_id:
                    kickoff_time = GAMEWEEK_SCHEDULE[gw_num]
                    fixtures_to_create.append({
                        "gameweek_id": gameweek_id, "home_team_id": home_id,
                        "away_team_id": away_id, "kickoff": kickoff_time
                    })
            if fixtures_to_create:
                await db.fixture.create_many(data=fixtures_to_create, skip_duplicates=True)
    print("✅ All fixtures created.")

    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

