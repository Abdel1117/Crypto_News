import copy
from types import SimpleNamespace
from unittest.mock import AsyncMock

import anthropic
import httpx
import pytest

from app.schemas.chat import ChatMessageIn, HoldingIn, PortfolioIn
from app.services.chat.chat_service import (
    ERROR_MESSAGES,
    MAX_TOOL_ROUNDS,
    REFUSAL_MESSAGE,
    ChatService,
    InvalidConversation,
    build_user_context,
    normalize_history,
)


def text_block(text):
    return SimpleNamespace(type="text", text=text)


def tool_block(id_, name, input_):
    return SimpleNamespace(type="tool_use", id=id_, name=name, input=input_)


def turn(stop_reason, blocks, streamed=()):
    """One scripted model turn: events streamed, then the final message."""
    return {
        "events": [SimpleNamespace(type="text", text=t) for t in streamed],
        "message": SimpleNamespace(stop_reason=stop_reason, content=list(blocks)),
    }


class FakeStream:
    def __init__(self, script):
        self.script = script

    async def __aenter__(self):
        if isinstance(self.script, Exception):
            raise self.script
        return self

    async def __aexit__(self, *exc):
        return False

    def __aiter__(self):
        return self._events()

    async def _events(self):
        for event in self.script["events"]:
            yield event
        if "raise" in self.script:
            raise self.script["raise"]

    async def get_final_message(self):
        return self.script["message"]


class FakeClient:
    def __init__(self, scripts):
        self.scripts = list(scripts)
        self.calls = []
        self.messages = self

    def stream(self, **kwargs):
        self.calls.append(copy.deepcopy(kwargs))
        return FakeStream(self.scripts.pop(0))


@pytest.fixture
def tools():
    t = AsyncMock()
    t.run.return_value = ('{"price": 100}', False)
    return t


async def collect(service, turns=None, context="<user_context>{}</user_context>"):
    turns = turns or [{"role": "user", "content": "Prix du BTC ?"}]
    return [event async for event in service.stream_reply(turns, context)]


def api_error(cls, status):
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    return cls("err", response=httpx.Response(status, request=request), body=None)


class TestNormalizeHistory:
    def msg(self, role, content):
        return ChatMessageIn(role=role, content=content)

    def test_keeps_a_valid_conversation(self):
        turns = normalize_history(
            [self.msg("user", "a"), self.msg("assistant", "b"), self.msg("user", "c")], 20
        )
        assert [t["role"] for t in turns] == ["user", "assistant", "user"]

    def test_merges_same_role_and_drops_empty(self):
        turns = normalize_history(
            [self.msg("user", "a"), self.msg("assistant", "  "), self.msg("user", "b")], 20
        )
        assert turns == [{"role": "user", "content": "a\n\nb"}]

    def test_trims_history_and_starts_with_user(self):
        msgs = []
        for i in range(10):
            msgs += [self.msg("user", f"q{i}"), self.msg("assistant", f"a{i}")]
        msgs.append(self.msg("user", "last"))
        turns = normalize_history(msgs, 4)
        assert turns[0]["role"] == "user"
        assert turns[-1]["content"] == "last"
        assert len(turns) <= 4

    def test_caps_user_message_length(self):
        turns = normalize_history([self.msg("user", "x" * 5000)], 20)
        assert len(turns[0]["content"]) == 2000

    def test_rejects_conversation_ending_with_assistant(self):
        with pytest.raises(InvalidConversation):
            normalize_history([self.msg("user", "a"), self.msg("assistant", "b")], 20)


class TestBuildUserContext:
    def test_filters_invalid_watchlist_ids(self):
        ctx = build_user_context("usd", ["bitcoin", "<script>", "Ethereum"], None)
        assert '"bitcoin"' in ctx
        assert "<script>" not in ctx
        assert "Ethereum" not in ctx
        assert '"currency": "usd"' in ctx

    def test_includes_portfolio(self):
        portfolio = PortfolioIn(
            balance=5000, initial_balance=10000, realized_pnl=12,
            holdings=[
                HoldingIn(coin_id="solana", symbol="SOL", amount=2, avg_buy_price=150),
                HoldingIn(coin_id="Bad Id!", symbol="BAD", amount=1, avg_buy_price=1),
            ],
        )
        ctx = build_user_context("eur", [], portfolio)
        assert "simulated_portfolio" in ctx
        assert '"coin_id": "solana"' in ctx
        assert "Bad Id!" not in ctx
        assert ctx.startswith("<user_context>")


class TestStreamReply:
    async def test_streams_a_plain_answer(self, tools):
        client = FakeClient([turn("end_turn", [text_block("Salut")], streamed=["Sal", "ut"])])
        events = await collect(ChatService(client, tools, "model-x"))

        assert events == [
            {"type": "text", "text": "Sal"},
            {"type": "text", "text": "ut"},
            {"type": "done"},
        ]
        call = client.calls[0]
        assert call["model"] == "model-x"
        assert call["output_config"] == {"effort": "low"}
        last = call["messages"][-1]
        assert last["content"][0]["text"].startswith("<user_context>")
        assert last["content"][1]["text"] == "Prix du BTC ?"
        tools.run.assert_not_called()

    async def test_runs_tools_then_answers(self, tools):
        tool_turn = turn("tool_use", [
            tool_block("t1", "get_coin", {"coin_id": "bitcoin", "currency": "eur"}),
            tool_block("t2", "get_trending", {}),
        ])
        client = FakeClient([tool_turn, turn("end_turn", [], streamed=["100 €"])])
        events = await collect(ChatService(client, tools, "m"))

        assert {"type": "tool", "name": "get_coin"} in events
        assert {"type": "tool", "name": "get_trending"} in events
        assert events[-2:] == [{"type": "text", "text": "100 €"}, {"type": "done"}]
        assert tools.run.await_count == 2

        second = client.calls[1]["messages"]
        assert second[-2]["role"] == "assistant"
        results = second[-1]["content"]
        assert [r["tool_use_id"] for r in results] == ["t1", "t2"]
        assert all(r["type"] == "tool_result" for r in results)

    async def test_refusal_gives_a_polite_message(self, tools):
        client = FakeClient([turn("refusal", [])])
        events = await collect(ChatService(client, tools, "m"))
        assert events == [{"type": "text", "text": REFUSAL_MESSAGE}, {"type": "done"}]

    async def test_truncated_tool_call_is_not_run(self, tools):
        client = FakeClient([turn("max_tokens", [tool_block("t1", "get_coin", {})])])
        events = await collect(ChatService(client, tools, "m"))
        assert events == [{"type": "error", "message": ERROR_MESSAGES["incomplete"]}]
        tools.run.assert_not_called()

    async def test_stops_after_too_many_tool_rounds(self, tools):
        loop = [turn("tool_use", [tool_block(f"t{i}", "get_trending", {})])
                for i in range(MAX_TOOL_ROUNDS + 1)]
        events = await collect(ChatService(FakeClient(loop), tools, "m"))
        assert events[-1] == {"type": "error", "message": ERROR_MESSAGES["incomplete"]}
        assert tools.run.await_count == MAX_TOOL_ROUNDS

    async def test_retries_unparseable_tool_json(self, tools):
        bad = {"events": [], "raise": ValueError("bad json"), "message": None}
        client = FakeClient([bad, turn("end_turn", [], streamed=["ok"])])
        events = await collect(ChatService(client, tools, "m"))
        assert events == [{"type": "text", "text": "ok"}, {"type": "done"}]
        assert len(client.calls) == 2

    async def test_does_not_retry_after_text_was_sent(self, tools):
        bad = {"events": [SimpleNamespace(type="text", text="Je")],
               "raise": ValueError("bad json"), "message": None}
        client = FakeClient([bad])
        events = await collect(ChatService(client, tools, "m"))
        assert events[-1] == {"type": "error", "message": ERROR_MESSAGES["incomplete"]}

    async def test_rate_limit_error(self, tools):
        client = FakeClient([api_error(anthropic.RateLimitError, 429)])
        events = await collect(ChatService(client, tools, "m"))
        assert events == [{"type": "error", "message": ERROR_MESSAGES["rate_limited"]}]

    async def test_api_error(self, tools):
        client = FakeClient([api_error(anthropic.InternalServerError, 500)])
        events = await collect(ChatService(client, tools, "m"))
        assert events == [{"type": "error", "message": ERROR_MESSAGES["unavailable"]}]

    async def test_connection_error(self, tools):
        request = httpx.Request("POST", "https://api.anthropic.com")
        client = FakeClient([anthropic.APIConnectionError(request=request)])
        events = await collect(ChatService(client, tools, "m"))
        assert events == [{"type": "error", "message": ERROR_MESSAGES["unavailable"]}]
