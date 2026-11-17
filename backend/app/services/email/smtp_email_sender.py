import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.interface.email_sender import AbstractEmailSender
from app.services.email.email_sender import EmailMessage


class SmtpEmailSender(AbstractEmailSender):
    def __init__(
        self, host: str, port: int, username: str, password: str, sender: str = ""
    ) -> None:
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._sender = sender or username

    async def send(self, message: EmailMessage) -> None:
        mime = MIMEMultipart("alternative")
        mime["Subject"] = message.subject
        mime["From"] = self._sender
        mime["To"] = message.to
        for name, value in message.headers.items():
            mime[name] = value
        # Mail clients show the last part they can read: HTML goes last.
        if message.text_body:
            mime.attach(MIMEText(message.text_body, "plain", "utf-8"))
        mime.attach(MIMEText(message.html_body, "html", "utf-8"))

        await aiosmtplib.send(
            mime,
            hostname=self._host,
            port=self._port,
            username=self._username,
            password=self._password,
            start_tls=True,
        )


def build_email_sender() -> SmtpEmailSender | None:
    """The configured sender; None when SMTP isn't set up."""
    if not settings.EMAIL_ENABLED:
        return None
    return SmtpEmailSender(
        host=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        sender=settings.SMTP_FROM,
    )
