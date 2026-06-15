from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.schemas.contact import ContactRequest
from app.services.contact_service import ContactService
from app.services.email.smtp_email_sender import SmtpEmailSender

router = APIRouter(prefix="/contact", tags=["contact"])


def get_contact_service() -> ContactService:
    sender = SmtpEmailSender(
        host=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
    )
    return ContactService(sender, recipient=settings.SMTP_RECIPIENT)


@router.post("/send", status_code=status.HTTP_200_OK)
async def send_contact(
    data: ContactRequest,
    service: ContactService = Depends(get_contact_service),
) -> dict:
    try:
        await service.send_contact_email(data)
        return {"message": "Message envoyé avec succès."}
    except Exception as exc:
        print(exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'envoi du message. Veuillez réessayer.",
        ) from exc
