from fastapi import APIRouter
from app.controllers.market_controller import router as market_router

api_router = APIRouter()
api_router.include_router(market_router)
