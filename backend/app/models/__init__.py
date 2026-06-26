"""SQLAlchemy models. All money columns use Numeric(14,2) to avoid float drift.

Every domain table carries user_id so multi-user auth can be added later without a
schema migration (phase 2). For now a single seeded user owns everything.
"""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.crypto import EncryptedNumeric
from app.core.database import Base

# Money values are encrypted at rest (see app/core/crypto.py): stored as opaque
# Fernet tokens, decrypted transparently on read so the rollup math is unchanged.
# (Pre-encryption these were Numeric(14,2); that precision still applies in-app.)
MONEY = EncryptedNumeric


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(120))
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    # NULL until the user finishes the onboarding wizard; gates the first-run flow.
    onboarded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def onboarded(self) -> bool:
        return self.onboarded_at is not None


class BudgetYear(Base):
    __tablename__ = "budget_years"
    __table_args__ = (UniqueConstraint("user_id", "year", name="uq_year_per_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    year: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Category(Base):
    """The 4 sections: Bills, Needs, Wants, Investments. Persist across years."""

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    # "spending" (consumed) or "investment" (retained wealth, never shown as spent).
    kind: Mapped[str] = mapped_column(String(20), default="spending", server_default="spending")

    subcategories: Mapped[list[Subcategory]] = relationship(
        back_populates="category", cascade="all, delete-orphan"
    )


class Subcategory(Base):
    __tablename__ = "subcategories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped[Category] = relationship(back_populates="subcategories")


class AnnualBudget(Base):
    """Yearly 'Initial Budget' per sub-item; split /12 into monthly initials."""

    __tablename__ = "annual_budgets"
    __table_args__ = (
        UniqueConstraint("budget_year_id", "subcategory_id", name="uq_annual_budget"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategories.id", ondelete="CASCADE"), index=True)
    initial_amount: Mapped[float] = mapped_column(MONEY, default=0)


class MonthlyBudget(Base):
    """Per sub-item per month. revised_amount is the editable lever; the annual
    revised total is the sum of these across the 12 months."""

    __tablename__ = "monthly_budgets"
    __table_args__ = (
        UniqueConstraint("budget_year_id", "subcategory_id", "month", name="uq_monthly_budget"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategories.id", ondelete="CASCADE"), index=True)
    month: Mapped[int] = mapped_column(Integer)  # 1..12
    initial_amount: Mapped[float] = mapped_column(MONEY, default=0)
    revised_amount: Mapped[float] = mapped_column(MONEY, default=0)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategories.id", ondelete="CASCADE"), index=True)
    txn_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[float] = mapped_column(MONEY)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Income(Base):
    __tablename__ = "incomes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    month: Mapped[int] = mapped_column(Integer)  # 1..12
    source: Mapped[str] = mapped_column(String(120), default="Salary")
    amount: Mapped[float] = mapped_column(MONEY)
    income_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)


class MonthlySetting(Base):
    """Per-month knobs that keep the monthly summary editable rather than rigid."""

    __tablename__ = "monthly_settings"
    __table_args__ = (
        UniqueConstraint("budget_year_id", "month", name="uq_monthly_setting"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    month: Mapped[int] = mapped_column(Integer)  # 1..12
    spend_limit: Mapped[float | None] = mapped_column(MONEY, nullable=True)
    opening_carry_forward: Mapped[float | None] = mapped_column(MONEY, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
