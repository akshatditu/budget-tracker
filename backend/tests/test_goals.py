"""Sinking-fund / goal math + the saved-from-ledger summing through the service."""
from datetime import date

from app.services.goals import compute_goal


def test_monthly_required_paces_remaining_over_months_left():
    # Target 24000 by Dec, 4000 saved, today June -> 7 months left (Jun..Dec inclusive).
    g = compute_goal(
        target_amount=24000,
        target_date=date(2026, 12, 1),
        saved=4000,
        created_at=date(2026, 1, 1),
        today=date(2026, 6, 1),
    )
    assert g["remaining"] == 20000.0
    assert g["monthly_required"] == 20000.0 / 7
    assert g["pct"] == 4000 / 24000


def test_past_due_requires_full_remaining_now():
    g = compute_goal(
        target_amount=10000,
        target_date=date(2026, 1, 1),
        saved=3000,
        today=date(2026, 6, 1),
    )
    # Target date passed -> the whole shortfall is due now, not paced.
    assert g["monthly_required"] == 7000.0


def test_on_track_uses_straight_line_schedule():
    # Created Jan, target Dec (11-month span). By June (5 elapsed) expected ~45.5%.
    behind = compute_goal(
        target_amount=11000, target_date=date(2026, 12, 1), saved=1000,
        created_at=date(2026, 1, 1), today=date(2026, 6, 1),
    )
    ahead = compute_goal(
        target_amount=11000, target_date=date(2026, 12, 1), saved=8000,
        created_at=date(2026, 1, 1), today=date(2026, 6, 1),
    )
    assert behind["on_track"] is False
    assert ahead["on_track"] is True


def test_no_target_date_leaves_pacing_undefined():
    g = compute_goal(target_amount=5000, target_date=None, saved=1000)
    assert g["monthly_required"] is None
    assert g["on_track"] is None
    assert g["remaining"] == 4000.0


def test_saved_summed_from_ledger_via_service(tmp_path):
    """End-to-end through the router helper: saved is the sum of contributions."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session, sessionmaker

    from app.core.database import Base
    from app.models import Goal, GoalContribution, User
    from app.routers.goals import _goal_dict

    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    db = sessionmaker(bind=engine, class_=Session)()
    try:
        user = User(email="g@test.local", display_name="G", currency="INR")
        db.add(user)
        db.flush()
        goal = Goal(user_id=user.id, name="Vacation", target_amount=24000, target_date=date(2026, 12, 1))
        db.add(goal)
        db.flush()
        db.add_all([
            GoalContribution(user_id=user.id, goal_id=goal.id, amount=2000, contrib_date=date(2026, 1, 5)),
            GoalContribution(user_id=user.id, goal_id=goal.id, amount=3000, contrib_date=date(2026, 2, 5)),
        ])
        db.commit()

        d = _goal_dict(db, goal)
        assert d["saved"] == 5000.0          # summed from the two contributions
        assert d["remaining"] == 19000.0
        assert d["target_amount"] == 24000.0
    finally:
        db.close()
        Base.metadata.drop_all(engine)
