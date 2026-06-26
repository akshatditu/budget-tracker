"""default subcategories.rollover to ON

Flip the server_default from false -> true and turn rollover on for existing
rows (the feature was just introduced, so a flat-off default was never chosen).

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-06-26 01:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('subcategories', 'rollover', server_default=sa.text('true'))
    op.execute("UPDATE subcategories SET rollover = true WHERE rollover = false")


def downgrade() -> None:
    op.alter_column('subcategories', 'rollover', server_default=sa.text('false'))
