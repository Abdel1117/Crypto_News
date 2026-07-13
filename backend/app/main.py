import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.controllers import api_router
from app.db.session import init_db

app = FastAPI()


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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


app.include_router(api_router)
