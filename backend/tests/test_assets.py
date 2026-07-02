"""Assets / net worth CRUD: create -> list -> patch -> delete, plus user-scoping.
Uses in-memory SQLite + dependency overrides, like test_onboarding."""
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.deps import get_current_user
from app.main import app
from app.models import AssetHolding, User


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, class_=Session)()
    user = User(email="a@test.local", display_name="A", currency="INR")
    other = User(email="b@test.local", display_name="B", currency="INR")
    session.add_all([user, other])
    session.commit()

    app.dependency_overrides[get_db] = lambda: (yield session)
    app.dependency_overrides[get_current_user] = lambda: user
    try:
        yield TestClient(app), session, user, other
    finally:
        app.dependency_overrides.clear()
        session.close()
        Base.metadata.drop_all(engine)


def test_asset_crud_roundtrip(client):
    tc, _db, _user, _other = client

    created = tc.post(
        "/api/assets",
        json={"category": "Stocks", "name": "TCS", "amount": 150000},
    )
    assert created.status_code == 201
    hid = created.json()["id"]
    assert created.json()["amount"] == 150000
    # Date is stamped server-side to today — the client never sends it.
    assert created.json()["as_of_date"] == date.today().isoformat()

    listed = tc.get("/api/assets").json()
    assert [h["id"] for h in listed] == [hid]

    patched = tc.patch(f"/api/assets/{hid}", json={"amount": 175000})
    assert patched.status_code == 200
    assert patched.json()["amount"] == 175000
    # Untouched fields survive a partial update.
    assert patched.json()["name"] == "TCS"

    assert tc.delete(f"/api/assets/{hid}").status_code == 204
    assert tc.get("/api/assets").json() == []


def test_assets_are_user_scoped(client):
    tc, db, _user, other = client
    # A holding owned by another user must never surface or be mutable.
    theirs = AssetHolding(user_id=other.id, category="Cash", name=None, amount=500, as_of_date=date(2026, 7, 1))
    db.add(theirs)
    db.commit()

    assert tc.get("/api/assets").json() == []
    assert tc.patch(f"/api/assets/{theirs.id}", json={"amount": 1}).status_code == 404
    assert tc.delete(f"/api/assets/{theirs.id}").status_code == 404
