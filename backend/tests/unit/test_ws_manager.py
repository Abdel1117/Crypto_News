import json
import pytest
from unittest.mock import AsyncMock

from app.services.ws_manager import ConnectionManager


@pytest.fixture
def manager():
    return ConnectionManager()


def make_websocket():
    return AsyncMock()


class TestConnect:
    async def test_calls_accept_on_websocket(self, manager):
        ws = make_websocket()
        await manager.connect(ws)
        ws.accept.assert_called_once()

    async def test_adds_websocket_to_active_list(self, manager):
        ws = make_websocket()
        await manager.connect(ws)
        assert ws in manager.active

    async def test_multiple_connections_are_tracked(self, manager):
        ws1 = make_websocket()
        ws2 = make_websocket()
        await manager.connect(ws1)
        await manager.connect(ws2)
        assert len(manager.active) == 2


class TestDisconnect:
    def test_removes_websocket_from_active_list(self, manager):
        ws = make_websocket()
        manager.active.append(ws)
        manager.disconnect(ws)
        assert ws not in manager.active

    def test_does_not_raise_for_unknown_websocket(self, manager):
        ws = make_websocket()
        manager.disconnect(ws)  # should not raise
        assert ws not in manager.active

    def test_only_removes_the_target_websocket(self, manager):
        ws1 = make_websocket()
        ws2 = make_websocket()
        manager.active = [ws1, ws2]
        manager.disconnect(ws1)
        assert ws2 in manager.active
        assert ws1 not in manager.active


class TestBroadcast:
    async def test_sends_json_payload_to_all_connections(self, manager):
        ws1 = make_websocket()
        ws2 = make_websocket()
        manager.active = [ws1, ws2]

        await manager.broadcast("markets", {"price": 50000})

        expected = json.dumps({"channel": "markets", "data": {"price": 50000}})
        ws1.send_text.assert_called_once_with(expected)
        ws2.send_text.assert_called_once_with(expected)

    async def test_removes_failed_connection_from_active(self, manager):
        ws_ok = make_websocket()
        ws_fail = make_websocket()
        ws_fail.send_text.side_effect = Exception("Connection closed")
        manager.active = [ws_ok, ws_fail]

        await manager.broadcast("markets", {})

        assert ws_fail not in manager.active
        assert ws_ok in manager.active

    async def test_continues_broadcasting_after_failed_connection(self, manager):
        ws_fail = make_websocket()
        ws_fail.send_text.side_effect = Exception("closed")
        ws_ok = make_websocket()
        manager.active = [ws_fail, ws_ok]

        await manager.broadcast("markets", {"price": 1})

        ws_ok.send_text.assert_called_once()

    async def test_broadcast_to_empty_list_does_not_raise(self, manager):
        manager.active = []
        await manager.broadcast("markets", {})  # should not raise

    async def test_payload_includes_channel_name(self, manager):
        ws = make_websocket()
        manager.active = [ws]

        await manager.broadcast("trending", [])

        call_arg = ws.send_text.call_args[0][0]
        payload = json.loads(call_arg)
        assert payload["channel"] == "trending"
