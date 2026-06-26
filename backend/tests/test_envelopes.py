"""Opt-in envelope rollover. The riskiest math — cover surplus, deficit, the
rollover-off no-op, and the investment exclusion.

In-memory SQLite (the rollover column comes from the model via create_all).
"""
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models import (
    BudgetYear,
    Category,
    MonthlyBudget,
    Subcategory,
    Transaction,
    User,
)
from app.services.envelopes import envelope_row
from app.services.rollup import month_view


# --------------------------------------------------------------------------- #
# Pure-function chain
# --------------------------------------------------------------------------- #
def test_surplus_carries_forward():
    budgets = {(1, 1): (0.0, 5000.0), (1, 2): (0.0, 5000.0)}
    spent = {(1, 1): 3000.0}
    jan = envelope_row(budgets, spent, 1, 1)
    feb = envelope_row(budgets, spent, 1, 2)
    assert jan == {"rolled_in": 0.0, "available": 5000.0, "rolled_out": 2000.0}
    # Feb starts with Jan's 2000 surplus on top of its own 5000 budget.
    assert feb == {"rolled_in": 2000.0, "available": 7000.0, "rolled_out": 7000.0}


def test_deficit_borrows_forward():
    budgets = {(1, 1): (0.0, 5000.0), (1, 2): (0.0, 5000.0)}
    spent = {(1, 1): 8000.0}
    feb = envelope_row(budgets, spent, 1, 2)
    # Jan overspent by 3000 -> Feb opens 3000 in the hole.
    assert feb["rolled_in"] == -3000.0
    assert feb["available"] == 2000.0


# --------------------------------------------------------------------------- #
# month_view integration
# --------------------------------------------------------------------------- #
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
    user = User(email="e@test.local", display_name="E", currency="INR")
    db.add(user)
    db.flush()
    by = BudgetYear(user_id=user.id, year=2026)
    db.add(by)
    db.flush()
    needs = Category(user_id=user.id, name="Needs", sort_order=0, kind="spending")
    wants = Category(user_id=user.id, name="Wants", sort_order=1, kind="spending")
    inv = Category(user_id=user.id, name="Investments", sort_order=2, kind="investment")
    db.add_all([needs, wants, inv])
    db.flush()
    grocery = Subcategory(user_id=user.id, category_id=needs.id, name="Grocery", rollover=True)
    misc = Subcategory(user_id=user.id, category_id=wants.id, name="Misc", rollover=False)
    sip = Subcategory(user_id=user.id, category_id=inv.id, name="SIP", rollover=True)  # rollover ignored for investments
    db.add_all([grocery, misc, sip])
    db.flush()
    for sub in (grocery, misc, sip):
        for m in (1, 2):
            db.add(MonthlyBudget(budget_year_id=by.id, subcategory_id=sub.id, month=m, initial_amount=5000, revised_amount=5000))
    # January: grocery underspends (surplus 2000); misc spends some too.
    db.add_all([
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=grocery.id, txn_date=date(2026, 1, 5), amount=3000),
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=misc.id, txn_date=date(2026, 1, 5), amount=3000),
    ])
    db.commit()
    return user, by


def _item(view, section_name, item_name):
    sec = next(s for s in view["sections"] if s["name"] == section_name)
    return next(i for i in sec["items"] if i["name"] == item_name)


def test_rollover_item_gains_carried_surplus(db, data):
    user, by = data
    feb = month_view(db, by, user, month=2)
    grocery = _item(feb, "Needs", "Grocery")
    assert grocery["rollover"] is True
    assert grocery["rolled_in"] == 2000.0          # Jan surplus
    assert grocery["available"] == 7000.0          # 5000 + 2000
    assert grocery["remaining"] == 7000.0          # nothing spent in Feb yet


def test_non_rollover_item_is_unchanged(db, data):
    user, by = data
    feb = month_view(db, by, user, month=2)
    misc = _item(feb, "Wants", "Misc")
    assert misc["rollover"] is False
    assert misc["rolled_in"] == 0.0
    assert misc["available"] == 5000.0             # == revised, no carry
    assert misc["remaining"] == 5000.0             # revised - spent (0 in Feb)


def test_investment_never_rolls_over(db, data):
    user, by = data
    feb = month_view(db, by, user, month=2)
    sip = _item(feb, "Investments", "SIP")
    # rollover=True on the sub, but the investment kind forces it off.
    assert sip["rollover"] is False
    assert sip["rolled_in"] == 0.0
    assert sip["available"] == 5000.0
