"""drop weight from goal_subcategory_links

Revision ID: 4c2f1a8b3e9d
Revises: 3b1e74ffd41d
Create Date: 2026-06-26

Weight is no longer stored — contribution is computed dynamically as
min(goal.target, max(0, subcat_unspent - prior_claims)) at read time.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4c2f1a8b3e9d"
down_revision: Union[str, None] = "3b1e74ffd41d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("goal_subcategory_links", "weight")


def downgrade() -> None:
    op.add_column(
        "goal_subcategory_links",
        sa.Column(
            "weight",
            sa.Numeric(precision=5, scale=2),
            nullable=False,
            server_default="100",
        ),
    )
