import os 
from google.auth.transport import requests
from google.oauth2 import id_token
from app.interface.protocol.GoogleAuthProvider import GoogleAuthProviderProtocol, GoogleUserInfo



class GoogleAuthProvider(GoogleAuthProviderProtocol):
    def __init__(self, client_id : str| None = None ) -> None:
        self.client_id = client_id or os.getenv("GOOGLE_CLIENT_ID")
        
    def verify_credentials(self, credentials):
        print(os.getenv("GOOGLE_CLIENT_ID"))
        if not self.client_id:
            raise ValueError("GOOGLE_CLIENT_ID is not configured.")
        
        try:
            payload = id_token.verify_oauth2_token(credentials, requests.Request(), self.client_id)
        except ValueError as exc :
            raise ValueError("Invalid Google credentials.") from exc

        
        return GoogleUserInfo(
            email=payload["email"],
            full_name=payload.get("name"),
            google_id=payload.get("sub")
        )