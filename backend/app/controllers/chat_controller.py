import json
from datetime import datetime, timezone
from functools import lru_cache
from typing import AsyncIterator

import anthropic
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.clients.coingecko_client import CoinGeckoClient
from app.core.config import settings
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.chat.chat_usage_sql_repo import SQLChatUsageRepository
from app.schemas.chat import ChatRequest, ChatUsageOut
from app.services.chat.chat_service import (
    ChatService,
    InvalidConversation,
    build_user_context,
    normalize_history,
)
from app.services.chat.tools import ChatTools
from app.services.market_service import MarketService
from app.services.symbols_service import SymbolesService
from app.services.trending_service import TrendingService

router = APIRouter(prefix="/chat", tags=["chat"])


@lru_cache
def _anthropic_client(api_key: str) -> anthropic.AsyncAnthropic:
    # One client per process so HTTP connections are reused across requests.
    return anthropic.AsyncAnthropic(api_key=api_key)


def get_chat_service() -> ChatService:
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="L'assistant n'est pas configuré.",
        )
    market_client = CoinGeckoClient()
    tools = ChatTools(
        MarketService(market_client),
        TrendingService(market_client),
        SymbolesService(market_client),
    )
    return ChatService(
        _anthropic_client(settings.ANTHROPIC_API_KEY), tools, settings.CHAT_MODEL
    )


def get_usage_repo(
    session: AsyncSession = Depends(get_session),
) -> SQLChatUsageRepository:
    return SQLChatUsageRepository(session)


def _today():
    return datetime.now(timezone.utc).date()


def _usage(used: int) -> ChatUsageOut:
    limit = settings.CHAT_DAILY_LIMIT
    return ChatUsageOut(
        used=used,
        limit=limit,
        remaining=max(limit - used, 0),
        available=bool(settings.ANTHROPIC_API_KEY),
    )


async def _sse(events: AsyncIterator[dict], first: dict) -> AsyncIterator[str]:
    yield f"data: {json.dumps(first)}\n\n"
    async for event in events:
        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@router.get("/usage", response_model=ChatUsageOut)
async def get_chat_usage(
    user: User = Depends(get_current_user),
    repo: SQLChatUsageRepository = Depends(get_usage_repo),
):
    return _usage(await repo.get_count(user.id, _today()))


@router.post("")
async def post_chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    repo: SQLChatUsageRepository = Depends(get_usage_repo),
    service: ChatService = Depends(get_chat_service),
):
    try:
        turns = normalize_history(body.messages, settings.CHAT_MAX_HISTORY)
    except InvalidConversation as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    today = _today()
    if await repo.get_count(user.id, today) >= settings.CHAT_DAILY_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Tu as atteint la limite de messages pour aujourd'hui. Reviens demain !",
        )
    used = await repo.increment(user.id, today)

    context = build_user_context(body.currency, body.watchlist, body.portfolio)
    usage_event = {"type": "usage", **_usage(used).model_dump()}
    return StreamingResponse(
        _sse(service.stream_reply(turns, context), usage_event),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
