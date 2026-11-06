from datetime import datetime
from typing import Optional
from app.enums.auth_provider import AuthProvider
from sqlmodel import Column, DateTime, Field, SQLModel, String


class UserBase(SQLModel):
    google_id: Optional[str] = Field(
        default=None,
        index=True,
        unique=True,
    )    
    full_name: str = Field(sa_column=Column("full_name", String, nullable=False))
    email: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))
    hashed_password: Optional[str] = Field(default=None, nullable=True)    
    is_active: bool = Field(default=True, nullable=False)
    # Incremented on logout: every token carrying an older version is rejected.
    token_version: int = Field(
        default=0, nullable=False, sa_column_kwargs={"server_default": "0"}
    )
    provider: AuthProvider = Field(default=AuthProvider.local)
    # Set once the address is proven: a confirmation link, or a Google sign-in.
    # Emails other than the confirmation itself only go to confirmed addresses.
    email_verified_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    # Last confirmation email, to limit how often one can be requested.
    email_verification_sent_at: Optional[datetime] = Field(
        default=None, sa_column=Column(DateTime(timezone=True), nullable=True)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=False), nullable=False),
    )


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
