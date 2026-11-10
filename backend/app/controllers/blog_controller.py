from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_session
from app.dependencies.auth import get_current_user, require_editor
from app.models.user import User
from app.repositories.blog.blog_sql_repo import SQLBlogRepository
from app.schemas.blog import (
    ArticleCreate,
    ArticleDetail,
    ArticlesPage,
    ArticleSummary,
    ArticleUpdate,
    CommentCreate,
    CommentOut,
    CommentsPage,
    ImageUploaded,
    ReactionState,
)
from app.services.blog.blog_service import BlogService
from app.services.blog.categories import BlogCategory
from app.services.blog.images import MAX_BYTES, ImageStore

router = APIRouter(prefix="/blog", tags=["blog"])


def get_image_store() -> ImageStore:
    return ImageStore(Path(settings.MEDIA_DIR))


def get_blog_service(
    session: AsyncSession = Depends(get_session),
    images: ImageStore = Depends(get_image_store),
) -> BlogService:
    return BlogService(SQLBlogRepository(session), images=images)


# ---------- public: published articles only, no token read ----------

@router.get("/articles", response_model=ArticlesPage)
async def list_articles(
    category: BlogCategory | None = None,
    limit: int = Query(30, ge=1, le=60),
    offset: int = Query(0, ge=0),
    service: BlogService = Depends(get_blog_service),
):
    return await service.published(category, limit, offset)


@router.get("/articles/{slug}", response_model=ArticleDetail)
async def get_article(slug: str, service: BlogService = Depends(get_blog_service)):
    return await service.article(slug)


@router.get("/articles/{article_id}/related", response_model=list[ArticleSummary])
async def related_articles(
    article_id: int,
    limit: int = Query(3, ge=1, le=12),
    service: BlogService = Depends(get_blog_service),
):
    return await service.related(article_id, limit)


@router.get("/articles/{article_id}/comments", response_model=CommentsPage)
async def list_comments(
    article_id: int,
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    service: BlogService = Depends(get_blog_service),
):
    return await service.comments(article_id, limit, offset)


# ---------- logged-in readers ----------

@router.get("/articles/{article_id}/me", response_model=ReactionState)
async def my_reactions(
    article_id: int,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.reactions(user, article_id)


@router.put("/articles/{article_id}/like", response_model=ReactionState)
async def like_article(
    article_id: int,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.set_like(user, article_id, True)


@router.delete("/articles/{article_id}/like", response_model=ReactionState)
async def unlike_article(
    article_id: int,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.set_like(user, article_id, False)


@router.put("/articles/{article_id}/favorite", response_model=ReactionState)
async def save_article(
    article_id: int,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.set_favorite(user, article_id, True)


@router.delete("/articles/{article_id}/favorite", response_model=ReactionState)
async def unsave_article(
    article_id: int,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.set_favorite(user, article_id, False)


@router.post(
    "/articles/{article_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    article_id: int,
    data: CommentCreate,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.add_comment(user, article_id, data)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    await service.delete_comment(user, comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/favorites", response_model=list[ArticleSummary])
async def my_favorites(
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.favorites(user)


@router.get("/recommendations", response_model=list[ArticleSummary])
async def my_recommendations(
    limit: int = Query(4, ge=1, le=12),
    user: User = Depends(get_current_user),
    service: BlogService = Depends(get_blog_service),
):
    return await service.recommendations(user, limit)


# ---------- editors and admins: every article, drafts included ----------

@router.get("/manage/articles", response_model=ArticlesPage)
async def manage_articles(
    status_filter: Literal["draft", "published"] | None = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_editor),
    service: BlogService = Depends(get_blog_service),
):
    return await service.manage_list(status_filter, limit, offset)


@router.get("/manage/articles/{article_id}", response_model=ArticleDetail)
async def manage_article(
    article_id: int,
    _: User = Depends(require_editor),
    service: BlogService = Depends(get_blog_service),
):
    return await service.manage_get(article_id)


@router.post(
    "/manage/articles", response_model=ArticleDetail, status_code=status.HTTP_201_CREATED
)
async def create_article(
    data: ArticleCreate,
    user: User = Depends(require_editor),
    service: BlogService = Depends(get_blog_service),
):
    return await service.create(user, data)


@router.post(
    "/manage/images", response_model=ImageUploaded, status_code=status.HTTP_201_CREATED
)
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_editor),
    service: BlogService = Depends(get_blog_service),
):
    """A cover image (JPEG, PNG or WebP, 5 MB at most). Its key is then sent
    as `cover_image` when the article is created or updated."""
    # One byte more than allowed is enough to know the file is too heavy.
    data = await file.read(MAX_BYTES + 1)
    return ImageUploaded(key=await service.upload_image(data, file.content_type))


@router.patch("/manage/articles/{article_id}", response_model=ArticleDetail)
async def update_article(
    article_id: int,
    data: ArticleUpdate,
    _: User = Depends(require_editor),
    service: BlogService = Depends(get_blog_service),
):
    return await service.update(article_id, data)


@router.delete("/manage/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    _: User = Depends(require_editor),
    service: BlogService = Depends(get_blog_service),
):
    await service.delete(article_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
