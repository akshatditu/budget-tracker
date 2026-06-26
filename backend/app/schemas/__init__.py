"""Pydantic v2 request/response schemas. Money is exposed as float for a simple
frontend contract (stored as Numeric server-side)."""
from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- Users / settings ----
class UserOut(ORMModel):
    id: int
    email: str
    display_name: str
    currency: str
    onboarded: bool = False


# ---- Onboarding ----
class OnboardingSection(BaseModel):
    name: str
    kind: str = "spending"
    items: list[str] = []


class OnboardingPayload(BaseModel):
    sections: list[OnboardingSection]


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    currency: Optional[str] = None


# ---- Years ----
class YearOut(ORMModel):
    id: int
    year: int


class YearCreate(BaseModel):
    year: int
    copy_structure_from: Optional[int] = Field(
        default=None, description="Optional source year to copy annual budgets from"
    )


# ---- Categories / subcategories ----
class CategoryOut(ORMModel):
    id: int
    name: str
    sort_order: int
    kind: str


class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0
    kind: str = "spending"


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    kind: Optional[str] = None


class SubcategoryOut(ORMModel):
    id: int
    category_id: int
    name: str
    sort_order: int
    archived: bool
    rollover: bool = True


class SubcategoryCreate(BaseModel):
    category_id: int
    name: str
    sort_order: int = 0


class SubcategoryUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    sort_order: Optional[int] = None
    archived: Optional[bool] = None
    rollover: Optional[bool] = None


# ---- Budgets ----
class AnnualBudgetSet(BaseModel):
    initial_amount: float


class AnnualRevisedPatch(BaseModel):
    revised_amount: float


class MonthlyBudgetPatch(BaseModel):
    revised_amount: float


# ---- Transactions ----
class TransactionCreate(BaseModel):
    subcategory_id: int
    txn_date: date
    amount: float
    note: Optional[str] = None


class TransactionUpdate(BaseModel):
    subcategory_id: Optional[int] = None
    txn_date: Optional[date] = None
    amount: Optional[float] = None
    note: Optional[str] = None


class TransactionOut(ORMModel):
    id: int
    subcategory_id: int
    txn_date: date
    amount: float
    note: Optional[str]


# ---- Income ----
class IncomeCreate(BaseModel):
    month: int = Field(ge=1, le=12)
    source: str = "Salary"
    amount: float
    income_date: Optional[date] = None
    note: Optional[str] = None


class IncomeUpdate(BaseModel):
    month: Optional[int] = Field(default=None, ge=1, le=12)
    source: Optional[str] = None
    amount: Optional[float] = None
    income_date: Optional[date] = None
    note: Optional[str] = None


class IncomeOut(ORMModel):
    id: int
    month: int
    source: str
    amount: float
    income_date: Optional[date]
    note: Optional[str]


# ---- Monthly settings ----
class MonthlySettingPatch(BaseModel):
    spend_limit: Optional[float] = None
    opening_carry_forward: Optional[float] = None
    notes: Optional[str] = None


# ---- Goals (sinking funds) ----
class GoalSubcategoryLinkCreate(BaseModel):
    subcategory_id: int
    weight: float = 100.0


class GoalSubcategoryLinkUpdate(BaseModel):
    weight: float


class GoalSubcategoryLinkOut(BaseModel):
    id: int
    subcategory_id: Optional[int]
    subcategory_name: Optional[str]
    weight: float


class GoalCreate(BaseModel):
    name: str
    target_amount: float = 0
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    target_date: Optional[date] = None
    archived: Optional[bool] = None


class GoalOut(BaseModel):
    """Goal + ledger-derived figures (saved/remaining/monthly_required/on_track)."""

    id: int
    name: str
    target_amount: float
    target_date: Optional[date]
    archived: bool
    links: list[GoalSubcategoryLinkOut]
    saved: float
    remaining: float
    pct: float
    monthly_required: Optional[float]
    on_track: Optional[bool]


class GoalContributionCreate(BaseModel):
    amount: float
    contrib_date: date
    note: Optional[str] = None


class GoalContributionOut(ORMModel):
    id: int
    goal_id: int
    amount: float
    contrib_date: date
    note: Optional[str]


# ---- Reconciliation ----
class BalanceSnapshotCreate(BaseModel):
    as_of_date: date
    actual_balance: float
    note: Optional[str] = None
