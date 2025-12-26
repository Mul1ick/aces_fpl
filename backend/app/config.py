import os
from dotenv import load_dotenv
import ast

load_dotenv()

# --- NEW: Define a default list of origins ---
# This list will be used if the CORS_ORIGINS environment variable is not set.
# It includes both your main FPL app and your new Admin Portal.
# DEFAULT_ORIGINS = [
#     "http://localhost:3000",  # Default for main FPL React App
#     "http://localhost:8080",  # Default for new Admin Portal React App
# ]

DEFAULT_ORIGINS = [
    "https://aces-fpl.vercel.app/",  # Default for main FPL React App
    "https://acesfpl.vercel.app/",
    "https://admin-acesfpl.vercel.app"  # Default for new Admin Portal React App,
    "http://localhost:3000",  # Default for main FPL React App
    "http://localhost:8080",
    "https://acesfpl-test-dep.vercel.app",
    "https://http://acesfpl-testadmin.vercel.app"
]

# --- UPDATED: Safer parsing of the CORS_ORIGINS environment variable ---
cors_origins_raw = os.getenv("CORS_ORIGINS")

if cors_origins_raw:
    try:
        # Try to parse the list from the environment variable
        CORS_ORIGINS = ast.literal_eval(cors_origins_raw)
    except (ValueError, SyntaxError):
        # If parsing fails, log an error and use the safe default
        print(f"❌ Failed to parse CORS_ORIGINS from .env: {cors_origins_raw}")
        CORS_ORIGINS = DEFAULT_ORIGINS
else:
    # If the environment variable is not set at all, use the default
    CORS_ORIGINS = DEFAULT_ORIGINS

print(f"✅ CORS_ORIGINS loaded: {CORS_ORIGINS}")

