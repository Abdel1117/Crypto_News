from fastapi import APIRouter
from app.controllers.admin_controller import router as admin_router
from app.controllers.alerts_controller import router as alerts_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.chat_controller import router as chat_router
from app.controllers.blog_controller import router as blog_router
from app.controllers.contact_controller import router as contact_router
from app.controllers.market_controller import router as market_router
from app.controllers.simulation_controller import router as simulation_router
from app.controllers.symbols_controller import router as symbols_router
from app.controllers.trending_controller import router as trending_router

api_router = APIRouter()
api_router.include_router(admin_router)
api_router.include_router(alerts_router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(blog_router)
api_router.include_router(contact_router)
api_router.include_router(market_router)
api_router.include_router(simulation_router)
api_router.include_router(symbols_router)
api_router.include_router(trending_router)
