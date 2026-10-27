import os
from google.auth.transport import requests
from google.oauth2 import id_token
from app.interface.protocol.GoogleAuthProvider import GoogleAuthProviderProtocol, GoogleUserInfo


class GoogleAuthNotConfigured(ValueError):
    """GOOGLE_CLIENT_ID is missing on the server."""


class InvalidGoogleCredentials(ValueError):
    """The Google ID token is invalid, expired, or its email is not verified."""


class GoogleAuthProvider(GoogleAuthProviderProtocol):
    def __init__(self, client_id: str | None = None) -> None:
        self.client_id = client_id or os.getenv("GOOGLE_CLIENT_ID")

    def verify_credentials(self, credentials):
        if not self.client_id:
            raise GoogleAuthNotConfigured("GOOGLE_CLIENT_ID is not configured.")

        try:
            payload = id_token.verify_oauth2_token(
                credentials.credentials,
                requests.Request(),
                self.client_id,
                clock_skew_in_seconds=10,
            )
        except ValueError as exc:
            raise InvalidGoogleCredentials("Invalid Google credentials.") from exc

        # Accounts are linked by email, so an unverified Google email could
        # otherwise sign in as the owner of an existing account with that email.
        verified = payload.get("email_verified") in (True, "true")
        if not verified or not payload.get("email"):
            raise InvalidGoogleCredentials("Google email is not verified.")

        return GoogleUserInfo(
            email=payload["email"].lower(),
            full_name=payload.get("name"),
            google_id=payload.get("sub"),
        )
