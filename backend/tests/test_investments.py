"""Investments are retained wealth: excluded from 'spent' and from the carry-forward drain.

Uses an in-memory SQLite DB (models use only portable column types) so no Postgres
is required, matching the lightweight style of the rest of the suite.
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
from app.routers.views import dashboard
from app.services import rollup
from app.services.carryforward import carry_forward_chain
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
def fixture_data(db):
    """One spending section (Needs) and one investment section (Investments)."""
    user = User(email="t@test.local", display_name="T", currency="INR")
    db.add(user)
    db.flush()
    by = BudgetYear(user_id=user.id, year=2026)
    db.add(by)
    db.flush()

    needs = Category(user_id=user.id, name="Needs", sort_order=0, kind="spending")
    inv = Category(user_id=user.id, name="Investments", sort_order=1, kind="investment")
    db.add_all([needs, inv])
    db.flush()

    grocery = Subcategory(user_id=user.id, category_id=needs.id, name="Grocery", sort_order=0)
    sip = Subcategory(user_id=user.id, category_id=inv.id, name="SIPs", sort_order=0)
    db.add_all([grocery, sip])
    db.flush()

    # January: spend 1000 on grocery, invest 5000 in SIPs, earn 20000.
    db.add_all([
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=grocery.id, txn_date=date(2026, 1, 10), amount=1000),
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=sip.id, txn_date=date(2026, 1, 15), amount=5000),
        Income(user_id=user.id, budget_year_id=by.id, month=1, source="Salary", amount=20000),
    ])
    db.commit()
    return user, by


def test_month_view_splits_spent_and_invested(db, fixture_data):
    user, by = fixture_data
    summary = month_view(db, by, user, month=1)["summary"]

    assert summary["spent"] == 1000.0       # grocery only — investments excluded
    assert summary["invested"] == 5000.0    # SIPs surfaced separately
    # Invested cash leaves the bank, so it is deducted alongside spend.
    assert summary["remaining_in_bank"] == 20000.0 - 1000.0 - 5000.0


def test_carry_forward_excludes_investments(db, fixture_data):
    _, by = fixture_data
    jan = carry_forward_chain(db, by)[0]

    assert jan["spent"] == 1000.0
    assert jan["invested"] == 5000.0
    assert jan["net"] == 20000.0 - 1000.0
    # carry_out = income - spend (investment cash is retained in the pool).
    assert jan["carry_out"] == 19000.0


def test_annual_plan_excludes_investments(db, fixture_data):
    """The 'left to spend' pool must plan only consumption — the investment budget is
    retained wealth and should not inflate annual_plan (only "invested" tracks it)."""
    user, by = fixture_data
    grocery = db.query(Subcategory).filter(Subcategory.name == "Grocery").one()
    sip = db.query(Subcategory).filter(Subcategory.name == "SIPs").one()
    # January revised budgets: 2000 to spend on groceries, 5000 earmarked for SIPs.
    db.add_all([
        MonthlyBudget(budget_year_id=by.id, subcategory_id=grocery.id, month=1, initial_amount=2000, revised_amount=2000),
        MonthlyBudget(budget_year_id=by.id, subcategory_id=sip.id, month=1, initial_amount=5000, revised_amount=5000),
    ])
    db.commit()

    totals = annual_rollup(db, by, user)["totals"]

    # Plan counts only the spending section, not the SIP investment budget.
    assert totals["annual_plan"] == 2000.0
    # The invested spend is still tracked separately.
    assert totals["invested"] == 5000.0


def test_dashboard_remaining_in_bank_ignores_future_investments(db, fixture_data, monkeypatch):
    """Liquid bank must net out only investments that have already happened. A future-dated
    investment (still ahead of the elapsed window) shouldn't lower today's bank balance."""
    user, by = fixture_data
    sip = db.query(Subcategory).filter(Subcategory.name == "SIPs").one()
    # Month 7 is past the elapsed window below; this investment is still in the future.
    db.add(Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=sip.id, txn_date=date(2026, 7, 5), amount=3000))
    db.commit()
    # Freeze elapsed months at June so the test doesn't drift with the real calendar.
    monkeypatch.setattr(rollup, "elapsed_months", lambda *a, **k: 6)

    kpis = dashboard(by.year, db, user)["kpis"]

    # carry_out(June) = 20000 - 1000 = 19000; only the Jan 5000 SIP is elapsed.
    assert kpis["remaining_in_bank"] == 19000.0 - 5000.0
    # The full-year invested KPI still reflects both investments.
    assert kpis["invested"] == 8000.0
