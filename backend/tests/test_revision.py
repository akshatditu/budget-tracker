"""AI budget revision. The rule-based fallback nudges each bucket toward its actual run-rate;
the end-to-end flow enforces one pending draft at a time and applies an accepted draft *forward*
(current + future months) while leaving elapsed months untouched."""
import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.deps import get_current_user
from app.main import app
from app.models import BudgetYear, Category, Income, MonthlyBudget, Subcategory, Transaction, User
from app.services.revise_budget import rule_based_revision
from app.services.rollup import elapsed_months

YEAR = 2026


# --------------------------------------------------------------------------- #
# rule_based_revision (pure)
# --------------------------------------------------------------------------- #
def _item(**kw):
    base = {
        "subcategory_id": 1, "name": "X", "section": "Needs", "kind": "spending",
        "current_annual": 12000, "current_monthly": 1000.0, "ytd_spent": 0.0,
        "avg_monthly_spent": 0.0, "set_aside": 0.0, "overspent": 0.0,
    }
    base.update(kw)
    return base


def test_rule_based_nudges_toward_actuals():
    context = {
        "elapsed_months": 6,
        "envelope_monthly": 100000.0,  # generous — no envelope scaling, isolate the nudge logic
        "items": [
            _item(subcategory_id=1, name="Grocery", current_monthly=1000.0, avg_monthly_spent=1500.0, overspent=3000.0),
            _item(subcategory_id=2, name="Shopping", current_monthly=1000.0, avg_monthly_spent=200.0, set_aside=4800.0),
            _item(subcategory_id=3, name="SIP", kind="investment", current_monthly=5000.0, avg_monthly_spent=5000.0),
        ],
    }
    out = rule_based_revision(context=context, user_note=None)
    by_id = {it["subcategory_id"]: it["monthly_amount"] for it in out["items"]}

    # Overspender nudged up (clamped to +30%), under-spender trimmed (clamped to -30%).
    assert 1000.0 < by_id[1] <= 1300.0
    assert 700.0 <= by_id[2] < 1000.0
    # Investments are retained wealth — left at today's level by the fallback.
    assert by_id[3] == 5000.0
    # At least one insight, and it calls out the overspent category.
    assert out["insights"]
    assert any("Grocery" in s for s in out["insights"])


# --------------------------------------------------------------------------- #
# End-to-end: generate -> 409 -> accept (forward) -> discard
# --------------------------------------------------------------------------- #
@pytest.fixture
def client(monkeypatch):
    # Force the offline, deterministic fallback (no OpenAI call) regardless of local .env.
    monkeypatch.setattr(settings, "openai_api_key", "")

    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, class_=Session)()

    user = User(email="t@test.local", display_name="T", currency="INR")
    db.add(user)
    db.flush()
    by = BudgetYear(user_id=user.id, year=YEAR)
    db.add(by)
    db.flush()
    needs = Category(user_id=user.id, name="Needs", sort_order=0, kind="spending")
    db.add(needs)
    db.flush()
    grocery = Subcategory(user_id=user.id, category_id=needs.id, name="Grocery", sort_order=0)
    db.add(grocery)
    db.flush()
    db.add_all([
        MonthlyBudget(budget_year_id=by.id, subcategory_id=grocery.id, month=m, initial_amount=1000, revised_amount=1000)
        for m in range(1, 13)
    ])
    # Real spending above budget in elapsed months so the fallback proposes a change.
    db.add_all([
        Transaction(user_id=user.id, budget_year_id=by.id, subcategory_id=grocery.id, txn_date=date(YEAR, m, 15), amount=1500)
        for m in range(1, elapsed_months(YEAR) + 1)
    ])
    # Income gives the discretionary envelope headroom (no Bills section here).
    db.add(Income(user_id=user.id, budget_year_id=by.id, month=6, source="Salary", amount=5000))
    db.commit()

    app.dependency_overrides[get_db] = lambda: (yield db)
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        yield TestClient(app), db, grocery.id
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)


def _revised(db, sub_id, month):
    mb = db.scalars(
        select(MonthlyBudget).where(MonthlyBudget.subcategory_id == sub_id, MonthlyBudget.month == month)
    ).first()
    return float(mb.revised_amount)


def test_generate_then_block_then_accept_forward(client):
    tc, db, grocery_id = client
    current = elapsed_months(YEAR)

    # Generate a draft — does not touch the live budget yet.
    resp = tc.post(f"/api/years/{YEAR}/budget-revision", json={"user_note": "spending more on food"})
    assert resp.status_code == 200
    draft = resp.json()
    assert draft["status"] == "pending"
    assert draft["items"], "draft should contain at least one item"
    assert _revised(db, grocery_id, 1) == 1000  # live budget untouched

    # A second generation while one is pending is refused.
    assert tc.post(f"/api/years/{YEAR}/budget-revision", json={}).status_code == 409

    # Accept applies the revision forward only.
    assert tc.post(f"/api/years/{YEAR}/budget-revision/accept").status_code == 200
    if current > 1:
        assert _revised(db, grocery_id, 1) == 1000  # elapsed month preserved
    assert _revised(db, grocery_id, 12) != 1000     # future month revised

    # The accepted draft is no longer pending.
    assert tc.get(f"/api/years/{YEAR}/budget-revision").json() is None


def test_discard_leaves_budget_unchanged(client):
    tc, db, grocery_id = client
    assert tc.post(f"/api/years/{YEAR}/budget-revision", json={}).status_code == 200
    assert tc.delete(f"/api/years/{YEAR}/budget-revision").status_code == 204
    assert tc.get(f"/api/years/{YEAR}/budget-revision").json() is None
    # Every month keeps its original planned value.
    assert all(_revised(db, grocery_id, m) == 1000 for m in range(1, 13))
    # A fresh revision can be generated again.
    assert tc.post(f"/api/years/{YEAR}/budget-revision", json={}).status_code == 200
