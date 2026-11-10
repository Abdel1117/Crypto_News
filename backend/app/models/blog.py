"""Blog tables: articles written by editors and admins, and what readers do
with them (comments, likes, favorites).

Like and comment counts are not stored: they are counted when read.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, DateTime, String, Text, UniqueConstraint
from sqlmodel import Field, SQLModel

ARTICLE_DRAFT = "draft"
ARTICLE_PUBLISHED = "published"


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _timestamp(nullable: bool = False) -> Column:
    return Column(DateTime(timezone=True), nullable=nullable)


class BlogArticle(SQLModel, table=True):
    __tablename__ = "blog_article"

    id: Optional[int] = Field(default=None, primary_key=True)
    # Set once from the title, never changed: links and search results stay valid.
    slug: str = Field(sa_column=Column(String(180), unique=True, index=True, nullable=False))
    title: str = Field(max_length=160, nullable=False)
    excerpt: str = Field(max_length=300, nullable=False)
    body: str = Field(sa_column=Column(Text, nullable=False))  # Markdown
    category: str = Field(max_length=40, nullable=False, index=True)
    status: str = Field(default=ARTICLE_DRAFT, max_length=10, nullable=False, index=True)
    author_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    read_minutes: int = Field(default=1, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, sa_column=_timestamp())
    updated_at: datetime = Field(default_factory=_utcnow, sa_column=_timestamp())
    # Set the first time the article is published, kept if it is unpublished.
    published_at: Optional[datetime] = Field(default=None, sa_column=_timestamp(nullable=True))
    # Cover image: key of the files kept by ImageStore, and its text alternative
    # (both set, or both empty).
    cover_image: Optional[str] = Field(default=None, max_length=32, nullable=True)
    cover_alt: Optional[str] = Field(default=None, max_length=200, nullable=True)


class BlogComment(SQLModel, table=True):
    __tablename__ = "blog_comment"

    id: Optional[int] = Field(default=None, primary_key=True)
    article_id: int = Field(foreign_key="blog_article.id", index=True, nullable=False)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    body: str = Field(max_length=2000, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, sa_column=_timestamp())


class BlogLike(SQLModel, table=True):
    __tablename__ = "blog_like"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_blog_like"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    article_id: int = Field(foreign_key="blog_article.id", index=True, nullable=False)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, sa_column=_timestamp())


class BlogFavorite(SQLModel, table=True):
    __tablename__ = "blog_favorite"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_blog_favorite"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    article_id: int = Field(foreign_key="blog_article.id", index=True, nullable=False)
    user_id: int = Field(foreign_key="user.id", index=True, nullable=False)
    created_at: datetime = Field(default_factory=_utcnow, sa_column=_timestamp())
