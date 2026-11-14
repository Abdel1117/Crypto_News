"""Confirms that a user owns their address before alerts are sent to it.

Registration doesn't check the address, so without this anyone could sign up
with someone else's email and send them alerts.
"""

import logging
from datetime import timedelta

from fastapi import HTTPException, status

from app.auth.email_tokens import PURPOSE_CONFIRM_EMAIL, read_email_token
from app.models.user import User
from app.interface.user_repository import AbstractUserRepository
from app.interface.email_sender import AbstractEmailSender
from app.services.email.messages import confirmation_email
from app.utils.dates import as_utc, utcnow

logger = logging.getLogger(__name__)

# Whoever holds an account can make it email its address, confirmed or not: this
# limits how often that can land in the inbox of someone who didn't ask.
RESEND_COOLDOWN = timedelta(minutes=5)


class EmailVerificationService:
    def __init__(self, users: AbstractUserRepository, sender: AbstractEmailSender | None) -> None:
        self.users = users
        self.sender = sender

    async def send_link(self, user: User) -> bool:
        """Emails a confirmation link. False when the address is already confirmed."""
        if user.email_verified_at is not None:
            return False
        if self.sender is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "L'envoi d'e-mails n'est pas disponible pour le moment.",
            )

        now = utcnow()
        previous = user.email_verification_sent_at
        if previous is not None and now - as_utc(previous) < RESEND_COOLDOWN:
            raise HTTPException(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "Un e-mail vient d'être envoyé. Vérifie ta boîte de réception, "
                "ou réessaie dans quelques minutes.",
            )

        user.email_verification_sent_at = now
        await self.users.update(user)
        try:
            await self.sender.send(confirmation_email(user.email, user.id))
        except Exception as exc:
            logger.exception("Confirmation email could not be sent")
            # Nothing was received: the user can try again right away.
            user.email_verification_sent_at = previous
            await self.users.update(user)
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                "L'e-mail n'a pas pu être envoyé. Réessaie dans un instant.",
            ) from exc
        return True

    async def confirm(self, token: str) -> None:
        user_id = read_email_token(token, PURPOSE_CONFIRM_EMAIL)
        user = await self.users.get_by_id(user_id) if user_id is not None else None
        if user is None or not user.is_active:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Lien invalide ou expiré.")
        if user.email_verified_at is None:
            user.email_verified_at = utcnow()
            await self.users.update(user)
