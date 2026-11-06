"""Add price alerts and email confirmation.

Same approach as 0001 and 0002 (tables are also created by SQLModel's create_all
at startup, which runs after migrations):
- an existing database gets what it lacks; Google accounts count as confirmed,
  since Google already verified their address, and other accounts start
  unconfirmed;
- a fresh database (no "user" table yet) is left alone: create_all builds
  everything, these included, right after.

Revision ID: 0003_price_alerts
Revises: 0002_simulation_tables
Create Date: 2026-11-06
"""

from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_price_alerts"
down_revision: Union[str, None] = "0002_simulation_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PRICE = sa.Numeric(30, 12)
USER_COLUMNS = ("email_verified_at", "email_verification_sent_at")


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("user"):
        return

    existing = {c["name"] for c in inspector.get_columns("user")}
    missing = [name for name in USER_COLUMNS if name not in existing]
    if missing:
        with op.batch_alter_table("user") as batch:
            for name in missing:
                batch.add_column(sa.Column(name, sa.DateTime(timezone=True), nullable=True))

    if "email_verified_at" in missing:
        user = sa.table(
            "user",
            sa.column("google_id", sa.String()),
            sa.column("email_verified_at", sa.DateTime(timezone=True)),
        )
        op.execute(
            user.update()
            .where(user.c.google_id.is_not(None))
            .values(email_verified_at=datetime.now(timezone.utc))
        )

    if not inspector.has_table("price_alert"):
        op.create_table(
            "price_alert",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
            sa.Column("coin_id", sa.String(length=100), nullable=False),
            sa.Column("coin_symbol", sa.String(length=50), nullable=False),
            sa.Column("coin_name", sa.String(length=200), nullable=False),
            sa.Column("coin_image", sa.String(length=500), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False),
            sa.Column("direction", sa.String(length=5), nullable=False),
            sa.Column("threshold", PRICE, nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("triggered_price", PRICE, nullable=True),
            sa.UniqueConstraint(
                "user_id", "coin_id", "currency", "direction", "threshold", name="uq_price_alert_rule"
            ),
        )
        op.create_index("ix_price_alert_user_id", "price_alert", ["user_id"])
        op.create_index("ix_price_alert_is_active", "price_alert", ["is_active"])


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if inspector.has_table("price_alert"):
        op.drop_table("price_alert")
    if not inspector.has_table("user"):
        return
    existing = {c["name"] for c in inspector.get_columns("user")}
    present = [name for name in USER_COLUMNS if name in existing]
    if present:
        with op.batch_alter_table("user") as batch:
            for name in present:
                batch.drop_column(name)
