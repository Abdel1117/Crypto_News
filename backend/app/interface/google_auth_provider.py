from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class GoogleUserInfo:
    email: str
    full_name: str | None = None
    google_id: str | None = None


class AbstractGoogleAuthProvider(ABC):
    @abstractmethod
    def verify_credentials(self, credentials: str) -> GoogleUserInfo: ...
