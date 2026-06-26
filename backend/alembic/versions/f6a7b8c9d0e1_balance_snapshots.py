"""add balance_snapshots (reconciliation)

actual_balance is EncryptedNumeric -> sa.Text(), like the other money columns.

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-26 00:40:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'balance_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('budget_year_id', sa.Integer(), nullable=False),
        sa.Column('as_of_date', sa.Date(), nullable=False),
        sa.Column('actual_balance', sa.Text(), nullable=False),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['budget_year_id'], ['budget_years.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_balance_snapshots_user_id', 'balance_snapshots', ['user_id'])
    op.create_index('ix_balance_snapshots_budget_year_id', 'balance_snapshots', ['budget_year_id'])
    op.create_index('ix_balance_snapshots_as_of_date', 'balance_snapshots', ['as_of_date'])


def downgrade() -> None:
    op.drop_index('ix_balance_snapshots_as_of_date', table_name='balance_snapshots')
    op.drop_index('ix_balance_snapshots_budget_year_id', table_name='balance_snapshots')
    op.drop_index('ix_balance_snapshots_user_id', table_name='balance_snapshots')
    op.drop_table('balance_snapshots')
