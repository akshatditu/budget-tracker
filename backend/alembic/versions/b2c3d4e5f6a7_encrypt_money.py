"""encrypt money columns at rest

Converts every money column from Numeric(14,2) to encrypted Text (Fernet tokens).
Existing plaintext values are read, encrypted, and written back, then the numeric
column is replaced. Requires ENCRYPTION_KEY to be set in the environment.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-26 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.core.crypto import decrypt_amount, encrypt_amount


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (table, [(column, nullable), ...]) — every money column in the schema.
TABLES: list[tuple[str, list[tuple[str, bool]]]] = [
    ("annual_budgets", [("initial_amount", False)]),
    ("monthly_budgets", [("initial_amount", False), ("revised_amount", False)]),
    ("transactions", [("amount", False)]),
    ("incomes", [("amount", False)]),
    ("monthly_settings", [("spend_limit", True), ("opening_carry_forward", True)]),
]


def upgrade() -> None:
    conn = op.get_bind()
    for table, cols in TABLES:
        for col, nullable in cols:
            tmp = f"{col}_enc_tmp"
            op.add_column(table, sa.Column(tmp, sa.Text(), nullable=True))
            rows = conn.execute(
                sa.text(f"SELECT id, {col} FROM {table} WHERE {col} IS NOT NULL")
            ).fetchall()
            for rid, val in rows:
                conn.execute(
                    sa.text(f"UPDATE {table} SET {tmp} = :v WHERE id = :id"),
                    {"v": encrypt_amount(val), "id": rid},
                )
            op.drop_column(table, col)
            op.alter_column(table, tmp, new_column_name=col)
            if not nullable:
                op.alter_column(table, col, nullable=False)


def downgrade() -> None:
    conn = op.get_bind()
    for table, cols in TABLES:
        for col, nullable in cols:
            tmp = f"{col}_num_tmp"
            op.add_column(table, sa.Column(tmp, sa.Numeric(precision=14, scale=2), nullable=True))
            rows = conn.execute(
                sa.text(f"SELECT id, {col} FROM {table} WHERE {col} IS NOT NULL")
            ).fetchall()
            for rid, token in rows:
                conn.execute(
                    sa.text(f"UPDATE {table} SET {tmp} = :v WHERE id = :id"),
                    {"v": decrypt_amount(token), "id": rid},
                )
            op.drop_column(table, col)
            op.alter_column(table, tmp, new_column_name=col)
            if not nullable:
                op.alter_column(table, col, nullable=False)
