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
    Text,
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
    # Envelope rollover: unspent budget carries into this sub's next month (and
    # overspend borrows forward). On by default; turn off per-sub for flat items.
    rollover: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

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


class Goal(Base):
    """A sinking fund / savings target. User-scoped (spans years). `saved` is never
    stored — it is summed from GoalSubcategoryLink rows (weighted subcategory remaining)
    when any links exist, otherwise from the GoalContribution ledger."""

    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    target_amount: Mapped[float] = mapped_column(MONEY, default=0)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    contributions: Mapped[list[GoalContribution]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )
    subcat_links: Mapped[list[GoalSubcategoryLink]] = relationship(
        back_populates="goal", cascade="all, delete-orphan"
    )


class GoalContribution(Base):
    """A single deposit toward a Goal. The goal's `saved` total is the sum of these."""

    __tablename__ = "goal_contributions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    amount: Mapped[float] = mapped_column(MONEY)
    contrib_date: Mapped[date] = mapped_column(Date, index=True)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    goal: Mapped[Goal] = relationship(back_populates="contributions")


class GoalSubcategoryLink(Base):
    """Junction row linking a Goal to a Subcategory. No weight stored — contribution
    is computed dynamically as min(goal.target, max(0, subcat_unspent - prior_claims))
    where prior_claims = sum of target_amounts of goals linked to this subcategory
    via links with a lower id (first-linked = first-served)."""

    __tablename__ = "goal_subcategory_links"
    __table_args__ = (
        UniqueConstraint("goal_id", "subcategory_id", name="uq_goal_subcat_link"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), index=True)
    subcategory_id: Mapped[int | None] = mapped_column(
        ForeignKey("subcategories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    goal: Mapped[Goal] = relationship(back_populates="subcat_links")


class BalanceSnapshot(Base):
    """A point-in-time reading of the user's actual bank balance, used to reconcile
    against the computed carry-forward chain so drift can be caught and trued-up."""

    __tablename__ = "balance_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    as_of_date: Mapped[date] = mapped_column(Date, index=True)
    actual_balance: Mapped[float] = mapped_column(MONEY)
    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BudgetRevisionDraft(Base):
    """A pending (or accepted) AI budget revision for a year. The AI reads the user's
    actual spending and proposes new revised amounts per sub-item; nothing touches the
    live budget until the user accepts. Only one row with status="pending" may exist per
    (user, year) — enforced in the router. Accepted rows are retained as revision history."""

    __tablename__ = "budget_revision_drafts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    budget_year_id: Mapped[int] = mapped_column(ForeignKey("budget_years.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", server_default="pending")
    user_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    # JSON-encoded list[str] of AI insights — advisory prose, not a money value.
    insights: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    items: Mapped[list[BudgetRevisionItem]] = relationship(
        back_populates="draft", cascade="all, delete-orphan"
    )


class BudgetRevisionItem(Base):
    """One sub-item's proposed change within a draft: current annual revised budget vs the
    AI's revised annual figure, with the AI's reason. Amounts stay encrypted at rest."""

    __tablename__ = "budget_revision_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    draft_id: Mapped[int] = mapped_column(ForeignKey("budget_revision_drafts.id", ondelete="CASCADE"), index=True)
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategories.id", ondelete="CASCADE"), index=True)
    current_annual: Mapped[float] = mapped_column(MONEY, default=0)
    revised_annual: Mapped[float] = mapped_column(MONEY, default=0)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    draft: Mapped[BudgetRevisionDraft] = relationship(back_populates="items")
