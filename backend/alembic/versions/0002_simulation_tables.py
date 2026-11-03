"""Add the logged-in simulation tables: sim_portfolio, sim_trade, sim_snapshot.

Same approach as 0001 (tables are also created by SQLModel's create_all at
startup, which runs after migrations):
- an existing database gets the tables it lacks;
- a fresh database (no "user" table yet) is left alone: create_all builds
  every table, these included, right after.

Revision ID: 0002_simulation_tables
Revises: 0001_user_token_version
Create Date: 2026-11-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_simulation_tables"
down_revision: Union[str, None] = "0001_user_token_version"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

QUANTITY = sa.Numeric(30, 12)
PRICE = sa.Numeric(30, 12)
MONEY = sa.Numeric(24, 8)


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table("user"):
        return

    if not inspector.has_table("sim_portfolio"):
        op.create_table(
            "sim_portfolio",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False),
            sa.Column("initial_capital", MONEY, nullable=False),
            sa.Column("country", sa.String(length=2), nullable=False),
            sa.Column("fee_rate", sa.Numeric(8, 6), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_sim_portfolio_user_id", "sim_portfolio", ["user_id"], unique=True)

    if not inspector.has_table("sim_trade"):
        op.create_table(
            "sim_trade",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("portfolio_id", sa.Integer(), sa.ForeignKey("sim_portfolio.id"), nullable=False),
            sa.Column("coin_id", sa.String(length=100), nullable=False),
            sa.Column("coin_symbol", sa.String(length=50), nullable=False),
            sa.Column("coin_name", sa.String(length=200), nullable=False),
            sa.Column("coin_image", sa.String(length=500), nullable=False),
            sa.Column("side", sa.String(length=4), nullable=False),
            sa.Column("quantity", QUANTITY, nullable=False),
            sa.Column("price", PRICE, nullable=False),
            sa.Column("gross", MONEY, nullable=False),
            sa.Column("fee", MONEY, nullable=False),
            sa.Column("crypto_value_before", MONEY, nullable=True),
            sa.Column("executed_at", sa.DateTime(timezone=True), nullable=False),
        )
        op.create_index("ix_sim_trade_portfolio_id", "sim_trade", ["portfolio_id"])

    if not inspector.has_table("sim_snapshot"):
        op.create_table(
            "sim_snapshot",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("portfolio_id", sa.Integer(), sa.ForeignKey("sim_portfolio.id"), nullable=False),
            sa.Column("day", sa.Date(), nullable=False),
            sa.Column("total_value", MONEY, nullable=False),
            sa.Column("cash", MONEY, nullable=False),
            sa.UniqueConstraint("portfolio_id", "day", name="uq_sim_snapshot_day"),
        )
        op.create_index("ix_sim_snapshot_portfolio_id", "sim_snapshot", ["portfolio_id"])


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    for table in ("sim_snapshot", "sim_trade", "sim_portfolio"):
        if inspector.has_table(table):
            op.drop_table(table)
