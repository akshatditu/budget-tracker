"""add subscriptions (recurring payments) + transactions.subscription_id

amount is EncryptedNumeric -> sa.Text(), like the other money columns.

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-09-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'd0e1f2a3b4c5'
down_revision: Union[str, None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('subcategory_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('amount', sa.Text(), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['subcategory_id'], ['subcategories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_subscriptions_user_id', 'subscriptions', ['user_id'])
    op.create_index('ix_subscriptions_subcategory_id', 'subscriptions', ['subcategory_id'])
    op.create_index('ix_subscriptions_next_due_date', 'subscriptions', ['next_due_date'])

    op.add_column('transactions', sa.Column('subscription_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_transactions_subscription_id', 'transactions', 'subscriptions',
        ['subscription_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index('ix_transactions_subscription_id', 'transactions', ['subscription_id'])


def downgrade() -> None:
    op.drop_index('ix_transactions_subscription_id', table_name='transactions')
    op.drop_constraint('fk_transactions_subscription_id', 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'subscription_id')
    op.drop_index('ix_subscriptions_next_due_date', table_name='subscriptions')
    op.drop_index('ix_subscriptions_subcategory_id', table_name='subscriptions')
    op.drop_index('ix_subscriptions_user_id', table_name='subscriptions')
    op.drop_table('subscriptions')
