import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.services.email.email_sender import EmailMessage


class SmtpEmailSender:
    def __init__(self, host: str, port: int, username: str, password: str) -> None:
        self._host = host
        self._port = port
        self._username = username
        self._password = password

    async def send(self, message: EmailMessage) -> None:
        mime = MIMEMultipart("alternative")
        mime["Subject"] = message.subject
        mime["From"] = self._username
        mime["To"] = message.to
        mime.attach(MIMEText(message.html_body, "html", "utf-8"))

        await aiosmtplib.send(
            mime,
            hostname=self._host,
            port=self._port,
            username=self._username,
            password=self._password,
            start_tls=True,
        )
