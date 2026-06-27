"""End-to-end check of the onboarding route: a fixed bill keeps its exact amount, the
discretionary picks get funded via the deterministic fallback (no OPENAI key in tests),
and the stated income is persisted. Uses in-memory SQLite + dependency overrides."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.deps import get_current_user
from app.main import app
from app.models import AnnualBudget, Income, Subcategory, User


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,  # one shared connection — TestClient runs the request in another thread
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, class_=Session)()
    user = User(email="t@test.local", display_name="T", currency="INR")
    session.add(user)
    session.commit()

    app.dependency_overrides[get_db] = lambda: (yield session)
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        yield TestClient(app), session, user
    finally:
        app.dependency_overrides.clear()
        session.close()
        Base.metadata.drop_all(engine)


def test_onboarding_builds_budget(client):
    tc, db, user = client
    resp = tc.post(
        "/api/onboarding",
        json={
            "sections": [
                {"name": "Needs", "kind": "spending", "items": ["Grocery", "Fuel"]},
                {"name": "Wants", "kind": "spending", "items": ["Dining Out"]},
                {"name": "Investments", "kind": "investment", "items": ["SIP"]},
            ],
            "employment_type": "salaried",
            "monthly_income": 80000,
            "fixed_bills": [{"name": "Rent", "amount": 20000}],
        },
    )
    assert resp.status_code == 200
    assert resp.json()["onboarded"] is True

    subs = {s.name: s.id for s in db.scalars(select(Subcategory).where(Subcategory.user_id == user.id))}
    annuals = {
        ab.subcategory_id: float(ab.initial_amount)
        for ab in db.scalars(select(AnnualBudget))
    }

    # Fixed bill assigned exactly (annual = monthly * 12); it became a Bills sub-item.
    assert "Rent" in subs
    assert annuals[subs["Rent"]] == 20000 * 12

    # Discretionary picks funded by the fallback split, investments included.
    assert annuals[subs["Grocery"]] > 0
    assert annuals[subs["SIP"]] > 0

    # Income persisted for the current month.
    income = db.scalars(select(Income).where(Income.user_id == user.id)).first()
    assert income is not None
    assert float(income.amount) == 80000
    assert income.source == "Salary"


def test_onboarding_rejects_second_run(client):
    tc, _db, _user = client
    first = tc.post("/api/onboarding", json={"sections": []})
    assert first.status_code == 200
    second = tc.post("/api/onboarding", json={"sections": []})
    assert second.status_code == 409
