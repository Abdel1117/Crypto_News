from fastapi import HTTPException, status
from jose import JWTError

from app.core.jwt_config import JWT_EXPIRATION_HOURS, TOKEN_TYPE_REFRESH
from app.models.user import User
from app.repositories.users.user_repository import UserRepositoryProtocol
from app.clients.google_auth_provider import GoogleAuthProvider
from app.schemas.auth import AuthRegistrationRequest, AuthRegistrationRequestGoogle
from app.schemas.token import TokenPair
from app.auth.token_service import TokenServiceProtocol
from app.utils.security import PasswordHasher


class AuthService:
    def __init__(
        self,
        google_auth_provider : GoogleAuthProvider,
        user_repository: UserRepositoryProtocol,
        token_service: TokenServiceProtocol | None = None,
        password_hasher: PasswordHasher | None = None,
    ) -> None:
        self.google_auth_provider = google_auth_provider
        self.user_repository = user_repository
        self.token_service = token_service
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

    async def authenticate_user(self, email: str, password: str) -> User:
        normalized_email = email.lower()
        user = await self.user_repository.get_by_email(normalized_email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not self.password_hasher.verify(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    async def login(self, email: str, password: str) -> TokenPair:
        if self.token_service is None:
            raise RuntimeError("TokenService requis pour la connexion.")

        user = await self.authenticate_user(email, password)

        access_token = self.token_service.create_access_token(str(user.id), user.email, user.full_name)
        refresh_token = self.token_service.create_refresh_token(str(user.id), user.email, user.full_name)

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=JWT_EXPIRATION_HOURS * 3600,
        )

    async def refresh_access_token(self, refresh_token: str) -> TokenPair:
        if self.token_service is None:
            raise RuntimeError("TokenService requis pour le rafraîchissement du token.")

        try:
            payload = self.token_service.verify_token(refresh_token)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token invalide ou expiré.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.token_type != TOKEN_TYPE_REFRESH:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Type de token invalide.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await self.user_repository.get_by_email(payload.email)
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur introuvable ou inactif.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        new_access_token = self.token_service.create_access_token(str(user.id), user.email, user.full_name)
        new_refresh_token = self.token_service.create_refresh_token(str(user.id), user.email, user.full_name)

        return TokenPair(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=JWT_EXPIRATION_HOURS * 3600,
        )

    async def google_auth(self, credentials : AuthRegistrationRequestGoogle) -> TokenPair: 
        if self.google_auth_provider is None : 
            raise RuntimeError("Google Auth Client requis pour la connexion.")
        
        user_info_from_google = self.google_auth_provider.verify_credentials(credentials)
        
        print(user_info_from_google)
        
        user = await self.user_repository.get_by_email(user_info_from_google.email)
        
        if user :
            new_access_token = self.token_service.create_access_token(str(user.google_id), user.email, user.full_name)
            new_refresh_token = self.token_service.create_refresh_token(str(user.google_id), user.email, user.full_name)
            return TokenPair(
                access_token=new_access_token,
                refresh_token=new_refresh_token,
                token_type="bearer",
                expires_in=JWT_EXPIRATION_HOURS * 3600,
            )
        if not user or not user.is_active:
            self.user_repository.create(user_info_from_google) 
            
            
        
        
        
        
        
        