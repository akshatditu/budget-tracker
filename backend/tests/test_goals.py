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


# ---- sequential claiming tests ----

def _make_db():
    """Return a fresh in-memory SQLite session with schema created."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session, sessionmaker

    from app.core.database import Base

    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, class_=Session)(), engine


def test_single_link_claims_up_to_goal_target():
    """saved = min(goal.target, subcat_unspent) for a sole linked goal."""
    from datetime import date

    from app.models import BudgetYear, Goal, GoalSubcategoryLink, MonthlyBudget, Subcategory, Category, User
    from app.routers.goals import _saved_from_links
    from app.core.crypto import EncryptedNumeric

    db, engine = _make_db()
    try:
        user = User(email="a@t.local", display_name="A", currency="INR")
        db.add(user)
        db.flush()

        cat = Category(user_id=user.id, name="Bills", kind="bills", sort_order=0)
        db.add(cat)
        db.flush()

        sub = Subcategory(user_id=user.id, category_id=cat.id, name="Insurance")
        db.add(sub)
        db.flush()

        by = BudgetYear(user_id=user.id, year=2025)
        db.add(by)
        db.flush()

        # 3 elapsed months, 10 000 each, 0 spent → unspent = 30 000
        for m in range(1, 4):
            db.add(MonthlyBudget(
                budget_year_id=by.id, subcategory_id=sub.id,
                month=m, initial_amount=10000, revised_amount=10000,
            ))
        db.commit()

        goal = Goal(user_id=user.id, name="LIC", target_amount=21000)
        db.add(goal)
        db.flush()

        link = GoalSubcategoryLink(user_id=user.id, goal_id=goal.id, subcategory_id=sub.id)
        db.add(link)
        db.commit()

        saved = _saved_from_links(db, goal)
        # unspent = 30 000, goal target = 21 000 → saved = 21 000
        assert saved == 21000.0
    finally:
        db.close()
        from app.core.database import Base
        Base.metadata.drop_all(engine)


def test_two_goals_share_subcategory_sequential():
    """First-linked goal gets priority; second goal gets the remainder."""
    from datetime import date

    from app.models import BudgetYear, Goal, GoalSubcategoryLink, MonthlyBudget, Subcategory, Category, User
    from app.routers.goals import _saved_from_links

    db, engine = _make_db()
    try:
        user = User(email="b@t.local", display_name="B", currency="INR")
        db.add(user)
        db.flush()

        cat = Category(user_id=user.id, name="Bills", kind="bills", sort_order=0)
        db.add(cat)
        db.flush()

        sub = Subcategory(user_id=user.id, category_id=cat.id, name="Insurance")
        db.add(sub)
        db.flush()

        by = BudgetYear(user_id=user.id, year=2025)
        db.add(by)
        db.flush()

        # 3 months × 10 000 = 30 000 unspent
        for m in range(1, 4):
            db.add(MonthlyBudget(
                budget_year_id=by.id, subcategory_id=sub.id,
                month=m, initial_amount=10000, revised_amount=10000,
            ))
        db.commit()

        goal_a = Goal(user_id=user.id, name="Goal A", target_amount=20000)
        goal_b = Goal(user_id=user.id, name="Goal B", target_amount=15000)
        db.add_all([goal_a, goal_b])
        db.flush()

        link_a = GoalSubcategoryLink(user_id=user.id, goal_id=goal_a.id, subcategory_id=sub.id)
        db.add(link_a)
        db.flush()
        link_b = GoalSubcategoryLink(user_id=user.id, goal_id=goal_b.id, subcategory_id=sub.id)
        db.add(link_b)
        db.commit()

        # link_a.id < link_b.id → goal_a has priority
        saved_a = _saved_from_links(db, goal_a)
        saved_b = _saved_from_links(db, goal_b)

        # goal_a claims min(20 000, 30 000) = 20 000
        assert saved_a == 20000.0
        # goal_b gets max(0, 30 000 - 20 000) = 10 000, capped at target 15 000 → 10 000
        assert saved_b == 10000.0
    finally:
        db.close()
        from app.core.database import Base
        Base.metadata.drop_all(engine)


def test_subcat_remaining_uses_full_annual_budget_not_just_elapsed():
    """Verify the fix: remaining = revised_annual − spent_ytd (includes future months).

    Set up with 12 months of budget and partial spend. Confirm _subcat_remaining
    returns total_revised − total_spent, not just elapsed-month set-aside.
    """
    from datetime import date

    from app.models import BudgetYear, Goal, MonthlyBudget, Subcategory, Category, Transaction, User
    from app.routers.goals import _subcat_remaining

    db, engine = _make_db()
    try:
        user = User(email="c@t.local", display_name="C", currency="INR")
        db.add(user)
        db.flush()

        cat = Category(user_id=user.id, name="Bills", kind="bills", sort_order=0)
        db.add(cat)
        db.flush()

        sub = Subcategory(user_id=user.id, category_id=cat.id, name="Insurance")
        db.add(sub)
        db.flush()

        by = BudgetYear(user_id=user.id, year=2025)
        db.add(by)
        db.flush()

        # 12 months × 4000 = 48 000 annual revised budget
        for m in range(1, 13):
            db.add(MonthlyBudget(
                budget_year_id=by.id, subcategory_id=sub.id,
                month=m, initial_amount=4000, revised_amount=4000,
            ))

        # Spent 26 000 via transactions across a few months
        for m, amt in [(1, 5000), (2, 8000), (3, 7000), (4, 6000)]:
            db.add(Transaction(
                user_id=user.id, budget_year_id=by.id, subcategory_id=sub.id,
                amount=amt, txn_date=date(2025, m, 15),
            ))
        db.commit()

        remaining = _subcat_remaining(db, user.id, sub.id)
        # 48 000 total revised − 26 000 total spent = 22 000
        assert remaining == 22000.0
    finally:
        db.close()
        from app.core.database import Base
        Base.metadata.drop_all(engine)


def test_saved_uses_set_aside_not_full_annual_capacity():
    """A 100%-weight goal in a partially-elapsed year saves the elapsed set-aside, not the
    full-year unspent capacity. (Regression: progress bar read 100% before any real saving.)"""
    from datetime import date

    from app.models import BudgetYear, Goal, GoalSubcategoryLink, MonthlyBudget, Subcategory, Category, Transaction, User
    from app.routers.goals import _saved_from_links, _subcat_remaining

    db, engine = _make_db()
    try:
        user = User(email="d@t.local", display_name="D", currency="INR")
        db.add(user)
        db.flush()

        cat = Category(user_id=user.id, name="Bills", kind="bills", sort_order=0)
        db.add(cat)
        db.flush()

        sub = Subcategory(user_id=user.id, category_id=cat.id, name="Insurance")
        db.add(sub)
        db.flush()

        by = BudgetYear(user_id=user.id, year=2026)
        db.add(by)
        db.flush()

        # 12 months × 4000 = 48 000 annual revised
        for m in range(1, 13):
            db.add(MonthlyBudget(
                budget_year_id=by.id, subcategory_id=sub.id,
                month=m, initial_amount=4000, revised_amount=4000,
            ))
        # Spend 26 000 in months 1-4 (each month overspends its 4000 budget)
        for m, amt in [(1, 5000), (2, 8000), (3, 7000), (4, 6000)]:
            db.add(Transaction(
                user_id=user.id, budget_year_id=by.id, subcategory_id=sub.id,
                amount=amt, txn_date=date(2026, m, 15),
            ))
        db.commit()

        goal = Goal(user_id=user.id, name="LIC", target_amount=22000)
        db.add(goal)
        db.flush()
        db.add(GoalSubcategoryLink(user_id=user.id, goal_id=goal.id, subcategory_id=sub.id))
        db.commit()

        today = date(2026, 6, 15)  # 6 elapsed months
        # Capacity (weight basis) is the full-annual unspent = 48 000 − 26 000 = 22 000.
        assert _subcat_remaining(db, user.id, sub.id, today) == 22000.0
        # But saved counts only elapsed set-aside: months 1-4 overspent → 0; months 5,6
        # untouched → 4000 each = 8000. Weight = 22000/22000 = 1.0 → saved = 8000.
        assert _saved_from_links(db, goal, today) == 8000.0
    finally:
        db.close()
        from app.core.database import Base
        Base.metadata.drop_all(engine)
