import asyncio
import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []
        self.currency: dict[WebSocket, str] = {}

    async def connect(self, ws: WebSocket, currency: str = "eur"):
        await ws.accept()
        self.active.append(ws)
        self.currency[ws] = currency

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)
        self.currency.pop(ws, None)

    def has_clients(self) -> bool:
        return len(self.active) > 0

    def set_currency(self, ws: WebSocket, currency: str):
        self.currency[ws] = currency

    async def broadcast(self, channel: str, data):
        payload = json.dumps({"channel": channel, "data": data})
        # Iterate over a copy: a failed send removes the socket from self.active,
        # and other clients can connect or leave while we await.
        for ws in self.active.copy():
            try:
                await ws.send_text(payload)
            except Exception:
                self.disconnect(ws)

    async def broadcast_per_currency(self, channel: str, data_by_currency: dict[str, object]):
        for ws in self.active.copy():  # copy: see broadcast()
            currency =self.currency.get(ws, "eur")
            data = data_by_currency.get(currency, data_by_currency.get("eur"))
            payload = json.dumps({"channel": channel, "data": data})
            try:
                await ws.send_text(payload)
            except Exception:
                self.disconnect(ws)

    async def send_to(self, ws: WebSocket, channel: str, data):
        payload = json.dumps({"channel": channel, "data": data})
        try:
            await ws.send_text(payload)
        except Exception:
            self.disconnect(ws)


manager = ConnectionManager()
