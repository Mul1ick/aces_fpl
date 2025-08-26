from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, user_routes
from app.database import engine
from app import models
from app.config import CORS_ORIGINS
from app.routes import player_routes

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(user_routes.router, prefix="/users", tags=["Users"])
app.include_router(player_routes.router)

@app.get("/")
def root():
    return {"message": "FPL backend is running"}