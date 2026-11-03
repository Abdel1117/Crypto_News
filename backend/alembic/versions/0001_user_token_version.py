"""Add user.token_version, used to revoke tokens on logout.

Tables are still created by SQLModel's create_all at startup, so this migration
only changes what already exists:
- an existing "user" table without the column gets it, set to 0 for everyone;
- a fresh database (no "user" table yet, or one create_all already built with
  the column) is left alone.

Revision ID: 0001_user_token_version
Revises:
Create Date: 2026-10-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_user_token_version"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table: str, column: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table):
        return True  # nothing to migrate: create_all will build it complete
    return column in {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    if _has_column("user", "token_version"):
        return
    with op.batch_alter_table("user") as batch:
        batch.add_column(
            sa.Column("token_version", sa.Integer(), nullable=False, server_default="0")
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("user"):
        return
    if "token_version" not in {c["name"] for c in inspector.get_columns("user")}:
        return
    with op.batch_alter_table("user") as batch:
        batch.drop_column("token_version")
