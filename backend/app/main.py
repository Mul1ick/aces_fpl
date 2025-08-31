from dotenv import load_dotenv
load_dotenv() 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, user_routes
from app import models
from app.config import CORS_ORIGINS
from app.routes import player_routes
from app.routes import team
from app.routes import gameweek_routes
from app.routes import leaderboard_routes


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/users", tags=["Users"])
app.include_router(player_routes.router)
app.include_router(team.router,prefix="/teams", tags=["Teams"])
app.include_router(gameweek_routes.router, tags=["Gameweeks"])
app.include_router(leaderboard_routes.router)


@app.get("/")
def root():
    return {"message": "FPL backend is running"}