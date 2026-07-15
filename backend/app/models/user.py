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
    provider: AuthProvider = Field(default=AuthProvider.local)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=False), nullable=False),
    )


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
