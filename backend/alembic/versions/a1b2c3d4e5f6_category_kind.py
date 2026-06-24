"""add category kind (spending|investment)

Revision ID: a1b2c3d4e5f6
Revises: 0d7cc7b28699
Create Date: 2026-06-24 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '0d7cc7b28699'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'categories',
        sa.Column('kind', sa.String(length=20), nullable=False, server_default='spending'),
    )
    # Existing "Investments" categories become retained-wealth (investment) sections.
    op.execute("UPDATE categories SET kind='investment' WHERE name='Investments'")


def downgrade() -> None:
    op.drop_column('categories', 'kind')
