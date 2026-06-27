"""In-app budget regeneration for existing users. A user with a fully-budgeted year runs
the AI allocator again: "replace" overwrites every month's revised, "forward" leaves past
months untouched, fixed bills stay exact, and income is upserted (not duplicated)."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.deps import get_current_user
from app.main import app
from app.models import BudgetYear, Category, Income, MonthlyBudget, Subcategory, User
from app.services.rollup import elapsed_months

YEAR = 2026


@pytest.fixture
def client():
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
    # An existing, fully-budgeted year: a Needs item (Grocery) with all 12 revised rows set.
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
    db.commit()

    app.dependency_overrides[get_db] = lambda: (yield db)
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        yield TestClient(app), db, user, grocery.id
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)


def _revised(db, sub_id, month):
    mb = db.scalars(
        select(MonthlyBudget).where(
            MonthlyBudget.subcategory_id == sub_id, MonthlyBudget.month == month
        )
    ).first()
    return float(mb.revised_amount)


def _body(mode):
    return {
        "sections": [{"name": "Needs", "kind": "spending", "items": ["Grocery"]}],
        "employment_type": "salaried",
        "monthly_income": 60000,
        "fixed_bills": [{"name": "Rent", "amount": 20000}],
        "override_mode": mode,
    }


def test_replace_overwrites_all_months(client):
    tc, db, _user, grocery_id = client
    resp = tc.post(f"/api/years/{YEAR}/generate-budget", json=_body("replace"))
    assert resp.status_code == 200
    # Past month (January) revised is overwritten away from the original 1000.
    assert _revised(db, grocery_id, 1) != 1000


def test_forward_preserves_past_months(client):
    tc, db, _user, grocery_id = client
    current = elapsed_months(YEAR)
    resp = tc.post(f"/api/years/{YEAR}/generate-budget", json=_body("forward"))
    assert resp.status_code == 200
    if current > 1:
        # A month before the current one keeps its original planned value.
        assert _revised(db, grocery_id, 1) == 1000
    # The current/future months get the new allocation.
    assert _revised(db, grocery_id, 12) != 1000


def test_fixed_bill_exact_and_income_upserted(client):
    tc, db, user, _grocery_id = client
    tc.post(f"/api/years/{YEAR}/generate-budget", json=_body("replace"))
    tc.post(f"/api/years/{YEAR}/generate-budget", json=_body("replace"))

    rent = db.scalars(select(Subcategory).where(Subcategory.name == "Rent")).first()
    assert _revised(db, rent.id, 6) == 20000  # exact monthly amount

    incomes = db.scalars(select(Income).where(Income.user_id == user.id)).all()
    assert len(incomes) == 1  # upserted, not duplicated across two runs
    assert float(incomes[0].amount) == 60000
