import os
from dotenv import load_dotenv
import ast

load_dotenv()

cors_origins_raw = os.getenv("CORS_ORIGINS", "[]")

try:
    CORS_ORIGINS = ast.literal_eval(cors_origins_raw)
except Exception as e:
    print("❌ Failed to parse CORS_ORIGINS from .env:", cors_origins_raw)
    print("Error:", e)
    CORS_ORIGINS = []

print("✅ CORS_ORIGINS loaded:", CORS_ORIGINS)