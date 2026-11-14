from abc import ABC, abstractmethod

from app.services.email.email_sender import EmailMessage


class AbstractEmailSender(ABC):
    @abstractmethod
    async def send(self, message: EmailMessage) -> None: ...
