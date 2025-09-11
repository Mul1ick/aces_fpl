from dotenv import load_dotenv
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, user_routes, player_routes, team, gameweek_routes, leaderboard_routes, admin_routes,fixture_routes,transfer_routes,chip_routes
from app.config import CORS_ORIGINS
import logging

logging.basicConfig(
    level=logging.INFO,  # or DEBUG if you want the detailed logs
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)

app = FastAPI(
    title="Aces FPL Backend API",
    description="The backend service for the Aces Fantasy Premier League application and Admin Portal.",
    version="1.0.0"
)

# --- Middleware Configuration ---
# This is a crucial step for allowing your React frontends to communicate with the backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Use the dynamic list from config.py
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Router Includes ---
# Public routes for the main FPL application
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/users", tags=["Users"])
app.include_router(player_routes.router)
app.include_router(team.router, prefix="/teams", tags=["Teams"])
app.include_router(gameweek_routes.router,prefix="/gameweeks",  tags=["Gameweeks"])
app.include_router(leaderboard_routes.router)
app.include_router(fixture_routes.router)
app.include_router(transfer_routes.router)
app.include_router(chip_routes.router)
# Secure routes for the Admin Portal
app.include_router(admin_routes.router) # Prefix is already defined in admin_routes.py


# --- Root Endpoint ---
@app.get("/")
def root():
    """
    Root endpoint for health checks.
    """
    return {"message": "Aces FPL backend is running successfully."}

