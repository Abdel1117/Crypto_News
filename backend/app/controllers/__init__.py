from fastapi import APIRouter
from app.controllers.auth_controller import router as auth_router
from app.controllers.market_controller import router as market_router
from app.controllers.symbols_controller import router as symbols_router
from app.controllers.trending_controller import router as trending_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(market_router)
api_router.include_router(symbols_router)
api_router.include_router(trending_router)
