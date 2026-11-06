import asyncio
import logging
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.controllers import api_router
from app.core.config import settings
from app.core.jwt_config import JWT_SECRET_KEY, check_jwt_secret
from app.clients.coingecko_client import CoinGeckoClient
from app.db.session import async_session, init_db
from app.services.alerts.price_alert_service import price_alert_loop
from app.services.email.smtp_email_sender import build_email_sender
from app.services.market_service import MarketService
from app.services.simulation.simulation_service import snapshot_loop

check_jwt_secret(os.getenv("ENV"), JWT_SECRET_KEY)

logger = logging.getLogger(__name__)

app = FastAPI()
_background_tasks: set[asyncio.Task] = set()


@app.exception_handler(httpx.HTTPStatusError)
async def coingecko_error_handler(request: Request, exc: httpx.HTTPStatusError):
    if exc.response.status_code == 429:
        return JSONResponse(
            status_code=503,
            content={"detail": "Market data provider is rate-limited, please retry shortly."},
        )
    return JSONResponse(status_code=502, content={"detail": "Upstream market data error."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS_LIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()
    if settings.SIM_SNAPSHOT_INTERVAL > 0:
        # Records each simulated portfolio's daily value, for the chart and
        # the risk stats, even on days its owner doesn't visit.
        task = asyncio.create_task(
            snapshot_loop(
                async_session,
                lambda: MarketService(CoinGeckoClient()),
                settings.SIM_SNAPSHOT_INTERVAL,
            )
        )
        _background_tasks.add(task)

    if settings.PRICE_ALERT_INTERVAL > 0:
        if settings.EMAIL_ENABLED:
            task = asyncio.create_task(
                price_alert_loop(
                    async_session,
                    lambda: MarketService(CoinGeckoClient()),
                    build_email_sender,
                    settings.PRICE_ALERT_INTERVAL,
                )
            )
            _background_tasks.add(task)
        else:
            logger.warning("Price alerts are off: SMTP_HOST and SMTP_USER are not set")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    for task in _background_tasks:
        task.cancel()


app.include_router(api_router)
