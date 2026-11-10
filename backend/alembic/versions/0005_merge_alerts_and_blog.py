"""Merge the price-alerts and blog migration branches.

feat/blog (0003_user_role_and_blog -> 0004_blog_cover_image) and the price
alerts (0003_price_alerts) were both written on top of 0002_simulation_tables,
which left two heads and made `alembic upgrade head` fail at startup. This
revision only joins them: nothing to change in the schema.

Revision ID: 0005_merge_alerts_and_blog
Revises: 0003_price_alerts, 0004_blog_cover_image
Create Date: 2026-11-10
"""

from typing import Sequence, Union

revision: str = "0005_merge_alerts_and_blog"
down_revision: Union[str, Sequence[str], None] = (
    "0003_price_alerts",
    "0004_blog_cover_image",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
