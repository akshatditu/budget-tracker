"""add asset_holdings (net worth)

amount is EncryptedNumeric -> sa.Text(), like the other money columns.

Revision ID: c9d0e1f2a3b4
Revises: bf3a609b6bbb
Create Date: 2026-07-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, None] = 'bf3a609b6bbb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'asset_holdings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=True),
        sa.Column('amount', sa.Text(), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_asset_holdings_user_id', 'asset_holdings', ['user_id'])
    op.create_index('ix_asset_holdings_as_of_date', 'asset_holdings', ['as_of_date'])


def downgrade() -> None:
    op.drop_index('ix_asset_holdings_as_of_date', table_name='asset_holdings')
    op.drop_index('ix_asset_holdings_user_id', table_name='asset_holdings')
    op.drop_table('asset_holdings')
