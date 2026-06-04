from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.user_repository import UserRepositoryProtocol
from app.schemas.auth import AuthRegistrationRequest
from app.utils.security import PasswordHasher


class AuthService:
    def __init__(
        self,
        user_repository: UserRepositoryProtocol,
        password_hasher: PasswordHasher | None = None,
    ) -> None:
        self.user_repository = user_repository
        self.password_hasher = password_hasher or PasswordHasher()

    async def register_user(self, registration_data: AuthRegistrationRequest) -> User:
        normalized_email = registration_data.email.lower()
        existing_user = await self.user_repository.get_by_email(normalized_email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un compte existe déjà pour cette adresse e-mail.",
            )

        hashed_password = self.password_hasher.hash(registration_data.password)
        user = User(
            full_name=registration_data.full_name,
            email=normalized_email,
            hashed_password=hashed_password,
            is_active=True,
        )
        return await self.user_repository.create(user)
