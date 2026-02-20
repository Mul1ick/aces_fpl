import asyncio
from datetime import datetime, timedelta, timezone
import sys
import os
import traceback
import random

# Add the project root (`backend`) to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prisma import Prisma
from app.auth import hash_password

# --- STATIC DATA (TEAMS, PLAYERS, FIXTURE PAIRINGS) ---

FIXTURE_PAIRINGS = {
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
    # This function contains the corrected player list
    return {
        "SOU": [ {'full_name': 'Cleetus Chandrashekhar', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Aadil Jafferbhoy', 'price': 13.0, 'position': 'DEF'}, {'full_name': 'Mohammedali Rajani', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Alvaro', 'price': 15.0, 'position': 'DEF'}, {'full_name': 'Pranal Shetty', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Anish Bhabdha', 'price': 9.0, 'position': 'FWD'}, {'full_name': 'Aarav Hazari', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Miguel', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Karan', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Akhil Hazari', 'price': 3.0, 'position': 'DEF'}, {'full_name': 'Alejandro Guillermo Banares', 'price': 24.0, 'position': 'DEF'}, {'full_name': 'Divyesh Patel', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Pratham M', 'price': 1.0, 'position': 'DEF'} ],
        "TRA": [ {'full_name': 'Zaid Ansari', 'price': 15.0, 'position': 'FWD'}, {'full_name': 'Hanzalah Mohammed Elyas Kapadia', 'price': 17.0, 'position': 'MID'}, {'full_name': 'Rushab Lakhwani', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Mir Mehta', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Showkat Ansari', 'price': 10.0, 'position': 'DEF'}, {'full_name': 'Tabish Armar', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Aamir Mazhar Ghadially', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Humaid Muazzam Armar', 'price': 7.0, 'position': 'MID'}, {'full_name': 'Aamir Petiwala', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Gufranullah Rizwanullah Khan', 'price': 7.0, 'position': 'FWD'}, {'full_name': 'Mohammed Abdar Chasmawala', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Armaan Vardhan', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Manav J', 'price': 1.0, 'position': 'DEF'} ],
        "TIT": [ {'full_name': 'Raj Bhadhuria', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Gyan Savir Saldanha', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Yug Nair', 'price': 10.0, 'position': 'GK'}, {'full_name': 'Rahul Sachdev', 'price': 13.0, 'position': 'FWD'}, {'full_name': 'Jeet Antani', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Tanish Jain', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Kabir Khan', 'price': 11.0, 'position': 'DEF'}, {'full_name': 'Param Sabnani', 'price': 11.0, 'position': 'MID'}, {'full_name': 'Rishabh Lunia', 'price': 5.0, 'position': 'DEF'}, {'full_name': 'Manav Gagvani', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Aditya Sandeep Bamb', 'price': 14.0, 'position': 'MID'}, {'full_name': 'Ishaan Rajnish Jindal', 'price': 11.0, 'position': 'FWD'}, {'full_name': 'Tushar Kant', 'price': 1.0, 'position': 'DEF'} ],
        "ROA": [ {'full_name': 'Karan Khanna', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Dave Deohans', 'price': 15.0, 'position': 'MID'}, {'full_name': 'Dane Pereira', 'price': 5.0, 'position': 'GK'}, {'full_name': 'Siddharth Castellino', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Ibadur Haque', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Shlok Vyas', 'price': 20.0, 'position': 'MID'}, {'full_name': 'Saheb Singh Satinder Pal Ahuja', 'price': 15.0, 'position': 'DEF'}, {'full_name': 'Kirk Anthony Quadros', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Uzair Patankar', 'price': 17.0, 'position': 'MID'}, {'full_name': 'Nelson Wilfred Aranha', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Srivinayak Shivkumar Tatikonda', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Akshay Karwa', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Abhishek Negi', 'price': 1.0, 'position': 'DEF'} ],
        "SAT": [ {'full_name': 'Pranit Vyas', 'price': 25.0, 'position': 'FWD'}, {'full_name': 'Rohan Jadhav', 'price': 24.0, 'position': 'DEF'}, {'full_name': 'Anirudh Iyer', 'price': 8.0, 'position': 'GK'}, {'full_name': 'Jagdish Lobo', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Rajeev Asija', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Abdur Rehman Noor Mohamed Azeez', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Amogh Sanjeev Jadal', 'price': 11.0, 'position': 'MID'}, {'full_name': 'Nathan Clifton Murzello', 'price': 10.0, 'position': 'MID'}, {'full_name': 'Shrineel Belgaonkar', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Siddharth Rupali Bhonsle', 'price': 9.0, 'position': 'MID'}, {'full_name': 'Inshaal Sheredil Dhanjee', 'price': 1.0, 'position': 'FWD'}, {'full_name': 'Shubhrajyoti Das', 'price': 11.0, 'position': 'DEF'}, {'full_name': 'Mathais Coutinho', 'price': 10.0, 'position': 'MID'} ],
        "UMA": [ {'full_name': 'Titus Andrew Uttankar', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Pranit Vikas Gaikwad', 'price': 10.0, 'position': 'FWD'}, {'full_name': 'Yashraj Singh', 'price': 12.0, 'position': 'GK'}, {'full_name': 'Kaif Muneer', 'price': 25.0, 'position': 'MID'}, {'full_name': 'Krish Sharma', 'price': 9.0, 'position': 'MID'}, {'full_name': 'Aneesh Malankar', 'price': 5.0, 'position': 'FWD'}, {'full_name': 'Joel Fernandes', 'price': 5.0, 'position': 'MID'}, {'full_name': 'Joshua Vessoakar', 'price': 21.0, 'position': 'DEF'}, {'full_name': 'Shubham Pandey', 'price': 6.0, 'position': 'DEF'}, {'full_name': 'Dhaval Dinesh Savla', 'price': 1.0, 'position': 'DEF'}, {'full_name': 'Dev Gupta', 'price': 3.0, 'position': 'MID'}, {'full_name': 'Tejash Pavanjyot Kohli', 'price': 1.0, 'position': 'MID'}, {'full_name': 'Rohil Malankar', 'price': 1.0, 'position': 'FWD'} ]
    }

async def clear_data(db: Prisma):
    print("🧹 Wiping all existing data for a fresh start...")
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
    print("✅ All data wiped successfully.")

async def main() -> None:
    db = Prisma()
    await db.connect()
    
    try:
        # 1. WIPE DATABASE
        await clear_data(db)

        # 2. SEED STATIC DATA (Users, Teams, Players)
        print("👤 Seeding admin user...")
        await db.user.create(data={
            "email": "admin@acesfpl.com", "hashed_password": hash_password("adminPassword"),
            "role": "admin", "is_active": True, "full_name": "Admin User",
        })
        print("✅ Admin user created.")

        print("⚽ Seeding teams and players...")
        await db.team.create_many(data=TEAMS, skip_duplicates=True)
        all_teams = await db.team.find_many()
        team_map_name = {team.name: team.id for team in all_teams}
        team_map_short = {team.short_name: team.id for team in all_teams}
        for short_name, players in get_player_data().items():
            team_id = team_map_short.get(short_name)
            if team_id:
                await db.player.create_many(data=[{"team_id": team_id, **p} for p in players], skip_duplicates=True)
        print("✅ Teams and players seeded.")

        
        # 3. GENERATE AND SEED DYNAMIC SCHEDULE
        print("⏰ Generating custom schedule starting Feb 20, 2026 @ 1:00 PM IST...")
        
        # Define IST Timezone (UTC +5:30)
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        
        # Season start time: Feb 20, 2026 at 2:00 PM IST
        season_start = datetime(2026, 2, 20, 13, 0, 0, tzinfo=ist_tz)
        
        gameweek_data = []
        fixture_data = []

        for gw_num in range(1, 11):
            # Each GW deadline is exactly 30 minutes after the previous one
            deadline = season_start + timedelta(minutes=(gw_num - 1) * 30)
            gameweek_data.append({"gw_number": gw_num, "deadline": deadline, "status": "UPCOMING"})
            print(f"  - Gameweek {gw_num} Deadline set for: {deadline.strftime('%Y-%m-%d %H:%M:%S %Z')}")

            # Set kickoff times for fixtures within this gameweek
            pairings = FIXTURE_PAIRINGS.get(gw_num, [])
            for i, (home_name, away_name) in enumerate(pairings):
                home_id = team_map_name.get(home_name)
                away_id = team_map_name.get(away_name)
                
                # Kickoffs are 5, 7, and 9 minutes past the deadline
                # i=0 -> 5 mins, i=1 -> 7 mins, i=2 -> 9 mins
                kickoff_time = deadline + timedelta(minutes=5 + (i * 2))

                if home_id and away_id:
                    fixture_data.append({
                        "gw_number": gw_num, # Temporary key to link to gameweek
                        "home_team_id": home_id,
                        "away_team_id": away_id, 
                        "kickoff": kickoff_time
                    })

        # Create gameweeks in DB
        await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
        print("✅ All gameweeks created.")

        # Map gameweek numbers to their new database IDs
        all_gws = await db.gameweek.find_many()
        gameweek_map = {gw.gw_number: gw.id for gw in all_gws}
        
        # Add the correct gameweek_id to each fixture
        for fixture in fixture_data:
            fixture["gameweek_id"] = gameweek_map[fixture["gw_number"]]
            del fixture["gw_number"] # Remove the temporary key

        # Create fixtures in DB
        await db.fixture.create_many(data=fixture_data, skip_duplicates=True)
        print("✅ All fixtures created with compressed schedule.")

    except Exception as e:
        print(f"❌ An error occurred during seeding: {e}")
        print("--- Full Traceback ---")
        traceback.print_exc()
        print("----------------------")
    finally:
        await db.disconnect()
        print("\nSeeding process complete. The first deadline is in 10 minutes.")

if __name__ == "__main__":
    asyncio.run(main())