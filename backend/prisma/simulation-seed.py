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
    {"name": "Wolfpack", "short_name": "WOLF"},
    {"name": "Juggernauts", "short_name": "JUG"},
    {"name": "KT Falcons", "short_name": "FAL"},
    {"name": "Encore United", "short_name": "ENC"},
    {"name": "Hybec Hydras", "short_name": "HYD"},
    {"name": "Umang FC", "short_name": "UMG"},
    {"name": "Wasted Potential", "short_name": "WST"},
    {"name": "Cathect FC", "short_name": "CTH"},
    {"name": "Youngblood FC", "short_name": "YBF"},
    {"name": "Trana", "short_name": "TRA"},
    {"name": "Bluelock", "short_name": "BLK"},
    {"name": "Casuals FC", "short_name": "CAS"},
]

# --- FIXTURE MAPPING ---
# Maps the names used in the schedule to the exact names in the TEAMS list
NAME_MAP = {
    "Wolfpack": "Wolfpack",
    "Juggernauts": "Juggernauts",
    "KT Falcons": "KT Falcons",
    "Encore": "Encore United",
    "Hybec Hydras": "Hybec Hydras",
    "Umang FC": "Umang FC",
    "Wasted Potential": "Wasted Potential",
    "Cathect": "Cathect FC",
    "Youngblood": "Youngblood FC",
    "Trana": "Trana",
    "Bluelock": "Bluelock",
    "Casuals": "Casuals FC"
}

# Tuple Structure: (Home, Away, Kickoff_Hour_in_24H_format, Kickoff_Minute)
FIXTURE_PAIRINGS = {
    1: [("Wolfpack", "Juggernauts", 16, 30), ("KT Falcons", "Encore", 17, 30), ("Hybec Hydras", "Umang FC", 18, 30), ("Wasted Potential", "Cathect", 19, 30), ("Youngblood", "Trana", 20, 30), ("Bluelock", "Casuals", 21, 30)],
    2: [("Casuals", "Cathect", 16, 30), ("Bluelock", "Trana", 17, 30), ("Youngblood", "Wasted Potential", 18, 30), ("Umang FC", "Encore", 19, 30), ("Wolfpack", "KT Falcons", 20, 30), ("Hybec Hydras", "Juggernauts", 21, 30)],
    3: [("Hybec Hydras", "Encore", 16, 30), ("Umang FC", "Wolfpack", 17, 30), ("Juggernauts", "KT Falcons", 18, 30), ("Casuals", "Youngblood", 19, 30), ("Bluelock", "Cathect", 20, 30), ("Trana", "Wasted Potential", 21, 30)],
    4: [("Bluelock", "Youngblood", 16, 30), ("Wasted Potential", "Casuals", 17, 30), ("Cathect", "Trana", 18, 30), ("Hybec Hydras", "Wolfpack", 19, 30), ("Encore", "Juggernauts", 20, 30), ("KT Falcons", "Umang FC", 21, 30)],
    5: [("Juggernauts", "Umang FC", 16, 30), ("Encore", "Wolfpack", 17, 30), ("Hybec Hydras", "KT Falcons", 18, 30), ("Trana", "Casuals", 19, 30), ("Bluelock", "Wasted Potential", 20, 30), ("Cathect", "Youngblood", 21, 30)],
    6: [("Trana", "Youngblood", 16, 30), ("Cathect", "Wasted Potential", 17, 30), ("Casuals", "Bluelock", 18, 30), ("Juggernauts", "Wolfpack", 19, 30), ("Umang FC", "Hybec Hydras", 20, 30), ("Encore", "KT Falcons", 21, 30)],
    7: [("KT Falcons", "Wolfpack", 16, 30), ("Encore", "Umang FC", 17, 30), ("Juggernauts", "Hybec Hydras", 18, 30), ("Trana", "Bluelock", 19, 30), ("Wasted Potential", "Youngblood", 20, 30), ("Cathect", "Casuals", 21, 30)],
    8: [("Wasted Potential", "Trana", 16, 30), ("Cathect", "Bluelock", 17, 30), ("Youngblood", "Casuals", 18, 30), ("KT Falcons", "Juggernauts", 19, 30), ("Encore", "Hybec Hydras", 20, 30), ("Wolfpack", "Umang FC", 21, 30)],
    9: [("KT Falcons", "Hybec Hydras", 16, 30), ("Umang FC", "Juggernauts", 17, 30), ("Wolfpack", "Encore", 18, 30), ("Casuals", "Trana", 19, 30), ("Youngblood", "Cathect", 20, 30), ("Wasted Potential", "Bluelock", 21, 30)],
    10: [("Juggernauts", "Encore", 17, 0), ("Youngblood", "Bluelock", 17, 0), ("Umang FC", "KT Falcons", 17, 0), ("Trana", "Cathect", 17, 0), ("Wolfpack", "Hybec Hydras", 17, 0), ("Casuals", "Wasted Potential", 17, 0)],
}

def get_player_data():
    # Adjusted keys to use new team abbreviations for dummy data seeding
    return {
        "TRA": [
            {"full_name": "Tabish Armar", "price": 5.0, "position": "MID"},
            {"full_name": "Wren Dabreo", "price": 10.0, "position": "GK"},
            {"full_name": "Abdaar Chashmawala", "price": 10.0, "position": "DEF"},
            {"full_name": "Zaid Ansari", "price": 25.0, "position": "MID"},
            {"full_name": "Mohammed Mojawala", "price": 20.0, "position": "FWD"},
            {"full_name": "Showkat Ansari", "price": 10.0, "position": "DEF"},
            {"full_name": "Saarim Khan", "price": 1.0, "position": "MID"},
            {"full_name": "Saif Shaikh", "price": 30.0, "position": "DEF"},
            {"full_name": "Naman Modi", "price": 3.0, "position": "FWD"},
            {"full_name": "Mustafa Patanwala", "price": 1.0, "position": "MID"},
            {"full_name": "Furqaan Batliwala", "price": 1.0, "position": "FWD"},
            {"full_name": "Vishal Gore", "price": 12.0, "position": "DEF"},
            {"full_name": "Raihan Mondal", "price": 1.0, "position": "DEF"},
        ],
        "CAS": [
            {"full_name": "Sarthak Dhandaria", "price": 10.0, "position": "DEF"},
            {"full_name": "Samriddh Jain", "price": 10.0, "position": "GK"},
            {"full_name": "Rajin Mehta", "price": 15.0, "position": "MID"},
            {"full_name": "Ishan Jindal", "price": 20.0, "position": "FWD"},
            {"full_name": "Karan Dave", "price": 15.0, "position": "DEF"},
            {"full_name": "Shayaan Bilwala", "price": 10.0, "position": "DEF"},
            {"full_name": "Divij Mehta", "price": 5.0, "position": "MID"},
            {"full_name": "Girish Kamath", "price": 15.0, "position": "MID"},
            {"full_name": "Aryan Hukumchand", "price": 31.0, "position": "DEF"},
            {"full_name": "Arsh Sadh", "price": 1.0, "position": "MID"},
            {"full_name": "Shanay Gandhi", "price": 1.0, "position": "MID"},
            {"full_name": "Sachin Jaiswar", "price": 1.0, "position": "DEF"},
            {"full_name": "Raghav Agarwal", "price": 1.0, "position": "FWD"},
        ],
        "BLK": [
            {"full_name": "Ibadur Haque", "price": 5.0, "position": "FWD"},
            {"full_name": "Aditya Mookulmarathur", "price": 5.0, "position": "GK"},
            {"full_name": "Siddharth Castelino", "price": 10.0, "position": "DEF"},
            {"full_name": "Utsav Bachani", "price": 15.0, "position": "DEF"},
            {"full_name": "Kaif Muneer", "price": 15.0, "position": "MID"},
            {"full_name": "Yash Pathak", "price": 15.0, "position": "DEF"},
            {"full_name": "Samay Ved", "price": 15.0, "position": "MID"},
            {"full_name": "Dave Deohans", "price": 20.0, "position": "FWD"},
            {"full_name": "Rishabh Lunia", "price": 5.0, "position": "DEF"},
            {"full_name": "Shaurya Bhandari", "price": 9.0, "position": "DEF"},
            {"full_name": "Aman Arora", "price": 4.0, "position": "DEF"},
            {"full_name": "Suyash Samat", "price": 3.0, "position": "DEF"},
            {"full_name": "Siddhesh Naringrekar", "price": 10.0, "position": "MID"},
        ],
        "HYD": [
            {"full_name": "Manav Manshani", "price": 5.0, "position": "DEF"},
            {"full_name": "Tilak Patel", "price": 5.0, "position": "DEF"},
            {"full_name": "Sarthak Arora", "price": 5.0, "position": "MID"},
            {"full_name": "Aditya Rawtani", "price": 15.0, "position": "MID"},
            {"full_name": "Aryan Jain", "price": 15.0, "position": "MID"},
            {"full_name": "Yasir Arafat", "price": 15.0, "position": "GK"},
            {"full_name": "Rivan Rajesh", "price": 10.0, "position": "FWD"},
            {"full_name": "Rohit Tejwani", "price": 5.0, "position": "DEF"},
            {"full_name": "Raj Mehta", "price": 1.0, "position": "FWD"},
            {"full_name": "Dhairya Masaun", "price": 13.0, "position": "FWD"},
            {"full_name": "Adil Kanani", "price": 11.0, "position": "DEF"},
            {"full_name": "Abir Mayekar", "price": 9.0, "position": "FWD"},
            {"full_name": "Smeet Shinde", "price": 1.0, "position": "FWD"},
        ],
        "WOLF": [
            {"full_name": "Nachiket Dandekar", "price": 5.0, "position": "MID"},
            {"full_name": "Shreyan Tito", "price": 15.0, "position": "DEF"},
            {"full_name": "Josiah Noronha", "price": 25.0, "position": "MID"},
            {"full_name": "Raunakjay Killinger", "price": 17.0, "position": "MID"},
            {"full_name": "Tushar Chibber", "price": 15.0, "position": "FWD"},
            {"full_name": "Royston Veigas", "price": 24.0, "position": "FWD"},
            {"full_name": "Ashish Ramaswamy", "price": 15.0, "position": "DEF"},
            {"full_name": "Jai Sanghvi", "price": 6.0, "position": "DEF"},
            {"full_name": "Laksh Chand", "price": 2.0, "position": "DEF"},
            {"full_name": "Avijit Chhowala", "price": 2.0, "position": "FWD"},
            {"full_name": "Jahan Bativala", "price": 1.0, "position": "FWD"},
            {"full_name": "Valerian Andrade", "price": 1.0, "position": "GK"},
            {"full_name": "Aslam Khan", "price": 1.0, "position": "DEF"},
        ],
        "WST": [
            {"full_name": "Manav Gagvani", "price": 5.0, "position": "MID"},
            {"full_name": "Aryan Sher", "price": 15.0, "position": "MID"},
            {"full_name": "Varun Gupta", "price": 15.0, "position": "DEF"},
            {"full_name": "John Roy", "price": 15.0, "position": "DEF"},
            {"full_name": "Joshua Narde", "price": 10.0, "position": "GK"},
            {"full_name": "Aakash Banerjee", "price": 20.0, "position": "FWD"},
            {"full_name": "Samarveer Dalal", "price": 15.0, "position": "MID"},
            {"full_name": "Kabir Kumar", "price": 15.0, "position": "FWD"},
            {"full_name": "Dhruv Achappa", "price": 15.0, "position": "MID"},
            {"full_name": "Aarin", "price": 3.0, "position": "FWD"},
            {"full_name": "Aaroh Patwardhan", "price": 1.0, "position": "DEF"},
            {"full_name": "Atharva Gandhi", "price": 1.0, "position": "DEF"},
            {"full_name": "Ujwal D", "price": 1.0, "position": "MID"},
        ],
        "UMG": [
            {"full_name": "Joel Fernandes", "price": 5.0, "position": "MID"},
            {"full_name": "Aneesh Malankar", "price": 5.0, "position": "FWD"},
            {"full_name": "Rohan Jadhav", "price": 10.0, "position": "DEF"},
            {"full_name": "Yashraj Singh", "price": 10.0, "position": "GK"},
            {"full_name": "Anmol Pathak", "price": 10.0, "position": "MID"},
            {"full_name": "Deepam Anchan", "price": 10.0, "position": "DEF"},
            {"full_name": "Brett Rodrigues", "price": 15.0, "position": "FWD"},
            {"full_name": "Brenden Pires", "price": 15.0, "position": "MID"},
            {"full_name": "Siddhanth Kripalani", "price": 17.0, "position": "MID"},
            {"full_name": "Ashley Greshom", "price": 20.0, "position": "MID"},
            {"full_name": "Atish Ladi", "price": 12.0, "position": "DEF"},
            {"full_name": "Rajeev Asija", "price": 5.0, "position": "DEF"},
            {"full_name": "Rohil Malankar", "price": 1.0, "position": "FWD"},
        ],
        "JUG": [
            {"full_name": "Vijayeshwar Battula", "price": 5.0, "position": "DEF"},
            {"full_name": "Lakshya Sharma", "price": 15.0, "position": "FWD"},
            {"full_name": "Sanskar Shetty", "price": 15.0, "position": "DEF"},
            {"full_name": "Naytik Vora", "price": 15.0, "position": "MID"},
            {"full_name": "Jatin Khilani", "price": 17.0, "position": "FWD"},
            {"full_name": "Prathamesh Vishwakarma", "price": 25.0, "position": "DEF"},
            {"full_name": "Shanay Shah", "price": 14.0, "position": "MID"},
            {"full_name": "Tristan Dsouza", "price": 10.0, "position": "FWD"},
            {"full_name": "Dhyaan Lilani", "price": 5.0, "position": "DEF"},
            {"full_name": "Arkin Isharani", "price": 4.0, "position": "MID"},
            {"full_name": "Shvetank Hansal", "price": 2.0, "position": "FWD"},
            {"full_name": "Moiz Shaikh", "price": 1.0, "position": "GK"},
            {"full_name": "Kushal Singh", "price": 1.0, "position": "DEF"},
        ],
        "ENC": [
            {"full_name": "Kabir Khan", "price": 10.0, "position": "DEF"},
            {"full_name": "Param Sabnani", "price": 5.0, "position": "MID"},
            {"full_name": "Aamir Petiwala", "price": 5.0, "position": "FWD"},
            {"full_name": "Krish Sharma", "price": 5.0, "position": "MID"},
            {"full_name": "Aarman Vardhan", "price": 10.0, "position": "MID"},
            {"full_name": "Brooklyn Robinson", "price": 10.0, "position": "GK"},
            {"full_name": "Mir Mehta", "price": 25.0, "position": "MID"},
            {"full_name": "Clivert Miller", "price": 15.0, "position": "MID"},
            {"full_name": "Rayan Badheka", "price": 10.0, "position": "DEF"},
            {"full_name": "Agasteya Khanduri", "price": 19.0, "position": "MID"},
            {"full_name": "Zahan Cassum", "price": 11.0, "position": "DEF"},
            {"full_name": "Krish Hatiramani", "price": 9.0, "position": "FWD"},
            {"full_name": "Anshul Saboo", "price": 1.0, "position": "DEF"},
        ],
        "FAL": [
            {"full_name": "Kanav Sachdev", "price": 15.0, "position": "DEF"},
            {"full_name": "Rohan Shukla", "price": 33.0, "position": "FWD"},
            {"full_name": "Ansari Aaqif", "price": 13.0, "position": "GK"},
            {"full_name": "Dev Gupta", "price": 12.0, "position": "FWD"},
            {"full_name": "Shivraj Shekhawat", "price": 11.0, "position": "DEF"},
            {"full_name": "Mohit Thakurel", "price": 10.0, "position": "MID"},
            {"full_name": "Ethan White", "price": 8.0, "position": "FWD"},
            {"full_name": "Avanish Patil", "price": 8.0, "position": "DEF"},
            {"full_name": "Manav Nagvekar", "price": 7.0, "position": "DEF"},
            {"full_name": "Taha Khan", "price": 6.0, "position": "DEF"},
            {"full_name": "Aasim A", "price": 5.0, "position": "MID"},
            {"full_name": "Mohammad Saif", "price": 3.0, "position": "DEF"},
            {"full_name": "Freeman Fernandes", "price": 4.0, "position": "FWD"},
        ],
        "YBF": [
            {"full_name": "Rian Sen Katoch", "price": 15.0, "position": "FWD"},
            {"full_name": "Neil Thakkar", "price": 5.0, "position": "MID"},
            {"full_name": "Krish Kohal", "price": 5.0, "position": "MID"},
            {"full_name": "Shanay Jariwala", "price": 15.0, "position": "DEF"},
            {"full_name": "Abhedya Gupte", "price": 15.0, "position": "FWD"},
            {"full_name": "Sahil Khan", "price": 15.0, "position": "FWD"},
            {"full_name": "Awnan Khan", "price": 15.0, "position": "MID"},
            {"full_name": "Navjot Pable", "price": 5.0, "position": "DEF"},
            {"full_name": "Daivik Shah", "price": 15.0, "position": "GK"},
            {"full_name": "Karm Mulchandani", "price": 7.0, "position": "MID"},
            {"full_name": "Reza Nekooi", "price": 5.0, "position": "DEF"},
            {"full_name": "Abizer Mansawala", "price": 3.0, "position": "DEF"},
            {"full_name": "Arush Kanabar", "price": 1.0, "position": "DEF"},
        ],
        "CTH": [
            {"full_name": "Vikram Singh", "price": 5.0, "position": "FWD"},
            {"full_name": "Aarya Kotwal", "price": 5.0, "position": "DEF"},
            {"full_name": "Karun Jhangiani", "price": 10.0, "position": "DEF"},
            {"full_name": "Karan Shankpal", "price": 15.0, "position": "MID"},
            {"full_name": "Kushal Dukale", "price": 15.0, "position": "MID"},
            {"full_name": "Aditya Gidwani", "price": 15.0, "position": "MID"},
            {"full_name": "Ethan Fernandes", "price": 20.0, "position": "FWD"},
            {"full_name": "Aarav Hazari", "price": 20.0, "position": "MID"},
            {"full_name": "Melroy Dsa", "price": 10.0, "position": "GK"},
            {"full_name": "Lazarus Swami", "price": 6.0, "position": "DEF"},
            {"full_name": "Abhishek Shah", "price": 4.0, "position": "DEF"},
            {"full_name": "Gatik Sen", "price": 2.0, "position": "MID"},
            {"full_name": "Amogh Poojari", "price": 1.0, "position": "DEF"},
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
                # Add players
                await db.player.create_many(data=[{"team_id": team_id, **p} for p in players], skip_duplicates=True)
            else:
                print(f"⚠️ Warning: Could not find team ID for {short_name}")
                
        print("✅ Teams and players seeded.")

        
        # 4. GENERATE TEST SCHEDULE
        print("⏰ Generating TEST schedule: Starting Sep 21, 2026, 2:00 PM IST.")
        
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        
        # --- HARDCODED TARGET TIME ---
        start_time = datetime(2026, 9, 21, 14, 0, 0, tzinfo=ist_tz)
        
        gw_interval = timedelta(minutes=20)
        match_interval = timedelta(minutes=2)
        
        gameweek_data = []
        fixture_data = []

        for gw_num in range(1, 11):
            # Calculate Deadline
            deadline = start_time + ((gw_num - 1) * gw_interval)
            
            gameweek_data.append({
                "gw_number": gw_num, 
                "deadline": deadline, 
                "status": "UPCOMING"
            })
            print(f"  - Gameweek {gw_num} Deadline: {deadline.strftime('%Y-%m-%d %H:%M:%S %Z')}")

            # Get Pairings for this GW
            pairings = FIXTURE_PAIRINGS.get(gw_num, [])
            
            for i, (home_raw, away_raw, *_) in enumerate(pairings):
                home_real_name = NAME_MAP.get(home_raw)
                away_real_name = NAME_MAP.get(away_raw)

                if not home_real_name or not away_real_name:
                    print(f"❌ Error: Could not map team names '{home_raw}' or '{away_raw}'")
                    continue

                home_id = team_map_name.get(home_real_name)
                away_id = team_map_name.get(away_real_name)
                
                # Kickoff Staggering: Start exactly at deadline, staggered by 2 minutes
                kickoff_time = deadline + (i * match_interval)

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

        # Map gameweek numbers to their new database IDs
        all_gws = await db.gameweek.find_many()
        gameweek_map = {gw.gw_number: gw.id for gw in all_gws}
        
        # Add the correct gameweek_id to each fixture
        for fixture in fixture_data:
            fixture["gameweek_id"] = gameweek_map[fixture["gw_number"]]
            del fixture["gw_number"] # Remove the temporary key

        # Create fixtures in DB
        await db.fixture.create_many(data=fixture_data, skip_duplicates=True)
        print("✅ All fixtures created with Fast-Paced Test Schedule (2 min stagger).")

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
