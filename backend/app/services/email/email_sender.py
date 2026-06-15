from dataclasses import dataclass
from typing import Protocol


@dataclass
class EmailMessage:
    to: str
    subject: str
    html_body: str


class IEmailSender(Protocol):
    async def send(self, message: EmailMessage) -> None: ...
