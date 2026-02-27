import asyncio
from datetime import datetime, timedelta, timezone
import sys
import os
import traceback

# Add the project root (`backend`) to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from prisma import Prisma
from app.auth import hash_password

# --- TEAM DEFINITIONS ---
TEAMS = [
    {"name": "Aer Titans", "short_name": "AER"},
    {"name": "Casuals FC", "short_name": "CAS"},
    {"name": "Cathect", "short_name": "CAT"},
    {"name": "Encore United", "short_name": "ENC"},
    {"name": "Matero Power 8s", "short_name": "MAT"},
    {"name": "Majithia Reality FC", "short_name": "MRFC"},
    {"name": "Roarers", "short_name": "ROA"},
    {"name": "Satans", "short_name": "SAT"},
    {"name": "Trana", "short_name": "TRA"},
    {"name": "Umang", "short_name": "UMA"},
    {"name": "Wolfpack FC", "short_name": "WOLF"},
    {"name": "Youngblood FC", "short_name": "YBFC"},
]

# --- FIXTURE MAPPING ---
NAME_MAP = {
    "Trana": "Trana",
    "Satans": "Satans",
    "MRFC": "Majithia Reality FC",
    "Matero": "Matero Power 8s",
    "Casuals Fc": "Casuals FC",
    "Wolfpack": "Wolfpack FC",
    "Umang": "Umang",
    "Cathect": "Cathect",
    "Aer Titans": "Aer Titans",
    "Youngblood": "Youngblood FC",
    "Encore": "Encore United",
    "Roarers": "Roarers"
}

# --- PAIRINGS (From your list) ---
FIXTURE_PAIRINGS = {
    1: [("Trana", "Satans"), ("MRFC", "Matero"), ("Casuals Fc", "Wolfpack"), ("Umang", "Cathect"), ("Aer Titans", "Youngblood"), ("Encore", "Roarers")],
    2: [("Trana", "Matero"), ("Satans", "Wolfpack"), ("MRFC", "Casuals Fc"), ("Umang", "Youngblood"), ("Cathect", "Roarers"), ("Aer Titans", "Encore")],
    3: [("Trana", "Wolfpack"), ("Matero", "Casuals Fc"), ("Satans", "MRFC"), ("Umang", "Roarers"), ("Youngblood", "Encore"), ("Cathect", "Aer Titans")],
    4: [("Trana", "Casuals Fc"), ("Wolfpack", "MRFC"), ("Matero", "Satans"), ("Umang", "Encore"), ("Roarers", "Aer Titans"), ("Youngblood", "Cathect")],
    5: [("Trana", "MRFC"), ("Casuals Fc", "Satans"), ("Wolfpack", "Matero"), ("Umang", "Aer Titans"), ("Encore", "Cathect"), ("Roarers", "Youngblood")],
    6: [("Satans", "Trana"), ("Matero", "MRFC"), ("Wolfpack", "Casuals Fc"), ("Cathect", "Umang"), ("Youngblood", "Aer Titans"), ("Roarers", "Encore")],
    7: [("Matero", "Trana"), ("Wolfpack", "Satans"), ("Casuals Fc", "MRFC"), ("Youngblood", "Umang"), ("Roarers", "Cathect"), ("Encore", "Aer Titans")],
    8: [("Wolfpack", "Trana"), ("Casuals Fc", "Matero"), ("MRFC", "Satans"), ("Roarers", "Umang"), ("Encore", "Youngblood"), ("Aer Titans", "Cathect")],
    9: [("Casuals Fc", "Trana"), ("MRFC", "Wolfpack"), ("Satans", "Matero"), ("Encore", "Umang"), ("Aer Titans", "Roarers"), ("Cathect", "Youngblood")],
    10: [("MRFC", "Trana"), ("Satans", "Casuals Fc"), ("Matero", "Wolfpack"), ("Aer Titans", "Umang"), ("Cathect", "Encore"), ("Youngblood", "Roarers")],
}

def get_player_data():
    return {
        "AER": [
            {'full_name': 'Param Sabnani', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Kabir Khan', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Krish', 'price': 5.0, 'position': 'FWD'},
            {'full_name': 'Ishaan Jindal', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Rajin Mehta', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Brooklyn Robinson', 'price': 5.0, 'position': 'GK'},
        ],
        "CAS": [
            {'full_name': 'Sarthak Dhandharia', 'price': 15.0, 'position': 'DEF'},
            {'full_name': 'Kavan Machiah', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Samriddh Jain', 'price': 15.0, 'position': 'GK'},
            {'full_name': 'Aranyah Tara', 'price': 15.0, 'position': 'FWD'},
            {'full_name': 'Shayan Billawala', 'price': 15.0, 'position': 'DEF'},
            {'full_name': 'Clivert Millar', 'price': 25.0, 'position': 'FWD'},
        ],
        "CAT": [
            {'full_name': 'Vikram Singh', 'price': 5.0, 'position': 'FWD'},
            {'full_name': 'Kunal Deshmukh', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Paresh Mallesha', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Udayan Badhekar', 'price': 5.0, 'position': 'DEF'},
        ],
        "ENC": [
            {'full_name': 'Aamir Petiwala', 'price': 5.0, 'position': 'GK'},
            {'full_name': 'Aamir Ghadially', 'price': 10.0, 'position': 'MID'},
            {'full_name': 'Siddhant Mehta', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Mir Mehta', 'price': 30.0, 'position': 'MID'},
            {'full_name': 'Mikhail Kazi', 'price': 25.0, 'position': 'DEF'},
            {'full_name': 'Harmeet Vig', 'price': 15.0, 'position': 'DEF'},
        ],
        "MAT": [
            {'full_name': 'Shaurya Bhandari', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Dave Deohans', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Siddharth Castelino', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Kaif Muneer', 'price': 15.0, 'position': 'FWD'},
            {'full_name': 'Shlok Tiwari', 'price': 10.0, 'position': 'MID'},
            {'full_name': 'Aman Kawde', 'price': 10.0, 'position': 'FWD'},
        ],
        "MRFC": [
            {'full_name': 'Harsh Majithia', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Kurt Baptista', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Anshumaan Kharga', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Vedant Mungee', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Mohammed Lakdawala', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Kirsten Gonsalves', 'price': 15.0, 'position': 'MID'},
        ],
        "ROA": [
            {'full_name': 'Ibadur Rehman', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Obaidur Haque', 'price': 5.0, 'position': 'GK'},
            {'full_name': 'Nathan Murzello', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Vignesh Angadi', 'price': 15.0, 'position': 'DEF'},
            {'full_name': 'Siddharth Bhonsle', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Ian Dsilva', 'price': 5.0, 'position': 'DEF'},
        ],
        "SAT": [
            {'full_name': 'Rajeev Asija', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Aryan Sher', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Pranit Vyas', 'price': 25.0, 'position': 'FWD'},
            {'full_name': 'Rohan Jadhav', 'price': 25.0, 'position': 'DEF'},
            {'full_name': 'Viral Mandalia', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Joshua Narde', 'price': 7.0, 'position': 'GK'},
        ],
        "TRA": [
            {'full_name': 'Tabish Armar', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Humaid Armar', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Zaid Ansari', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Showkat Ansari', 'price': 15.0, 'position': 'DEF'},
            {'full_name': 'Mohammed Mojawala', 'price': 15.0, 'position': 'FWD'},
            {'full_name': "Wren D'Abreo", 'price': 15.0, 'position': 'GK'},
            {'full_name': 'Floyd Dharmai', 'price': 25.0, 'position': 'MID'},
        ],
        "UMA": [
            {'full_name': 'Joel Fernandes', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Aneesh Malankar', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Yashraj Singh', 'price': 15.0, 'position': 'GK'},
            {'full_name': 'Dale Dcunha', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Brett Rodrigues', 'price': 15.0, 'position': 'FWD'},
            {'full_name': 'Raj Bhaduria', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Rakesh Patne', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Aakash Nair', 'price': 10.0, 'position': 'DEF'},
        ],
        "WOLF": [
            {'full_name': 'Abishek V Nambiar', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Nachiket Dandekar', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Kartik Shetty', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Dharmendra Bhurji', 'price': 5.0, 'position': 'DEF'},
            {'full_name': 'Milan Kepchaki', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Tushar Chhibber', 'price': 15.0, 'position': 'FWD'},
        ],
        "YBFC": [
            {'full_name': 'Karm Mulchandani', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Awnan Khan', 'price': 25.0, 'position': 'MID'},
            {'full_name': 'Neil Thakkar', 'price': 15.0, 'position': 'MID'},
            {'full_name': 'Krish Kohal', 'price': 5.0, 'position': 'MID'},
            {'full_name': 'Sarthak Arora', 'price': 7.0, 'position': 'MID'},
            {'full_name': 'Aayushman Dwivedi', 'price': 10.0, 'position': 'FWD'},
            {'full_name': 'Navjot Singh Pable', 'price': 10.0, 'position': 'DEF'},
            {'full_name': 'Tanishk Sarawgi', 'price': 5.0, 'position': 'GK'},
        ],
    }

async def clear_data(db: Prisma):
    print("🧹 Wiping all existing data for a fresh start...")
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

        # 2. SEED ADMIN USER
        print("👤 Seeding admin user...")
        await db.user.create(data={
            "email": "admin@acesfpl.com", 
            "hashed_password": hash_password("adminPassword"),
            "role": "admin", 
            "is_active": True, 
            "full_name": "Admin User",
        })
        print("✅ Admin user created.")

        # 3. SEED TEAMS AND PLAYERS
        print("⚽ Seeding teams and players...")
        await db.team.create_many(data=TEAMS, skip_duplicates=True)
        all_teams = await db.team.find_many()
        
        team_map_short = {team.short_name: team.id for team in all_teams}
        team_map_name = {team.name: team.id for team in all_teams} 

        for short_name, players in get_player_data().items():
            team_id = team_map_short.get(short_name)
            if team_id:
                await db.player.create_many(data=[{"team_id": team_id, **p} for p in players], skip_duplicates=True)
            else:
                print(f"⚠️ Warning: Could not find team ID for {short_name}")
                
        print("✅ Teams and players seeded.")

        
        # 4. GENERATE REAL SCHEDULE
        print("⏰ Generating specific match schedule...")
        
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        
        # --- DEFINED MATCH DATES (Year 2026 based on Sunday dates) ---
        # If today is before 2026, these are all UPCOMING.
        
        MATCH_DATES = {
            1: datetime(2026, 3, 15, 13, 0, 0, tzinfo=ist_tz), # Sunday
            2: datetime(2026, 3, 22, 13, 0, 0, tzinfo=ist_tz), # Sunday
            3: datetime(2026, 3, 28, 13, 0, 0, tzinfo=ist_tz), # Saturday
            4: datetime(2026, 4, 12, 13, 0, 0, tzinfo=ist_tz), # Sunday
            5: datetime(2026, 4, 19, 13, 0, 0, tzinfo=ist_tz), # Sunday
            6: datetime(2026, 4, 26, 13, 0, 0, tzinfo=ist_tz), # Sunday
            7: datetime(2026, 5, 3, 13, 0, 0, tzinfo=ist_tz),  # Sunday
            8: datetime(2026, 5, 10, 13, 0, 0, tzinfo=ist_tz), # Sunday
            9: datetime(2026, 5, 17, 13, 0, 0, tzinfo=ist_tz), # Sunday
            10: datetime(2026, 5, 24, 13, 0, 0, tzinfo=ist_tz), # Sunday
        }
        
        gameweek_data = []
        fixture_data = []

        for gw_num in range(1, 11):
            deadline = MATCH_DATES.get(gw_num)
            
            if not deadline:
                print(f"Skipping GW {gw_num}: No date defined.")
                continue

            gameweek_data.append({
                "gw_number": gw_num, 
                "deadline": deadline, 
                "status": "UPCOMING"
            })
            print(f"  - Gameweek {gw_num} Deadline: {deadline.strftime('%a %d %b %Y, %H:%M')}")

            pairings = FIXTURE_PAIRINGS.get(gw_num, [])
            
            for i, (home_raw, away_raw) in enumerate(pairings):
                home_real_name = NAME_MAP.get(home_raw)
                away_real_name = NAME_MAP.get(away_raw)

                if not home_real_name or not away_real_name:
                    print(f"❌ Error: Could not map team names '{home_raw}' or '{away_raw}'")
                    continue

                home_id = team_map_name.get(home_real_name)
                away_id = team_map_name.get(away_real_name)
                
                # Kickoff Staggering:
                # Matches kick off 2, 4, 6, 8, 10, 12 mins after the deadline.
                # This keeps them close to the day's event start.
                kickoff_time = deadline + timedelta(minutes=2 + (i * 2))

                if home_id and away_id:
                    fixture_data.append({
                        "gw_number": gw_num, 
                        "home_team_id": home_id,
                        "away_team_id": away_id, 
                        "kickoff": kickoff_time
                    })

        # Create gameweeks in DB
        await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
        print("✅ All gameweeks created.")

        all_gws = await db.gameweek.find_many()
        gameweek_map = {gw.gw_number: gw.id for gw in all_gws}
        
        for fixture in fixture_data:
            fixture["gameweek_id"] = gameweek_map[fixture["gw_number"]]
            del fixture["gw_number"]

        await db.fixture.create_many(data=fixture_data, skip_duplicates=True)
        print("✅ All fixtures created with Specific Dates.")

    except Exception as e:
        print(f"❌ An error occurred during seeding: {e}")
        print("--- Full Traceback ---")
        traceback.print_exc()
        print("----------------------")
    finally:
        await db.disconnect()
        print("\nSeeding process complete.")

if __name__ == "__main__":
    asyncio.run(main())