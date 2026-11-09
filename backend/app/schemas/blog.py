from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, StringConstraints

from app.services.blog.categories import BlogCategory

ArticleStatus = Literal["draft", "published"]

MAX_BODY_LENGTH = 50_000
MAX_COMMENT_LENGTH = 2000


def _as_utc(value: datetime | None) -> datetime | None:
    # SQLite gives back naive datetimes; they are stored in UTC.
    if value is None or value.tzinfo:
        return value
    return value.replace(tzinfo=timezone.utc)


UtcDatetime = Annotated[datetime, AfterValidator(_as_utc)]
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=160)]
Excerpt = Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=300)]
Body = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_BODY_LENGTH)]
CommentBody = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_COMMENT_LENGTH)
]


# ---------- requests ----------

class ArticleCreate(BaseModel):
    title: Title
    excerpt: Excerpt
    body: Body
    category: BlogCategory
    status: ArticleStatus = "draft"


class ArticleUpdate(BaseModel):
    """Only the fields sent are changed (e.g. just the status to unpublish)."""

    title: Title | None = None
    excerpt: Excerpt | None = None
    body: Body | None = None
    category: BlogCategory | None = None
    status: ArticleStatus | None = None


class CommentCreate(BaseModel):
    body: CommentBody


# ---------- responses ----------

class ArticleSummary(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: str
    category: str
    status: ArticleStatus
    author_name: str
    read_minutes: int
    published_at: UtcDatetime | None
    updated_at: UtcDatetime
    like_count: int
    comment_count: int


class ArticleDetail(ArticleSummary):
    body: str


class ArticlesPage(BaseModel):
    items: list[ArticleSummary]
    total: int


class CommentOut(BaseModel):
    id: int
    article_id: int
    user_id: int
    author_name: str
    body: str
    created_at: UtcDatetime


class CommentsPage(BaseModel):
    items: list[CommentOut]
    total: int


class ReactionState(BaseModel):
    """The reader's like and favorite on one article, and its like count."""

    liked: bool
    favorited: bool
    like_count: int
