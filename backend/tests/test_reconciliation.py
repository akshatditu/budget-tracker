"""Reconciliation: drift = actual balance - computed carry-forward at that month."""
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models import (
    BalanceSnapshot,
    BudgetYear,
    Category,
    Income,
    Subcategory,
    Transaction,
    User,
)
from app.services.carryforward import carry_forward_chain, expected_balance, reconcile


@pytest.fixture
def db():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, class_=Session)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def data(db):
    user = User(email="r@test.local", display_name="R", currency="INR")
    db.add(user)
    db.flush()
    by = BudgetYear(user_id=user.id, year=2026)
    db.add(by)
    db.flush()
    needs = Category(user_id=user.id, name="Needs", sort_order=0, kind="spending")
    db.add(needs)
    db.flush()
    grocery = Subcategory(user_id=user.id, category_id=needs.id, name="Grocery")
    db.add(grocery)
    db.flush()
    # Jan: earn 20000, spend 5000 -> carry_out 15000.
    db.add_all([
        Income(user_id=user.id, budget_year_id=by.id, month=1, source="Salary", amount=20000),
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=grocery.id, txn_date=date(2026, 1, 10), amount=5000),
    ])
    db.commit()
    return user, by


def test_expected_balance_is_month_carry_out(db, data):
    _, by = data
    chain = carry_forward_chain(db, by)
    assert expected_balance(chain, date(2026, 1, 31)) == 15000.0


def test_drift_is_actual_minus_expected(db, data):
    user, by = data
    # User's real bank says 14000 at end of Jan; computed is 15000 -> drift -1000.
    snap = BalanceSnapshot(user_id=user.id, budget_year_id=by.id, as_of_date=date(2026, 1, 31), actual_balance=14000)
    db.add(snap)
    db.commit()

    row = reconcile(db, by, [snap])[0]
    assert row["expected_balance"] == 15000.0
    assert row["actual_balance"] == 14000.0
    assert row["drift"] == -1000.0
