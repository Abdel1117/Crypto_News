import asyncio
import json
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    def has_clients(self) -> bool:
        return len(self.active) > 0

    async def broadcast(self, channel: str, data):
        payload = json.dumps({"channel": channel, "data": data})
        for ws in list(self.active):
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
