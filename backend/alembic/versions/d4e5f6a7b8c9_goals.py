"""add goals + goal_contributions (sinking funds)

Money columns are EncryptedNumeric, whose impl is Text — so they render as sa.Text()
here, matching the encrypt_money migration. No server_default on amounts (a plaintext
default would bypass encryption); the app always supplies them.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-26 00:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'goals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('target_amount', sa.Text(), nullable=False),
        sa.Column('target_date', sa.Date(), nullable=True),
        sa.Column('archived', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_goals_user_id', 'goals', ['user_id'])

    op.create_table(
        'goal_contributions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Text(), nullable=False),
        sa.Column('contrib_date', sa.Date(), nullable=False),
        sa.Column('note', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_goal_contributions_user_id', 'goal_contributions', ['user_id'])
    op.create_index('ix_goal_contributions_goal_id', 'goal_contributions', ['goal_id'])
    op.create_index('ix_goal_contributions_contrib_date', 'goal_contributions', ['contrib_date'])


def downgrade() -> None:
    op.drop_index('ix_goal_contributions_contrib_date', table_name='goal_contributions')
    op.drop_index('ix_goal_contributions_goal_id', table_name='goal_contributions')
    op.drop_index('ix_goal_contributions_user_id', table_name='goal_contributions')
    op.drop_table('goal_contributions')
    op.drop_index('ix_goals_user_id', table_name='goals')
    op.drop_table('goals')
