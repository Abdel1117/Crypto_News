"""Add user.role and the blog tables: blog_article, blog_comment, blog_like, blog_favorite.

Same approach as 0001 and 0002 (tables are also created by SQLModel's
create_all at startup, which runs after migrations):
- an existing "user" table without the column gets it, set to "user" for everyone;
- an existing database gets the blog tables it lacks;
- a fresh database (no "user" table yet) is left alone: create_all builds
  every table, these included, right after.

Revision ID: 0003_user_role_and_blog
Revises: 0002_simulation_tables
Create Date: 2026-11-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_user_role_and_blog"
down_revision: Union[str, None] = "0002_simulation_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BLOG_TABLES = ("blog_favorite", "blog_like", "blog_comment", "blog_article")


def _timestamp(name: str, nullable: bool = False) -> sa.Column:
    return sa.Column(name, sa.DateTime(timezone=True), nullable=nullable)


def _reaction_table(name: str, constraint: str) -> None:
    op.create_table(
        name,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("blog_article.id"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
        _timestamp("created_at"),
        sa.UniqueConstraint("user_id", "article_id", name=constraint),
    )
    op.create_index(f"ix_{name}_article_id", name, ["article_id"])
    op.create_index(f"ix_{name}_user_id", name, ["user_id"])


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("user"):
        return

    if "role" not in {c["name"] for c in inspector.get_columns("user")}:
        with op.batch_alter_table("user") as batch:
            batch.add_column(
                sa.Column("role", sa.String(length=10), nullable=False, server_default="user")
            )

    if not inspector.has_table("blog_article"):
        op.create_table(
            "blog_article",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("slug", sa.String(length=180), nullable=False),
            sa.Column("title", sa.String(length=160), nullable=False),
            sa.Column("excerpt", sa.String(length=300), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("category", sa.String(length=40), nullable=False),
            sa.Column("status", sa.String(length=10), nullable=False),
            sa.Column("author_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
            sa.Column("read_minutes", sa.Integer(), nullable=False),
            _timestamp("created_at"),
            _timestamp("updated_at"),
            _timestamp("published_at", nullable=True),
        )
        op.create_index("ix_blog_article_slug", "blog_article", ["slug"], unique=True)
        op.create_index("ix_blog_article_category", "blog_article", ["category"])
        op.create_index("ix_blog_article_status", "blog_article", ["status"])
        op.create_index("ix_blog_article_author_id", "blog_article", ["author_id"])

    if not inspector.has_table("blog_comment"):
        op.create_table(
            "blog_comment",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("article_id", sa.Integer(), sa.ForeignKey("blog_article.id"), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
            sa.Column("body", sa.String(length=2000), nullable=False),
            _timestamp("created_at"),
        )
        op.create_index("ix_blog_comment_article_id", "blog_comment", ["article_id"])
        op.create_index("ix_blog_comment_user_id", "blog_comment", ["user_id"])

    if not inspector.has_table("blog_like"):
        _reaction_table("blog_like", "uq_blog_like")
    if not inspector.has_table("blog_favorite"):
        _reaction_table("blog_favorite", "uq_blog_favorite")


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    for table in BLOG_TABLES:
        if inspector.has_table(table):
            op.drop_table(table)
    if inspector.has_table("user") and "role" in {
        c["name"] for c in inspector.get_columns("user")
    }:
        with op.batch_alter_table("user") as batch:
            batch.drop_column("role")
