from typing import Protocol
from dataclasses import dataclass


@dataclass(frozen=True)
class GoogleUserInfo:
    email : str
    full_name : str | None = None 
    google_id: str | None = None 

class GoogleAuthProviderProtocol(Protocol):
    
    def verify_credentials(self, credentials: str) -> GoogleUserInfo :
        pass 
    