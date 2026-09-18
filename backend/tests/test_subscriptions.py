"""Subscriptions: schedule math, the auto-posting catch-up, and the router's no-backfill /
pause / user-scoping rules. In-memory SQLite + dependency overrides, like test_assets."""
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.deps import get_current_user
from app.main import app
from app.models import BudgetYear, Category, Subcategory, Subscription, Transaction, User
from app.services.subscriptions import first_due_on_or_after, nth_occurrence, occurrences_between, post_due


# ---- schedule math ----
def test_monthly_on_31st_clamps_and_returns():
    s = date(2026, 1, 31)
    assert [nth_occurrence(s, "monthly", n) for n in range(4)] == [
        date(2026, 1, 31), date(2026, 2, 28), date(2026, 3, 31), date(2026, 4, 30)
    ]


def test_quarterly_semiannual_yearly_leap():
    assert nth_occurrence(date(2026, 11, 15), "quarterly", 1) == date(2027, 2, 15)
    assert nth_occurrence(date(2026, 8, 31), "semiannual", 1) == date(2027, 2, 28)
    leap = date(2024, 2, 29)
    assert nth_occurrence(leap, "yearly", 1) == date(2025, 2, 28)
    assert nth_occurrence(leap, "yearly", 4) == date(2028, 2, 29)


def test_weekly():
    assert nth_occurrence(date(2026, 9, 1), "weekly", 2) == date(2026, 9, 15)
    assert first_due_on_or_after(date(2026, 9, 1), "weekly", date(2026, 9, 9)) == date(2026, 9, 15)
    assert first_due_on_or_after(date(2026, 9, 1), "weekly", date(2026, 9, 8)) == date(2026, 9, 8)


def test_first_due_on_or_after():
    s = date(2026, 1, 1)
    assert first_due_on_or_after(s, "monthly", date(2025, 6, 1)) == s  # before start
    assert first_due_on_or_after(s, "monthly", date(2026, 9, 1)) == date(2026, 9, 1)
    assert first_due_on_or_after(s, "monthly", date(2026, 9, 2)) == date(2026, 10, 1)
    assert first_due_on_or_after(s, "quarterly", date(2026, 5, 1)) == date(2026, 7, 1)


# ---- fixtures ----
@pytest.fixture
def env():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, class_=Session)()
    user = User(email="a@test.local", display_name="A", currency="INR")
    other = User(email="b@test.local", display_name="B", currency="INR")
    db.add_all([user, other])
    db.flush()
    cat = Category(user_id=user.id, name="Bills")
    db.add(cat)
    db.flush()
    sub = Subcategory(user_id=user.id, category_id=cat.id, name="OTT+Subscriptions")
    db.add(sub)
    db.add(BudgetYear(user_id=user.id, year=2026))
    db.commit()

    app.dependency_overrides[get_db] = lambda: (yield db)
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        yield TestClient(app), db, user, other, sub
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)


def _sub(db, user, subcat, **kw) -> Subscription:
    fields = dict(name="Netflix", amount=649, frequency="monthly", start_date=date(2026, 1, 1))
    fields.update(kw)
    fields.setdefault("next_due_date", fields["start_date"])
    s = Subscription(user_id=user.id, subcategory_id=subcat.id, **fields)
    db.add(s)
    db.commit()
    return s


def _txns(db, s):
    return db.scalars(select(Transaction).where(Transaction.subscription_id == s.id).order_by(Transaction.txn_date)).all()


# ---- catch-up posting ----
def test_post_due_posts_each_due_occurrence_once(env):
    _, db, user, _, subcat = env
    s = _sub(db, user, subcat, next_due_date=date(2026, 7, 1))
    assert post_due(db, user, date(2026, 9, 18)) == 3
    txns = _txns(db, s)
    assert [t.txn_date for t in txns] == [date(2026, 7, 1), date(2026, 8, 1), date(2026, 9, 1)]
    assert float(txns[0].amount) == 649 and txns[0].subcategory_id == subcat.id and txns[0].note == "Netflix"
    assert s.next_due_date == date(2026, 10, 1)
    assert post_due(db, user, date(2026, 9, 18)) == 0  # idempotent


def test_missing_budget_year_halts_until_created(env):
    _, db, user, _, subcat = env
    s = _sub(db, user, subcat, next_due_date=date(2026, 12, 1))
    assert post_due(db, user, date(2027, 2, 5)) == 1  # Dec 2026 only; no 2027 year
    assert s.next_due_date == date(2027, 1, 1)
    db.add(BudgetYear(user_id=user.id, year=2027))
    db.commit()
    assert post_due(db, user, date(2027, 2, 5)) == 2


def test_end_date_and_pause_respected(env):
    _, db, user, _, subcat = env
    ended = _sub(db, user, subcat, next_due_date=date(2026, 7, 1), end_date=date(2026, 8, 15))
    paused = _sub(db, user, subcat, name="Gym", next_due_date=date(2026, 7, 1), active=False)
    post_due(db, user, date(2026, 9, 18))
    assert len(_txns(db, ended)) == 2
    assert _txns(db, paused) == []


def test_occurrences_between(env):
    _, db, user, _, subcat = env
    s = _sub(db, user, subcat, frequency="weekly", start_date=date(2026, 9, 4), next_due_date=date(2026, 9, 18))
    assert occurrences_between(s, date(2026, 9, 18), date(2026, 9, 30)) == [date(2026, 9, 18), date(2026, 9, 25)]


# ---- router ----
def test_create_does_not_backfill(env):
    client, db, user, _, subcat = env
    today = date.today()
    start = today - timedelta(days=60)
    r = client.post("/api/subscriptions", json={
        "name": "Netflix", "subcategory_id": subcat.id, "amount": 649,
        "frequency": "weekly", "start_date": start.isoformat(),
    })
    assert r.status_code == 201
    nxt = date.fromisoformat(r.json()["next_due_date"])
    assert today <= nxt < today + timedelta(days=7)


def test_resume_does_not_backfill(env):
    client, db, user, _, subcat = env
    old = date.today() - timedelta(weeks=5)
    s = _sub(db, user, subcat, frequency="weekly", start_date=old, next_due_date=old, active=False)
    r = client.patch(f"/api/subscriptions/{s.id}", json={"active": True})
    assert r.status_code == 200
    assert date.fromisoformat(r.json()["next_due_date"]) >= date.today()


def test_rejects_end_before_start(env):
    client, _, _, _, subcat = env
    r = client.post("/api/subscriptions", json={
        "name": "X", "subcategory_id": subcat.id, "amount": 1, "frequency": "monthly",
        "start_date": "2026-05-01", "end_date": "2026-04-01",
    })
    assert r.status_code == 400


def test_user_scoping(env):
    client, db, user, other, subcat = env
    foreign_cat = Category(user_id=other.id, name="Bills")
    db.add(foreign_cat)
    db.flush()
    foreign_sub = Subcategory(user_id=other.id, category_id=foreign_cat.id, name="Other")
    db.add(foreign_sub)
    db.commit()
    theirs = _sub(db, other, foreign_sub)
    assert client.get("/api/subscriptions").json() == []
    assert client.patch(f"/api/subscriptions/{theirs.id}", json={"amount": 1}).status_code == 404
    assert client.delete(f"/api/subscriptions/{theirs.id}").status_code == 404
    r = client.post("/api/subscriptions", json={
        "name": "X", "subcategory_id": foreign_sub.id, "amount": 1,
        "frequency": "monthly", "start_date": "2026-05-01",
    })
    assert r.status_code == 404
