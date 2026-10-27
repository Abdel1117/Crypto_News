from datetime import date
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class ChatUsage(SQLModel, table=True):
    """Number of chatbot messages a user sent on a given day."""

    __tablename__ = "chat_usage"
    __table_args__ = (UniqueConstraint("user_id", "day", name="uq_chat_usage_user_day"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    day: date = Field(nullable=False)
    count: int = Field(default=0, nullable=False)
