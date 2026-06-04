from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import api_router
from app.db.session import init_db

app = FastAPI()

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
