"""goal_subcategory_links

Revision ID: 3b1e74ffd41d
Revises: 39d7cad21ea3
Create Date: 2026-06-26 15:09:02.254277
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3b1e74ffd41d'
down_revision: Union[str, None] = '39d7cad21ea3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the new junction table.
    op.create_table(
        "goal_subcategory_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("goal_id", sa.Integer(), nullable=False),
        sa.Column("subcategory_id", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Numeric(5, 2), nullable=False, server_default="100"),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["subcategory_id"], ["subcategories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("goal_id", "subcategory_id", name="uq_goal_subcat_link"),
    )
    op.create_index("ix_goal_subcategory_links_goal_id", "goal_subcategory_links", ["goal_id"])
    op.create_index("ix_goal_subcategory_links_subcategory_id", "goal_subcategory_links", ["subcategory_id"])
    op.create_index("ix_goal_subcategory_links_user_id", "goal_subcategory_links", ["user_id"])

    # 2. Migrate existing single-link data from goals.linked_subcategory_id.
    op.execute(
        """
        INSERT INTO goal_subcategory_links (user_id, goal_id, subcategory_id, weight)
        SELECT user_id, id, linked_subcategory_id, 100
        FROM goals
        WHERE linked_subcategory_id IS NOT NULL
        """
    )

    # 3. Drop old FK and column from goals.
    op.drop_constraint("goals_linked_subcategory_id_fkey", "goals", type_="foreignkey")
    op.drop_column("goals", "linked_subcategory_id")


def downgrade() -> None:
    # 1. Restore the column on goals.
    op.add_column("goals", sa.Column("linked_subcategory_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        None, "goals", "subcategories", ["linked_subcategory_id"], ["id"], ondelete="SET NULL"
    )

    # 2. Backfill with the first link per goal (best-effort restore).
    op.execute(
        """
        UPDATE goals g
        SET linked_subcategory_id = (
            SELECT subcategory_id
            FROM goal_subcategory_links
            WHERE goal_id = g.id
            LIMIT 1
        )
        """
    )

    # 3. Drop the junction table.
    op.drop_index("ix_goal_subcategory_links_user_id", "goal_subcategory_links")
    op.drop_index("ix_goal_subcategory_links_subcategory_id", "goal_subcategory_links")
    op.drop_index("ix_goal_subcategory_links_goal_id", "goal_subcategory_links")
    op.drop_table("goal_subcategory_links")
