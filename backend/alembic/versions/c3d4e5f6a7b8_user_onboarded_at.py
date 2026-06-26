"""add users.onboarded_at (onboarding gate)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-26 00:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('onboarded_at', sa.DateTime(timezone=True), nullable=True))
    # Existing users already have their structure — mark them onboarded so they
    # aren't sent through the first-run wizard.
    op.execute("UPDATE users SET onboarded_at = now() WHERE onboarded_at IS NULL")


def downgrade() -> None:
    op.drop_column('users', 'onboarded_at')
