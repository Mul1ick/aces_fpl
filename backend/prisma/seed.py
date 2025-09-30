import asyncio
from datetime import datetime
import sys
import os
from zoneinfo import ZoneInfo

# Add the project root (`backend`) to the Python path to allow for `app` module imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prisma import Prisma
from app.auth import hash_password

# --- STATIC GAMEWEEK SCHEDULE CONFIGURATION ---
# This schedule is based on the provided fixture image, with a fixed 5 PM deadline.

GAMEWEEK_DATES = {
    1: "05/10/2025",
    2: "12/10/2025",
    3: "26/10/2025",
    4: "02/11/2025",
    5: "09/11/2025",
    6: "16/11/2025",
    7: "23/11/2025",
    8: "30/11/2025",
    9: "07/12/2025",
    10: "14/12/2025",
}

def generate_static_schedule(dates: dict, deadline_hour: int, deadline_minute: int) -> dict:
    """
    Generates a static, real-world gameweek schedule from a dictionary of dates.
    """
    schedule = {}
    tz = ZoneInfo("Asia/Kolkata")
    for gw_num, date_str in dates.items():
        day, month, year = map(int, date_str.split('/'))
        deadline = datetime(year, month, day, hour=deadline_hour, minute=deadline_minute, tzinfo=tz)
        schedule[gw_num] = deadline
    print(f"✅ Generated static schedule. GW1 deadline: {schedule[1].strftime('%Y-%m-%d %H:%M:%S %Z')}")
    return schedule

# --- CORE DATA (MATCHES, TEAMS, PLAYERS) ---

FIXTURE_DATA = {
    1: [("Trana", "Titans"), ("Umang", "Satans"), ("Roarers", "Southside")],
    2: [("Umang", "Roarers"), ("Southside", "Titans"), ("Satans", "Trana")],
    3: [("Satans", "Titans"), ("Umang", "Southside"), ("Roarers", "Trana")],
    4: [("Roarers", "Satans"), ("Southside", "Trana"), ("Umang", "Titans")],
    5: [("Umang", "Trana"), ("Roarers", "Titans"), ("Southside", "Satans")],
    6: [("Trana", "Titans"), ("Umang", "Satans"), ("Roarers", "Southside")],
    7: [("Umang", "Roarers"), ("Southside", "Titans"), ("Satans", "Trana")],
    8: [("Satans", "Titans"), ("Umang", "Southside"), ("Roarers", "Trana")],
    9: [("Roarers", "Satans"), ("Southside", "Trana"), ("Umang", "Titans")],
    10: [("Umang", "Trana"), ("Roarers", "Titans"), ("Southside", "Satans")],
}

TEAMS = [
    {"name": "Southside", "short_name": "SOU"}, {"name": "Trana", "short_name": "TRA"},
    {"name": "Titans", "short_name": "TIT"}, {"name": "Roarers", "short_name": "ROA"},
    {"name": "Satans", "short_name": "SAT"}, {"name": "Umang", "short_name": "UMA"},
]

def get_player_data():
    return {
        "SOU": [{'full_name': 'Cleetus Chandrashekhar', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Aadil Jafferbhoy', 'price': 13.0, 'position': 'DEF'}, {'full_name': 'Mohammedali Rajani', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Alvaro', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Pranal Shetty', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Anish Bhabdha', 'price': 9.0, 'position': 'FWD'}, {'full_name': 'Aarav Hazari', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Miguel', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Karan', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Akhil Hazari', 'price': 3.0, 'position': 'DEF'}, {'full_name': 'Alejandro Guillermo Banares', 'price': 24.0, 'position': 'DEF'}, {'full_name': 'Divyesh Patel', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Pratham M', 'price': 1.0, 'position': 'DEF'}],
        "TRA": [{'full_name': 'Zaid Ansari', 'price': 15.0, 'position': 'FWD'}, {'full_name': 'Hanzalah Mohammed Elyas Kapadia', 'price': 17.0, 'position': 'MID'}, {'full_name': 'Rushab Lakhwani', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Mir Mehta', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Showkat Ansari', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Tabish Armar', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Aamir Mazhar Ghadially', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Humaid Muazzam Armar', 'price': 7.0, 'position': 'MID'}, {'full_name': 'Aamir Petiwala', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Gufranullah Rizwanullah Khan', 'price': 7.0, 'position': 'DEF'}, {'full_name': 'Mohammed Abdar Chasmawala', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Armaan Vardhan', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Manav J', 'price': 1.0, 'position': 'DEF'}],
        "TIT": [{'full_name': 'Raj Bhadhuria', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Gyan Savir Saldanha', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Yug Nair', 'price': 10.0, 'position': 'GK'}, {'full_name': 'Rahul Sachdev', 'price': 13.0, 'position': 'FWD'}, {'full_name': 'Jeet Antani', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Tanish Jain', 'price': 5.0, 'position': 'DEF'}, {'full_name': 'Kabir Khan', 'price': 11.0, 'position': 'MID'}, {'full_name': 'Param Sabnani', 'price': 11.0, 'position': 'DEF'}, {'full_name': 'Rishabh Lunia', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Manav Gagvani', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Aditya Sandeep Bamb', 'price': 14.0, 'position': 'DEF'}, {'full_name': 'Ishaan Rajnish Jindal', 'price': 11.0, 'position': 'FWD'}, {'full_name': 'Tushar Kant', 'price': 1.0, 'position': 'DEF'}],
        "ROA": [{'full_name': 'Karan Khanna', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Dave Deohans', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Dane Pereira', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Siddharth Castellino', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Ibadur Haque', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Shlok Vyas', 'price': 20.0, 'position': 'MID'}, {'full_name': 'Saheb Singh Satinder Pal Ahuja', 'price': 15.0, 'position': 'DEF'}, {'full_name': 'Kirk Anthony Quadros', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Uzair Patankar', 'price': 17.0, 'position': 'MID'}, {'full_name': 'Nelson Wilfred Aranha', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Srivinayak Shivkumar Tatikonda', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Akshay Karwa', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Abhishek Negi', 'price': 1.0, 'position': 'DEF'}],
        "SAT": [{'full_name': 'Pranit Vyas', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Rohan Jadhav', 'price': 24.0, 'position': 'DEF'}, {'full_name': 'Anirudh Iyer', 'price': 8.0, 'position': 'GK'}, {'full_name': 'Jagdish Lobo', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Rajeev Asija', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Abdur Rehman Noor Mohamed Azeez', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Amogh Sanjeev Jadal', 'price': 11.0, 'position': 'MID'}, {'full_name': 'Nathan Clifton Murzello', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Shrineel Belgaonkar', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Siddharth Rupali Bhonsle', 'price': 9.0, 'position': 'MID'}, {'full_name': 'Inshaal Sheredil Dhanjee', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Shubhrajyoti Das', 'price': 11.0, 'position': 'DEF'}, {'full_name': 'Mathais Coutinho', 'price': 10.0, 'position': 'MID'}],
        "UMA": [{'full_name': 'Titus Andrew Uttankar', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Pranit Vikas Gaikwad', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Yashraj Singh', 'price': 12.0, 'position': 'GK'}, {'full_name': 'Kaif Muneer', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Krish Sharma', 'price': 9.0, 'position': 'MID'}, {'full_name': 'Aneesh Malankar', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Joel Fernandes', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Joshua Vessoakar', 'price': 21.0, 'position': 'DEF'}, {'full_name': 'Shubham Pandey', 'price': 6.0, 'position': 'DEF'}, {'full_name': 'Dhaval Dinesh Savla', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Dev Gupta', 'price': 3.0, 'position': 'MID'}, {'full_name': 'Tejash Pavanjyot Kohli', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Rohil Malankar', 'price': 1.0, 'position': 'FWD'}]
    }

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
    # --- GENERATE THE STATIC SCHEDULE ---
    GAMEWEEK_SCHEDULE = generate_static_schedule(dates=GAMEWEEK_DATES, deadline_hour=17, deadline_minute=0)
    PLAYERS = get_player_data()
    
    db = Prisma()
    await db.connect()
    
    try:
        await clear_data(db)

        print("👤 Seeding admin and test users...")
        users_to_create = [
            {"email": "admin@acesfpl.com", "full_name": "Admin User", "password": "adminPassword", "role": "admin", "is_active": True},
            {"email": "test@example.com", "full_name": "Test User", "password": "password", "role": "user", "is_active": True}
        ]
        for user_data in users_to_create:
            await db.user.create(data={
                "email": user_data["email"], "hashed_password": hash_password(user_data["password"]),
                "role": user_data["role"], "is_active": user_data["is_active"], "full_name": user_data["full_name"],
            })
        print("✅ Users created.")

        print("⚽ Seeding teams and players...")
        await db.team.create_many(data=TEAMS, skip_duplicates=True)
        all_teams = await db.team.find_many()
        team_map_name = {team.name: team.id for team in all_teams}
        team_map_short = {team.short_name: team.id for team in all_teams}
        for short_name, players in PLAYERS.items():
            team_id = team_map_short.get(short_name)
            if team_id:
                await db.player.create_many(data=[{"team_id": team_id, **p} for p in players], skip_duplicates=True)
        print("✅ Teams and players seeded.")

        print("📅 Creating gameweeks with the official schedule...")
        gameweek_data = []
        for gw_num, deadline in GAMEWEEK_SCHEDULE.items():
            gameweek_data.append({"gw_number": gw_num, "deadline": deadline, "status": "UPCOMING"})
        await db.gameweek.create_many(data=gameweek_data)
        print(f"✅ All {len(gameweek_data)} gameweeks created.")

        print("🗓️ Creating fixtures from the official schedule...")
        all_gws = await db.gameweek.find_many()
        gameweek_map = {gw.gw_number: gw.id for gw in all_gws}

        for gw_num, fixtures in FIXTURE_DATA.items():
            gameweek_id = gameweek_map.get(gw_num)
            if gameweek_id:
                fixtures_to_create = []
                for home_name, away_name in fixtures:
                    home_id = team_map_name.get(home_name)
                    away_id = team_map_name.get(away_name)
                    if home_id and away_id:
                        # The kickoff time is the same as the gameweek deadline for simplicity
                        kickoff_time = GAMEWEEK_SCHEDULE.get(gw_num)
                        if kickoff_time:
                            fixtures_to_create.append({
                                "gameweek_id": gameweek_id, "home_team_id": home_id,
                                "away_team_id": away_id, "kickoff": kickoff_time
                            })
                if fixtures_to_create:
                    await db.fixture.create_many(data=fixtures_to_create, skip_duplicates=True)
        print("✅ All fixtures created.")

    except Exception as e:
        print(f"❌ An error occurred during seeding: {e}")
    finally:
        await db.disconnect()
        print("Seeding process complete.")

if __name__ == "__main__":
    asyncio.run(main())

