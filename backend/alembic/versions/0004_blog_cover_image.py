"""Add blog_article.cover_image and blog_article.cover_alt.

Same approach as the previous revisions: an existing blog_article table gets
the columns it lacks (empty: no article has an image yet); a fresh database is
left to SQLModel's create_all, which runs at startup after the migrations.

Revision ID: 0004_blog_cover_image
Revises: 0003_user_role_and_blog
Create Date: 2026-11-10
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_blog_cover_image"
down_revision: Union[str, None] = "0003_user_role_and_blog"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMNS = (
    ("cover_image", 32),
    ("cover_alt", 200),
)


def _existing_columns() -> set[str] | None:
    """blog_article's column names, or None if the table doesn't exist."""
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("blog_article"):
        return None
    return {c["name"] for c in inspector.get_columns("blog_article")}


def upgrade() -> None:
    existing = _existing_columns()
    if existing is None:
        return
    missing = [(name, length) for name, length in COLUMNS if name not in existing]
    if not missing:
        return
    with op.batch_alter_table("blog_article") as batch:
        for name, length in missing:
            batch.add_column(sa.Column(name, sa.String(length=length), nullable=True))


def downgrade() -> None:
    existing = _existing_columns()
    if existing is None:
        return
    present = [name for name, _ in COLUMNS if name in existing]
    if not present:
        return
    with op.batch_alter_table("blog_article") as batch:
        for name in present:
            batch.drop_column(name)
