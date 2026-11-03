import html
import re

from app.schemas.contact import ContactRequest
from app.services.email.email_sender import EmailMessage, IEmailSender


def _single_line(value: str) -> str:
    """Line breaks in a header would let a sender add their own headers."""
    return re.sub(r"[\r\n]+", " ", value).strip()


class ContactService:
    def __init__(self, email_sender: IEmailSender, recipient: str) -> None:
        self._sender = email_sender
        self._recipient = recipient

    async def send_contact_email(self, data: ContactRequest) -> None:
        # Everything the visitor typed is escaped: the email is HTML, and raw
        # input could add links or markup to the message the owner reads.
        name = html.escape(data.name)
        email = html.escape(data.email, quote=True)
        phone = html.escape(data.phone) if data.phone else "Non renseigné"
        message = html.escape(data.message).replace("\n", "<br />")

        body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
            <h2 style="color: #f9b707; border-bottom: 2px solid #f9b707; padding-bottom: 8px;">
              Nouveau message de contact
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nom</td>
                <td style="padding: 8px 0;">{name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email</td>
                <td style="padding: 8px 0;">
                  <a href="mailto:{email}" style="color: #f9b707;">{email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Téléphone</td>
                <td style="padding: 8px 0;">{phone}</td>
              </tr>
            </table>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-weight: bold;">Message :</p>
            <p style="background: #f7f7f7; padding: 16px; border-radius: 8px; line-height: 1.6;">
              {message}
            </p>
          </body>
        </html>
        """

        await self._sender.send(
            EmailMessage(
                to=self._recipient,
                subject=f"[Contact] Message de {_single_line(data.name)}",
                html_body=body,
            )
        )
