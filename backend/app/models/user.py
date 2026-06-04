from datetime import datetime
from typing import Optional

from sqlmodel import Column, DateTime, Field, SQLModel, String


class UserBase(SQLModel):
    full_name: str = Field(sa_column=Column("full_name", String, nullable=False))
    email: str = Field(sa_column=Column(String, unique=True, index=True, nullable=False))
    hashed_password: str = Field(nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime(timezone=False), nullable=False),
    )


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
