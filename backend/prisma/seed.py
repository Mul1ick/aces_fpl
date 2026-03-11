# import asyncio
# from datetime import datetime, timedelta, timezone
# import sys
# import os
# import traceback

# # Add the project root (`backend`) to the Python path
# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# from prisma import Prisma
# from app.auth import hash_password

# # --- TEAM DEFINITIONS ---
# TEAMS = [
#     {"name": "Aer Titans", "short_name": "AER"},
#     {"name": "Casuals FC", "short_name": "CAS"},
#     {"name": "Cathect", "short_name": "CAT"},
#     {"name": "Encore United", "short_name": "ENC"},
#     {"name": "Matero Power 8s", "short_name": "MAT"},
#     {"name": "Majithia Reality FC", "short_name": "MRFC"},
#     {"name": "Roarers", "short_name": "ROA"},
#     {"name": "Satans", "short_name": "SAT"},
#     {"name": "Trana", "short_name": "TRA"},
#     {"name": "Umang", "short_name": "UMA"},
#     {"name": "Wolfpack FC", "short_name": "WOLF"},
#     {"name": "Youngblood FC", "short_name": "YBFC"},
# ]

# # --- FIXTURE MAPPING ---
# NAME_MAP = {
#     "Trana": "Trana",
#     "Satans": "Satans",
#     "MRFC": "Majithia Reality FC",
#     "Matero": "Matero Power 8s",
#     "Casuals FC": "Casuals FC",
#     "Casuals Fc": "Casuals FC", # Fallback for lowercase 'c'
#     "Wolfpack": "Wolfpack FC",
#     "Umang": "Umang",
#     "Cathect": "Cathect",
#     "Aer Titans": "Aer Titans",
#     "Youngblood": "Youngblood FC",
#     "Encore": "Encore United",
#     "Roarers": "Roarers"
# }

# # Tuple Structure: (Home, Away, Kickoff_Hour_in_24H_format)
# FIXTURE_PAIRINGS = {
#     1: [("Aer Titans", "Youngblood", 16), ("MRFC", "Matero", 17), ("Casuals FC", "Wolfpack", 18), ("Umang", "Cathect", 19), ("Encore", "Roarers", 20), ("Trana", "Satans", 21)],
#     2: [("Umang", "Youngblood", 16), ("Cathect", "Roarers", 17), ("Aer Titans", "Encore", 18), ("Satans", "Wolfpack", 19), ("Trana", "Matero", 20), ("MRFC", "Casuals FC", 21)],
#     3: [("Matero", "Casuals FC", 16), ("Satans", "MRFC", 17), ("Trana", "Wolfpack", 18), ("Cathect", "Aer Titans", 19), ("Umang", "Roarers", 20), ("Youngblood", "Encore", 21)],
#     4: [("Umang", "Encore", 16), ("Roarers", "Aer Titans", 17), ("Youngblood", "Cathect", 18), ("Trana", "Casuals FC", 19), ("Wolfpack", "MRFC", 20), ("Matero", "Satans", 21)],
#     5: [("Casuals FC", "Satans", 16), ("Wolfpack", "Matero", 17), ("Trana", "MRFC", 18), ("Roarers", "Youngblood", 19), ("Encore", "Cathect", 20), ("Umang", "Aer Titans", 21)],
#     6: [("Roarers", "Encore", 16), ("Cathect", "Umang", 17), ("Satans", "Trana", 18), ("Matero", "MRFC", 19), ("Wolfpack", "Casuals FC", 20), ("Youngblood", "Aer Titans", 21)],
#     7: [("Matero", "Trana", 16), ("Casuals FC", "MRFC", 17), ("Wolfpack", "Satans", 18), ("Youngblood", "Umang", 19), ("Encore", "Aer Titans", 20), ("Roarers", "Cathect", 21)],
#     8: [("Aer Titans", "Cathect", 16), ("Encore", "Youngblood", 17), ("Roarers", "Umang", 18), ("Casuals FC", "Matero", 19), ("MRFC", "Satans", 20), ("Wolfpack", "Trana", 21)],
#     9: [("MRFC", "Wolfpack", 16), ("Casuals FC", "Trana", 17), ("Satans", "Matero", 18), ("Aer Titans", "Roarers", 19), ("Cathect", "Youngblood", 20), ("Encore", "Umang", 21)],
#     10: [("Cathect", "Encore", 18), ("Youngblood", "Roarers", 18), ("Aer Titans", "Umang", 18), ("Matero", "Wolfpack", 18), ("MRFC", "Trana", 18), ("Satans", "Casuals FC", 18)],
# }

# def get_player_data():
#     return {
#         "TRA": [
#             {"full_name": "Tabish Armar", "price": 5.0, "position": "MID"},
#             {"full_name": "Zaid Ansari", "price": 25.0, "position": "MID"},
#             {"full_name": "Showkat Ansari", "price": 15.0, "position": "DEF"},
#             {"full_name": "Mohammed Mojawala", "price": 15.0, "position": "FWD"},
#             {"full_name": "Wren D'Abreo", "price": 15.0, "position": "GK"},
#             {"full_name": "Floyd Dharmai", "price": 25.0, "position": "MID"},
#             {"full_name": "Nathan Nessiah", "price": 24.0, "position": "MID"},
#             {"full_name": "Abir Mayekar", "price": 1.0, "position": "FWD"},
#             {"full_name": "Humaid Armar", "price": 5.0, "position": "DEF"},
#             {"full_name": "Hussain Mohammed", "price": 1.0, "position": "DEF"},
#             {"full_name": "Yash Punjabi", "price": 1.0, "position": "DEF"},
#             {"full_name": "Animesh Singh", "price": 1.0, "position": "MID"},
#             {"full_name": "Atishray Malhan", "price": 1.0, "position": "MID"},
#         ],

#         "CAS": [
#             {"full_name": "Kavan Machiah", "price": 25.0, "position": "MID"},
#             {"full_name": "Samriddh Jain", "price": 15.0, "position": "GK"},
#             {"full_name": "Aranyah Tara", "price": 15.0, "position": "FWD"},
#             {"full_name": "Shayan", "price": 15.0, "position": "DEF"},
#             {"full_name": "Clivert Miller", "price": 25.0, "position": "FWD"},
#             {"full_name": "Sarthak Dhandharia", "price": 10.0, "position": "DEF"},
#             {"full_name": "Moses Bothello", "price": 2.0, "position": "DEF"},
#             {"full_name": "Zahoor Abbas", "price": 7.0, "position": "FWD"},
#             {"full_name": "Pranav Vaidhytahan", "price": 1.0, "position": "FWD"},
#             {"full_name": "Andy Pereira", "price": 1.0, "position": "MID"},
#             {"full_name": "Divij Mehta", "price": 1.0, "position": "MID"},
#             {"full_name": "Rutvik Kalaria", "price": 1.0, "position": "MID"},
#             {"full_name": "Sachin Jaiswar", "price": 5.0, "position": "DEF"},
#         ],

#         "MRFC": [
#             {"full_name": "Harsh Majithia", "price": 5.0, "position": "DEF"},
#             {"full_name": "Kurt Baptista", "price": 15.0, "position": "MID"},
#             {"full_name": "Anshumaan Kharga", "price": 10.0, "position": "MID"},
#             {"full_name": "Vedant Mungee", "price": 10.0, "position": "FWD"},
#             {"full_name": "Mohammed Lakdawala", "price": 10.0, "position": "DEF"},
#             {"full_name": "Kirsten Gonsalves", "price": 15.0, "position": "MID"},
#             {"full_name": "Deepam Anchan", "price": 18.0, "position": "DEF"},
#             {"full_name": "Aditya Mookulmarathur", "price": 12.0, "position": "GK"},
#             {"full_name": "Anirudh Shah", "price": 10.0, "position": "MID"},
#             {"full_name": "Manav Gagvani", "price": 11.0, "position": "FWD"},
#             {"full_name": "Tejash Kohli", "price": 3.0, "position": "FWD"},
#             {"full_name": "Pratham Mehta", "price": 2.0, "position": "DEF"},
#             {"full_name": "Pratham Anand Dubey", "price": 9.0, "position": "MID"},
#         ],

#         "SAT": [
#             {"full_name": "Rajeev Asija", "price": 5.0, "position": "MID"},
#             {"full_name": "Aryan Sher", "price": 15.0, "position": "MID"},
#             {"full_name": "Pranit Vyas", "price": 25.0, "position": "FWD"},
#             {"full_name": "Rohan Jadhav", "price": 25.0, "position": "MID"},
#             {"full_name": "Viral Mandalia", "price": 10.0, "position": "DEF"},
#             {"full_name": "Joshua Narde", "price": 7.0, "position": "GK"},
#             {"full_name": "Pranal Shetty", "price": 20.0, "position": "DEF"},
#             {"full_name": "Krish Ranjiv Ramchandani", "price": 2.0, "position": "DEF"},
#             {"full_name": "Prashant Sagar", "price": 10.0, "position": "FWD"},
#             {"full_name": "Aslam Khan", "price": 1.0, "position": "DEF"},
#             {"full_name": "Mikhail Lalwani", "price": 5.0, "position": "DEF"},
#             {"full_name": "Tushar Kant", "price": 1.0, "position": "DEF"},
#             {"full_name": "Siddhesh Naringrekar", "price": 5.0, "position": "MID"},
#         ],

#         "WOLF": [
#             {"full_name": "Abishek V Nambiar", "price": 10.0, "position": "FWD"},
#             {"full_name": "Nachiket", "price": 5.0, "position": "MID"},
#             {"full_name": "Kartik Shetty", "price": 10.0, "position": "FWD"},
#             {"full_name": "Dharmendra Bhurji", "price": 5.0, "position": "GK"},
#             {"full_name": "Milan", "price": 5.0, "position": "MID"},
#             {"full_name": "Tushar Chhibber", "price": 15.0, "position": "FWD"},
#             {"full_name": "Valton Fernandes", "price": 25.0, "position": "DEF"},
#             {"full_name": "Siddh Patel", "price": 7.0, "position": "DEF"},
#             {"full_name": "Chinmaya Sharma", "price": 5.0, "position": "DEF"},
#             {"full_name": "Ashley Gershom", "price": 7.0, "position": "MID"},
#             {"full_name": "Jeet Antani", "price": 8.0, "position": "DEF"},
#             {"full_name": "Samuel Santiago Dias", "price": 1.0, "position": "DEF"},
#             {"full_name": "Aldrith Fernandez", "price": 24.0, "position": "FWD"},
#         ],

#         "MAT": [
#             {"full_name": "Shaurya Bhandari", "price": 5.0, "position": "DEF"},
#             {"full_name": "Dave Deohans", "price": 15.0, "position": "FWD"},
#             {"full_name": "Siddharth Castelino", "price": 10.0, "position": "DEF"},
#             {"full_name": "Kaif Muneer", "price": 15.0, "position": "FWD"},
#             {"full_name": "Shlok Tiwari", "price": 10.0, "position": "DEF"},
#             {"full_name": "Aman Kawde", "price": 10.0, "position": "FWD"},
#             {"full_name": "Mahesh Singh", "price": 1.0, "position": "MID"},
#             {"full_name": "Geet Sahni", "price": 10.0, "position": "FWD"},
#             {"full_name": "Roshan Noronha", "price": 25.0, "position": "FWD"},
#             {"full_name": "Rivan Rajesh", "price": 20.0, "position": "MID"},
#             {"full_name": "Prithvi Singh", "price": 5.0, "position": "DEF"},
#             {"full_name": "Dane Pereira", "price": 6.0, "position": "GK"},
#             {"full_name": "Abhishek Negi", "price": 2.0, "position": "DEF"},
#         ],
#         "UMA": [
#             {"full_name": "Joel Fernandes", "price": 5.0, "position": "MID"},
#             {"full_name": "Aneesh Malankar", "price": 10.0, "position": "FWD"},
#             {"full_name": "Yashraj", "price": 15.0, "position": "GK"},
#             {"full_name": "Brett Rodrigues", "price": 15.0, "position": "FWD"},
#             {"full_name": "Raj Bhaduria", "price": 25.0, "position": "MID"},
#             {"full_name": "Aakash Nair", "price": 10.0, "position": "DEF"},
#             {"full_name": "Arghya Ghosh", "price": 12.0, "position": "MID"},
#             {"full_name": "Shubham Pandey", "price": 9.0, "position": "MID"},
#             {"full_name": "Anmol Pathak", "price": 5.0, "position": "MID"},
#             {"full_name": "Rakesh Mahadev Patne", "price": 4.0, "position": "DEF"},
#             {"full_name": "Rohit Tejwani", "price": 4.0, "position": "DEF"},
#             {"full_name": "Abdar Chasmawalla", "price": 14.0, "position": "DEF"},
#             {"full_name": "Rohil Malankar", "price": 7.0, "position": "FWD"},
#         ],

#         "AER": [
#             {"full_name": "Param Sabnani", "price": 5.0, "position": "MID"},
#             {"full_name": "Kabir Khan", "price": 10.0, "position": "DEF"},
#             {"full_name": "Krish", "price": 5.0, "position": "FWD"},
#             {"full_name": "Ishaan Jindal", "price": 15.0, "position": "MID"},
#             {"full_name": "Rajin Mehta", "price": 25.0, "position": "MID"},
#             {"full_name": "Brooklyn Robinson", "price": 5.0, "position": "GK"},
#             {"full_name": "Rishabh Lunia", "price": 5.0, "position": "MID"},
#             {"full_name": "Rohan Shukla", "price": 14.0, "position": "FWD"},
#             {"full_name": "Lance Fernandes", "price": 17.0, "position": "MID"},
#             {"full_name": "Dev Gupta", "price": 7.0, "position": "FWD"},
#             {"full_name": "Rayan Badheka", "price": 17.0, "position": "DEF"},
#             {"full_name": "Sunnay Jhaveri", "price": 1.0, "position": "FWD"},
#             {"full_name": "Sudhanshu Pradeep Rana", "price": 5.0, "position": "MID"},
#         ],

#         "ENC": [
#             {"full_name": "Aamir Petiwala", "price": 5.0, "position": "GK"},
#             {"full_name": "Aamir Ghadially", "price": 10.0, "position": "MID"},
#             {"full_name": "Siddhant Mehta", "price": 5.0, "position": "DEF"},
#             {"full_name": "Mir Mehta", "price": 30.0, "position": "MID"},
#             {"full_name": "Mikail Kazi", "price": 25.0, "position": "DEF"},
#             {"full_name": "Harmeet Vig", "price": 15.0, "position": "MID"},
#             {"full_name": "Andre Gazdar", "price": 38.0, "position": "FWD"},
#             {"full_name": "Zahan Aly Ali Hasnain Cassum", "price": 1.0, "position": "DEF"},
#             {"full_name": "Manan Gupta", "price": 1.0, "position": "MID"},
#             {"full_name": "Abhishek Shah", "price": 1.0, "position": "DEF"},
#             {"full_name": "Zaid Vilaity", "price": 1.0, "position": "DEF"},
#             {"full_name": "Wendell M", "price": 1.0, "position": "DEF"},
#             {"full_name": "Smeet Sangram Shinde", "price": 1.0, "position": "MID"},
#         ],

#         "ROA": [
#             {"full_name": "Ibadur Haque", "price": 5.0, "position": "DEF"},
#             {"full_name": "Obaidur Haque", "price": 5.0, "position": "GK"},
#             {"full_name": "Nathan Murzello", "price": 25.0, "position": "MID"},
#             {"full_name": "Vignesh Angadi", "price": 15.0, "position": "DEF"},
#             {"full_name": "Siddharth Bhonsle", "price": 15.0, "position": "MID"},
#             {"full_name": "Ian Dsilva", "price": 5.0, "position": "DEF"},
#             {"full_name": "Siddhanth Kripalani", "price": 22.0, "position": "MID"},
#             {"full_name": "Sashant Shetty", "price": 28.0, "position": "DEF"},
#             {"full_name": "Aman Arora", "price": 5.0, "position": "DEF"},
#             {"full_name": "Gautam Rochlani", "price": 5.0, "position": "DEF"},
#             {"full_name": "Srivinayak Shivkumar Tatikonda", "price": 1.0, "position": "DEF"},
#             {"full_name": "Rahul Juneja", "price": 1.0, "position": "MID"},
#             {"full_name": "Prem Talesara", "price": 1.0, "position": "FWD"},
#         ],

#         "YBFC": [
#             {"full_name": "Karm Mulchandani", "price": 5.0, "position": "MID"},
#             {"full_name": "Awnan Khan", "price": 25.0, "position": "MID"},
#             {"full_name": "Neil Thakkar", "price": 15.0, "position": "FWD"},
#             {"full_name": "Krish Kohal", "price": 5.0, "position": "MID"},
#             {"full_name": "Sarthak Arora", "price": 7.0, "position": "DEF"},
#             {"full_name": "Aayushmaan Dwivedi", "price": 10.0, "position": "FWD"},
#             {"full_name": "Tanishk Sarawgi", "price": 11.0, "position": "GK"},
#             {"full_name": "Reza Nekooi", "price": 5.0, "position": "DEF"},
#             {"full_name": "Tanmay Pillay", "price": 6.0, "position": "FWD"},
#             {"full_name": "Manav Manshani", "price": 2.0, "position": "DEF"},
#             {"full_name": "Navjot Singh Pable", "price": 11.0, "position": "DEF"},
#             {"full_name": "Vinamra Sarawgi", "price": 17.0, "position": "MID"},
#             {"full_name": "Tilak Patel", "price": 1.0, "position": "DEF"},
#         ],

#         "CAT": [
#             {"full_name": "Vikram", "price": 5.0, "position": "FWD"},
#             {"full_name": "Kunal Deshmukh", "price": 5.0, "position": "DEF"},
#             {"full_name": "Paresh Mallesha", "price": 10.0, "position": "DEF"},
#             {"full_name": "Udayan Bedekar", "price": 5.0, "position": "DEF"},
#             {"full_name": "Karun Jhangiani", "price": 21.0, "position": "MID"},
#             {"full_name": "Aditya Kacholia", "price": 21.0, "position": "MID"},
#             {"full_name": "Craig Dsouza", "price": 39.0, "position": "DEF"},
#             {"full_name": "Mayank Ranjan", "price": 2.0, "position": "FWD"},
#             {"full_name": "Armaan Vardhan", "price": 10.0, "position": "MID"},
#             {"full_name": "Joshua Dsouza", "price": 10.0, "position": "MID"},
#             {"full_name": "Rushabh Lakhwani", "price": 5.0, "position": "GK"},
#             {"full_name": "Krishna Mukesh Kanjar", "price": 1.0, "position": "FWD"},
#             {"full_name": "Kavish Pandya", "price": 1.0, "position": "FWD"},
#         ]
#     }


# async def clear_data(db: Prisma):
#     print("🧹 Wiping all existing data for a fresh start...")
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
#     print("✅ All data wiped successfully.")

# async def main() -> None:
#     db = Prisma()
#     await db.connect()
    
#     try:
#         # 1. WIPE DATABASE
#         await clear_data(db)

#         # 2. SEED ADMIN USER
#         print("👤 Seeding admin user...")
#         await db.user.create(data={
#             "email": "admin@acesfpl.com", 
#             "hashed_password": hash_password("adminPassword"),
#             "role": "admin", 
#             "is_active": True, 
#             "full_name": "Admin User",
#         })
#         print("✅ Admin user created.")

#         # 3. SEED TEAMS AND PLAYERS
#         print("⚽ Seeding teams and players...")
#         await db.team.create_many(data=TEAMS, skip_duplicates=True)
#         all_teams = await db.team.find_many()
        
#         team_map_short = {team.short_name: team.id for team in all_teams}
#         team_map_name = {team.name: team.id for team in all_teams} 

#         for short_name, players in get_player_data().items():
#             team_id = team_map_short.get(short_name)
#             if team_id:
#                 await db.player.create_many(data=[{"team_id": team_id, **p} for p in players], skip_duplicates=True)
#             else:
#                 print(f"⚠️ Warning: Could not find team ID for {short_name}")
                
#         print("✅ Teams and players seeded.")

        
#         # 4. GENERATE SPECIFIC SCHEDULE
#         print("⏰ Generating specific match schedule...")
        
#         ist_tz = timezone(timedelta(hours=5, minutes=30))
        
#         # --- DEFINED MATCH DATES (Year 2026 based on your provided list) ---
#         GW_DATES = {
#             1: datetime(2026, 3, 15, tzinfo=ist_tz), # Sunday
#             2: datetime(2026, 3, 22, tzinfo=ist_tz), # Sunday
#             3: datetime(2026, 3, 28, tzinfo=ist_tz), # Saturday
#             4: datetime(2026, 4, 12, tzinfo=ist_tz), # Sunday
#             5: datetime(2026, 4, 19, tzinfo=ist_tz), # Sunday
#             6: datetime(2026, 4, 26, tzinfo=ist_tz), # Sunday
#             7: datetime(2026, 5, 3, tzinfo=ist_tz),  # Sunday
#             8: datetime(2026, 5, 10, tzinfo=ist_tz), # Sunday
#             9: datetime(2026, 5, 17, tzinfo=ist_tz), # Sunday
#             10: datetime(2026, 5, 24, tzinfo=ist_tz), # Sunday
#         }
        
#         gameweek_data = []
#         fixture_data = []

#         for gw_num in range(1, 11):
#             base_date = GW_DATES.get(gw_num)
            
#             if not base_date:
#                 continue

#             pairings = FIXTURE_PAIRINGS.get(gw_num, [])
            
#             # Find the earliest kickoff hour in this Gameweek
#             first_kickoff_hour = min([match[2] for match in pairings]) if pairings else 16
            
#             # Transfer deadline is exactly 2 hours before the first kickoff
#             deadline_hour = first_kickoff_hour - 2
#             deadline = base_date.replace(hour=deadline_hour, minute=0, second=0)

#             gameweek_data.append({
#                 "gw_number": gw_num, 
#                 "deadline": deadline, 
#                 "status": "UPCOMING"
#             })
#             print(f"  - Gameweek {gw_num} Deadline: {deadline.strftime('%a %d %b %Y, %I:%M %p %Z')}")

#             for home_raw, away_raw, start_hour in pairings:
#                 home_real_name = NAME_MAP.get(home_raw)
#                 away_real_name = NAME_MAP.get(away_raw)

#                 if not home_real_name or not away_real_name:
#                     print(f"❌ Error: Could not map team names '{home_raw}' or '{away_raw}'")
#                     continue

#                 home_id = team_map_name.get(home_real_name)
#                 away_id = team_map_name.get(away_real_name)
                
#                 # Kickoff applies the specific hour provided in the list (e.g. 16 = 4:00 PM)
#                 kickoff_time = base_date.replace(hour=start_hour, minute=0, second=0)

#                 if home_id and away_id:
#                     fixture_data.append({
#                         "gw_number": gw_num, 
#                         "home_team_id": home_id,
#                         "away_team_id": away_id, 
#                         "kickoff": kickoff_time
#                     })

#         # Create gameweeks in DB
#         await db.gameweek.create_many(data=gameweek_data, skip_duplicates=True)
#         print("✅ All gameweeks created.")

#         all_gws = await db.gameweek.find_many()
#         gameweek_map = {gw.gw_number: gw.id for gw in all_gws}
        
#         for fixture in fixture_data:
#             fixture["gameweek_id"] = gameweek_map[fixture["gw_number"]]
#             del fixture["gw_number"]

#         await db.fixture.create_many(data=fixture_data, skip_duplicates=True)
#         print("✅ All fixtures created with Specific Dates and Kickoff Times.")

#     except Exception as e:
#         print(f"❌ An error occurred during seeding: {e}")
#         print("--- Full Traceback ---")
#         traceback.print_exc()
#         print("----------------------")
#     finally:
#         await db.disconnect()
#         print("\nSeeding process complete.")

# if __name__ == "__main__":
#     asyncio.run(main())

# Testing seed

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

# --- PAIRINGS ---
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
        "TRA": [
            {"full_name": "Tabish Armar", "price": 5.0, "position": "MID"},
            {"full_name": "Zaid Ansari", "price": 25.0, "position": "MID"},
            {"full_name": "Showkat Ansari", "price": 15.0, "position": "DEF"},
            {"full_name": "Mohammed Mojawala", "price": 15.0, "position": "FWD"},
            {"full_name": "Wren D'Abreo", "price": 15.0, "position": "GK"},
            {"full_name": "Floyd Dharmai", "price": 25.0, "position": "MID"},
            {"full_name": "Nathan Nessiah", "price": 24.0, "position": "MID"},
            {"full_name": "Abir Mayekar", "price": 1.0, "position": "FWD"},
            {"full_name": "Humaid Armar", "price": 5.0, "position": "DEF"},
            {"full_name": "Hussain Mohammed", "price": 1.0, "position": "DEF"},
            {"full_name": "Yash Punjabi", "price": 1.0, "position": "DEF"},
            {"full_name": "Animesh Singh", "price": 1.0, "position": "MID"},
            {"full_name": "Atishray Malhan", "price": 1.0, "position": "MID"},
        ],

        "CAS": [
            {"full_name": "Kavan Machiah", "price": 25.0, "position": "MID"},
            {"full_name": "Samriddh Jain", "price": 15.0, "position": "GK"},
            {"full_name": "Aranyah Tara", "price": 15.0, "position": "FWD"},
            {"full_name": "Shayan", "price": 15.0, "position": "DEF"},
            {"full_name": "Clivert Miller", "price": 25.0, "position": "FWD"},
            {"full_name": "Sarthak Dhandharia", "price": 10.0, "position": "DEF"},
            {"full_name": "Moses Bothello", "price": 2.0, "position": "DEF"},
            {"full_name": "Zahoor Abbas", "price": 7.0, "position": "FWD"},
            {"full_name": "Pranav Vaidhytahan", "price": 1.0, "position": "FWD"},
            {"full_name": "Andy Pereira", "price": 1.0, "position": "MID"},
            {"full_name": "Divij Mehta", "price": 1.0, "position": "MID"},
            {"full_name": "Rutvik Kalaria", "price": 1.0, "position": "MID"},
            {"full_name": "Sachin Jaiswar", "price": 5.0, "position": "DEF"},
        ],

        "MRFC": [
            {"full_name": "Harsh Majithia", "price": 5.0, "position": "DEF"},
            {"full_name": "Kurt Baptista", "price": 15.0, "position": "MID"},
            {"full_name": "Anshumaan Kharga", "price": 10.0, "position": "MID"},
            {"full_name": "Vedant Mungee", "price": 10.0, "position": "FWD"},
            {"full_name": "Mohammed Lakdawala", "price": 10.0, "position": "DEF"},
            {"full_name": "Kirsten Gonsalves", "price": 15.0, "position": "MID"},
            {"full_name": "Deepam Anchan", "price": 18.0, "position": "DEF"},
            {"full_name": "Aditya Mookulmarathur", "price": 12.0, "position": "GK"},
            {"full_name": "Anirudh Shah", "price": 10.0, "position": "MID"},
            {"full_name": "Manav Gagvani", "price": 11.0, "position": "FWD"},
            {"full_name": "Tejash Kohli", "price": 3.0, "position": "FWD"},
            {"full_name": "Pratham Mehta", "price": 2.0, "position": "DEF"},
            {"full_name": "Pratham Anand Dubey", "price": 9.0, "position": "MID"},
        ],

        "SAT": [
            {"full_name": "Rajeev Asija", "price": 5.0, "position": "MID"},
            {"full_name": "Aryan Sher", "price": 15.0, "position": "MID"},
            {"full_name": "Pranit Vyas", "price": 25.0, "position": "FWD"},
            {"full_name": "Rohan Jadhav", "price": 25.0, "position": "MID"},
            {"full_name": "Viral Mandalia", "price": 10.0, "position": "DEF"},
            {"full_name": "Joshua Narde", "price": 7.0, "position": "GK"},
            {"full_name": "Pranal Shetty", "price": 20.0, "position": "DEF"},
            {"full_name": "Krish Ranjiv Ramchandani", "price": 2.0, "position": "DEF"},
            {"full_name": "Prashant Sagar", "price": 10.0, "position": "FWD"},
            {"full_name": "Aslam Khan", "price": 1.0, "position": "DEF"},
            {"full_name": "Mikhail Lalwani", "price": 5.0, "position": "DEF"},
            {"full_name": "Tushar Kant", "price": 1.0, "position": "DEF"},
            {"full_name": "Siddhesh Naringrekar", "price": 5.0, "position": "MID"},
        ],

        "WOLF": [
            {"full_name": "Abishek V Nambiar", "price": 10.0, "position": "FWD"},
            {"full_name": "Nachiket", "price": 5.0, "position": "MID"},
            {"full_name": "Kartik Shetty", "price": 10.0, "position": "FWD"},
            {"full_name": "Dharmendra Bhurji", "price": 5.0, "position": "GK"},
            {"full_name": "Milan", "price": 5.0, "position": "MID"},
            {"full_name": "Tushar Chhibber", "price": 15.0, "position": "FWD"},
            {"full_name": "Valton Fernandes", "price": 25.0, "position": "DEF"},
            {"full_name": "Siddh Patel", "price": 7.0, "position": "DEF"},
            {"full_name": "Chinmaya Sharma", "price": 5.0, "position": "DEF"},
            {"full_name": "Ashley Gershom", "price": 7.0, "position": "MID"},
            {"full_name": "Jeet Antani", "price": 8.0, "position": "DEF"},
            {"full_name": "Samuel Santiago Dias", "price": 1.0, "position": "DEF"},
            {"full_name": "Aldrith Fernandez", "price": 24.0, "position": "FWD"},
        ],

        "MAT": [
            {"full_name": "Shaurya Bhandari", "price": 5.0, "position": "DEF"},
            {"full_name": "Dave Deohans", "price": 15.0, "position": "FWD"},
            {"full_name": "Siddharth Castelino", "price": 10.0, "position": "DEF"},
            {"full_name": "Kaif Muneer", "price": 15.0, "position": "FWD"},
            {"full_name": "Shlok Tiwari", "price": 10.0, "position": "DEF"},
            {"full_name": "Aman Kawde", "price": 10.0, "position": "FWD"},
            {"full_name": "Mahesh Singh", "price": 1.0, "position": "MID"},
            {"full_name": "Geet Sahni", "price": 10.0, "position": "FWD"},
            {"full_name": "Roshan Noronha", "price": 25.0, "position": "FWD"},
            {"full_name": "Rivan Rajesh", "price": 20.0, "position": "MID"},
            {"full_name": "Prithvi Singh", "price": 5.0, "position": "DEF"},
            {"full_name": "Dane Pereira", "price": 6.0, "position": "GK"},
            {"full_name": "Abhishek Negi", "price": 2.0, "position": "DEF"},
        ],
        "UMA": [
            {"full_name": "Joel Fernandes", "price": 5.0, "position": "MID"},
            {"full_name": "Aneesh Malankar", "price": 10.0, "position": "FWD"},
            {"full_name": "Yashraj", "price": 15.0, "position": "GK"},
            {"full_name": "Brett Rodrigues", "price": 15.0, "position": "FWD"},
            {"full_name": "Raj Bhaduria", "price": 25.0, "position": "MID"},
            {"full_name": "Aakash Nair", "price": 10.0, "position": "DEF"},
            {"full_name": "Arghya Ghosh", "price": 12.0, "position": "MID"},
            {"full_name": "Shubham Pandey", "price": 9.0, "position": "MID"},
            {"full_name": "Anmol Pathak", "price": 5.0, "position": "MID"},
            {"full_name": "Rakesh Mahadev Patne", "price": 4.0, "position": "DEF"},
            {"full_name": "Rohit Tejwani", "price": 4.0, "position": "DEF"},
            {"full_name": "Abdar Chasmawalla", "price": 14.0, "position": "DEF"},
            {"full_name": "Rohil Malankar", "price": 7.0, "position": "FWD"},
        ],

        "AER": [
            {"full_name": "Param Sabnani", "price": 5.0, "position": "MID"},
            {"full_name": "Kabir Khan", "price": 10.0, "position": "DEF"},
            {"full_name": "Krish", "price": 5.0, "position": "FWD"},
            {"full_name": "Ishaan Jindal", "price": 15.0, "position": "MID"},
            {"full_name": "Rajin Mehta", "price": 25.0, "position": "MID"},
            {"full_name": "Brooklyn Robinson", "price": 5.0, "position": "GK"},
            {"full_name": "Rishabh Lunia", "price": 5.0, "position": "MID"},
            {"full_name": "Rohan Shukla", "price": 14.0, "position": "FWD"},
            {"full_name": "Lance Fernandes", "price": 17.0, "position": "MID"},
            {"full_name": "Dev Gupta", "price": 7.0, "position": "FWD"},
            {"full_name": "Rayan Badheka", "price": 17.0, "position": "DEF"},
            {"full_name": "Sunnay Jhaveri", "price": 1.0, "position": "FWD"},
            {"full_name": "Sudhanshu Pradeep Rana", "price": 5.0, "position": "MID"},
        ],

        "ENC": [
            {"full_name": "Aamir Petiwala", "price": 5.0, "position": "GK"},
            {"full_name": "Aamir Ghadially", "price": 10.0, "position": "MID"},
            {"full_name": "Siddhant Mehta", "price": 5.0, "position": "DEF"},
            {"full_name": "Mir Mehta", "price": 30.0, "position": "MID"},
            {"full_name": "Mikail Kazi", "price": 25.0, "position": "DEF"},
            {"full_name": "Harmeet Vig", "price": 15.0, "position": "MID"},
            {"full_name": "Andre Gazdar", "price": 38.0, "position": "FWD"},
            {"full_name": "Zahan Aly Ali Hasnain Cassum", "price": 1.0, "position": "DEF"},
            {"full_name": "Manan Gupta", "price": 1.0, "position": "MID"},
            {"full_name": "Abhishek Shah", "price": 1.0, "position": "DEF"},
            {"full_name": "Zaid Vilaity", "price": 1.0, "position": "DEF"},
            {"full_name": "Wendell M", "price": 1.0, "position": "DEF"},
            {"full_name": "Smeet Sangram Shinde", "price": 1.0, "position": "MID"},
        ],

        "ROA": [
            {"full_name": "Ibadur Haque", "price": 5.0, "position": "DEF"},
            {"full_name": "Obaidur Haque", "price": 5.0, "position": "GK"},
            {"full_name": "Nathan Murzello", "price": 25.0, "position": "MID"},
            {"full_name": "Vignesh Angadi", "price": 15.0, "position": "DEF"},
            {"full_name": "Siddharth Bhonsle", "price": 15.0, "position": "MID"},
            {"full_name": "Ian Dsilva", "price": 5.0, "position": "DEF"},
            {"full_name": "Siddhanth Kripalani", "price": 22.0, "position": "MID"},
            {"full_name": "Sashant Shetty", "price": 28.0, "position": "DEF"},
            {"full_name": "Aman Arora", "price": 5.0, "position": "DEF"},
            {"full_name": "Gautam Rochlani", "price": 5.0, "position": "DEF"},
            {"full_name": "Srivinayak Shivkumar Tatikonda", "price": 1.0, "position": "DEF"},
            {"full_name": "Rahul Juneja", "price": 1.0, "position": "MID"},
            {"full_name": "Prem Talesara", "price": 1.0, "position": "FWD"},
        ],

        "YBFC": [
            {"full_name": "Karm Mulchandani", "price": 5.0, "position": "MID"},
            {"full_name": "Awnan Khan", "price": 25.0, "position": "MID"},
            {"full_name": "Neil Thakkar", "price": 15.0, "position": "FWD"},
            {"full_name": "Krish Kohal", "price": 5.0, "position": "MID"},
            {"full_name": "Sarthak Arora", "price": 7.0, "position": "DEF"},
            {"full_name": "Aayushmaan Dwivedi", "price": 10.0, "position": "FWD"},
            {"full_name": "Tanishk Sarawgi", "price": 11.0, "position": "GK"},
            {"full_name": "Reza Nekooi", "price": 5.0, "position": "DEF"},
            {"full_name": "Tanmay Pillay", "price": 6.0, "position": "FWD"},
            {"full_name": "Manav Manshani", "price": 2.0, "position": "DEF"},
            {"full_name": "Navjot Singh Pable", "price": 11.0, "position": "DEF"},
            {"full_name": "Vinamra Sarawgi", "price": 17.0, "position": "MID"},
            {"full_name": "Tilak Patel", "price": 1.0, "position": "DEF"},
        ],

        "CAT": [
            {"full_name": "Vikram", "price": 5.0, "position": "FWD"},
            {"full_name": "Kunal Deshmukh", "price": 5.0, "position": "DEF"},
            {"full_name": "Paresh Mallesha", "price": 10.0, "position": "DEF"},
            {"full_name": "Udayan Bedekar", "price": 5.0, "position": "DEF"},
            {"full_name": "Karun Jhangiani", "price": 21.0, "position": "MID"},
            {"full_name": "Aditya Kacholia", "price": 21.0, "position": "MID"},
            {"full_name": "Craig Dsouza", "price": 39.0, "position": "DEF"},
            {"full_name": "Mayank Ranjan", "price": 2.0, "position": "FWD"},
            {"full_name": "Armaan Vardhan", "price": 10.0, "position": "MID"},
            {"full_name": "Joshua Dsouza", "price": 10.0, "position": "MID"},
            {"full_name": "Rushabh Lakhwani", "price": 5.0, "position": "GK"},
            {"full_name": "Krishna Mukesh Kanjar", "price": 1.0, "position": "FWD"},
            {"full_name": "Kavish Pandya", "price": 1.0, "position": "FWD"},
        ]
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
        print("⏰ Generating TEST schedule: GW1 in 10 mins. Interval: 10 mins.")
        
        ist_tz = timezone(timedelta(hours=5, minutes=30))
        now_utc = datetime.now(timezone.utc)
        
        # Start Time: 10 minutes from NOW
        start_time = now_utc + timedelta(minutes=10)
        interval = timedelta(minutes=10)
        
        gameweek_data = []
        fixture_data = []

        for gw_num in range(1, 11):
            # Calculate Deadline
            deadline = start_time + ((gw_num - 1) * interval)
            # Display in IST for debugging clarity
            deadline_ist = deadline.astimezone(ist_tz)
            
            gameweek_data.append({
                "gw_number": gw_num, 
                "deadline": deadline, 
                "status": "UPCOMING"
            })
            print(f"  - Gameweek {gw_num} Deadline: {deadline_ist.strftime('%Y-%m-%d %H:%M:%S %Z')}")

            # Get Pairings for this GW
            pairings = FIXTURE_PAIRINGS.get(gw_num, [])
            
            for i, (home_raw, away_raw) in enumerate(pairings):
                home_real_name = NAME_MAP.get(home_raw)
                away_real_name = NAME_MAP.get(away_raw)

                if not home_real_name or not away_real_name:
                    print(f"❌ Error: Could not map team names '{home_raw}' or '{away_raw}'")
                    continue

                home_id = team_map_name.get(home_real_name)
                away_id = team_map_name.get(away_real_name)
                
                # Kickoff Staggering: 1 minute intervals (1, 2, 3, 4, 5, 6 mins after deadline)
                # to comfortably fit within the 10-minute gameweek window
                kickoff_time = deadline + timedelta(minutes=1 + i)

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
        print("✅ All fixtures created with Fast-Paced Test Schedule.")

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