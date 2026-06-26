"""Phase 1 'honesty pass' — overspend surfacing, safe-to-spend, and forecast are
wired through the composite views. Uses in-memory SQLite like test_investments.py.

A January budget + January overspend is used because month 1 is always within the
elapsed window (elapsed_months(2026) >= 1 from Feb 2026 onward), so the assertions
stay deterministic regardless of when the suite runs.
"""
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models import (
    BudgetYear,
    Category,
    Income,
    MonthlyBudget,
    Subcategory,
    Transaction,
    User,
)
from app.services.rollup import annual_rollup, month_view


@pytest.fixture
def db():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, class_=Session)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def overspent_jan(db):
    """Grocery: Jan budget 5000, spent 8000 (over by 3000). Only month 1 is funded."""
    user = User(email="t@test.local", display_name="T", currency="INR")
    db.add(user)
    db.flush()
    by = BudgetYear(user_id=user.id, year=2026)
    db.add(by)
    db.flush()
    needs = Category(user_id=user.id, name="Needs", sort_order=0, kind="spending")
    db.add(needs)
    db.flush()
    grocery = Subcategory(user_id=user.id, category_id=needs.id, name="Grocery", sort_order=0)
    db.add(grocery)
    db.flush()
    db.add_all([
        MonthlyBudget(budget_year_id=by.id, subcategory_id=grocery.id, month=1, initial_amount=5000, revised_amount=5000),
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=grocery.id, txn_date=date(2026, 1, 12), amount=8000),
        Income(user_id=user.id, budget_year_id=by.id, month=1, source="Salary", amount=20000),
    ])
    db.commit()
    return user, by


def test_annual_rollup_surfaces_overspend(db, overspent_jan):
    user, by = overspent_jan
    roll = annual_rollup(db, by, user)

    needs = next(s for s in roll["sections"] if s["name"] == "Needs")
    item = needs["items"][0]
    # Jan went over by 3000; set-aside floors at 0, overspend is surfaced explicitly.
    assert item["set_aside"] == 0.0
    assert item["overspent"] == 3000.0
    assert item["available"] == -3000.0          # set_aside - overspent

    # Invariants that must hold regardless of run date.
    assert needs["totals"]["available"] == needs["totals"]["set_aside"] - needs["totals"]["overspent"]
    assert roll["totals"]["overspent"] == 3000.0
    assert roll["totals"]["available"] == -3000.0


def test_rollup_includes_forecast(db, overspent_jan):
    user, by = overspent_jan
    roll = annual_rollup(db, by, user)
    row = next(r for r in roll["plan_vs_actual"] if r["section"] == "Needs")

    assert "projected_annual" in row
    # projected_variance is always annual_plan minus projected_annual.
    assert row["projected_variance"] == pytest.approx(row["annual_plan"] - row["projected_annual"])


def test_month_view_exposes_safe_to_spend(db, overspent_jan):
    user, by = overspent_jan
    summary = month_view(db, by, user, month=1)["summary"]

    assert "days_left" in summary and "safe_to_spend_today" in summary
    assert summary["days_left"] >= 0
    # Safe-to-spend never goes negative; with Jan overspent it pins at 0.
    assert summary["safe_to_spend_today"] == 0.0
