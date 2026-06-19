from app.schemas.contact import ContactRequest
from app.services.email.email_sender import EmailMessage, IEmailSender


class ContactService:
    def __init__(self, email_sender: IEmailSender, recipient: str) -> None:
        self._sender = email_sender
        self._recipient = recipient

    async def send_contact_email(self, data: ContactRequest) -> None:
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
            <h2 style="color: #f9b707; border-bottom: 2px solid #f9b707; padding-bottom: 8px;">
              Nouveau message de contact
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nom</td>
                <td style="padding: 8px 0;">{data.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email</td>
                <td style="padding: 8px 0;">
                  <a href="mailto:{data.email}" style="color: #f9b707;">{data.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Téléphone</td>
                <td style="padding: 8px 0;">{data.phone or "Non renseigné"}</td>
              </tr>
            </table>
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="font-weight: bold;">Message :</p>
            <p style="background: #f7f7f7; padding: 16px; border-radius: 8px; line-height: 1.6;">
              {data.message}
            </p>
          </body>
        </html>
        """

        await self._sender.send(
            EmailMessage(
                to=self._recipient,
                subject=f"[Contact] Message de {data.name}",
                html_body=html,
            )
        )
