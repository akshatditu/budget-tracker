"""Sinking-fund / goal math.

`saved` is summed from the GoalContribution ledger (never stored), mirroring how
`spent` is summed from transactions. `monthly_required` paces the remaining amount
over the months left until the target date; `on_track` compares saved-so-far against
a straight-line schedule anchored at the goal's creation date.

The `_subcat_*` / `_saved_from_links` helpers implement link-based progress: each
link claims a share of a subcategory's unspent budget (first-linked = first-served)
and that share of the subcategory's elapsed-months set-aside counts as saved.
"""
from __future__ import annotations

from datetime import date
from datetime import date as date_type

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BudgetYear, Goal, GoalContribution, GoalSubcategoryLink, MonthlyBudget, Transaction, User
from app.services.rollup import elapsed_months, f


def _months_between(a: date, b: date) -> int:
    """Whole calendar months from a to b (can be negative)."""
    return (b.year - a.year) * 12 + (b.month - a.month)


def compute_goal(
    target_amount: float,
    target_date: date | None,
    saved: float,
    created_at: date | None = None,
    today: date | None = None,
) -> dict:
    """Derived goal figures. Pure function so it can be unit-tested without a DB."""
    today = today or date.today()
    remaining = max(0.0, target_amount - saved)
    pct = (saved / target_amount) if target_amount else 0.0

    monthly_required: float | None = None
    on_track: bool | None = None

    if target_date is not None:
        # Months left to contribute, inclusive of the current month.
        months_left = _months_between(today, target_date) + 1
        monthly_required = remaining if months_left <= 0 else remaining / months_left

        # Straight-line pacing from the creation date to the target date.
        start = created_at or today
        total_span = _months_between(start, target_date)
        elapsed = _months_between(start, today)
        frac = 1.0 if total_span <= 0 else min(1.0, max(0.0, elapsed / total_span))
        expected_by_now = target_amount * frac
        on_track = saved + 1e-6 >= expected_by_now

    return {
        "saved": saved,
        "remaining": remaining,
        "pct": pct,
        "monthly_required": monthly_required,
        "on_track": on_track,
    }


def _subcat_remaining(db: Session, user_id: int, subcategory_id: int, today: date_type | None = None) -> float:
    """Total unspent budget for a subcategory: max(0, revised_annual − spent_ytd).

    Uses the full annual revised budget (all 12 months, not just elapsed ones) minus
    all actual transactions. This lets a goal see the entire remaining budget for the
    year — e.g. ₹47,016 revised − ₹25,759 spent = ₹21,257 — rather than only the
    tiny set-aside from elapsed months. Past budget years with a positive surplus are
    included; future years (year > today) are skipped.

    This is the goal's *capacity* on the subcategory (used for link weights and the
    link-eligibility check). For how much is actually saved so far, see _subcat_set_aside.
    """
    today = today or date_type.today()
    budget_years = db.scalars(select(BudgetYear).where(BudgetYear.user_id == user_id)).all()

    total = 0.0
    for by in budget_years:
        if by.year > today.year:
            continue  # future years not started yet

        revised_total = sum(
            f(row.revised_amount)
            for row in db.scalars(
                select(MonthlyBudget).where(
                    MonthlyBudget.budget_year_id == by.id,
                    MonthlyBudget.subcategory_id == subcategory_id,
                )
            ).all()
        )

        spent_total = sum(
            f(amt)
            for (amt,) in db.execute(
                select(Transaction.amount).where(
                    Transaction.budget_year_id == by.id,
                    Transaction.subcategory_id == subcategory_id,
                )
            ).all()
        )

        remaining = revised_total - spent_total
        if remaining > 0:
            total += remaining

    return total


def _subcat_set_aside(
    db: Session, user_id: int, subcategory_id: int, today: date_type | None = None
) -> float:
    """Set-aside actually accumulated for a subcategory: sum over ELAPSED months of
    max(0, revised − spent), across all started budget years. This is what has genuinely
    been put aside so far — unlike _subcat_remaining (full-annual capacity, including
    months not yet elapsed). Mirrors the Set-Aside column in the annual rollup.
    """
    today = today or date_type.today()
    budget_years = db.scalars(select(BudgetYear).where(BudgetYear.user_id == user_id)).all()

    total = 0.0
    for by in budget_years:
        if by.year > today.year:
            continue
        elapsed = elapsed_months(by.year, today)
        if elapsed <= 0:
            continue

        revised_by_month = {
            row.month: f(row.revised_amount)
            for row in db.scalars(
                select(MonthlyBudget).where(
                    MonthlyBudget.budget_year_id == by.id,
                    MonthlyBudget.subcategory_id == subcategory_id,
                )
            ).all()
        }
        spent_by_month: dict[int, float] = {}
        for txn_date, amt in db.execute(
            select(Transaction.txn_date, Transaction.amount).where(
                Transaction.budget_year_id == by.id,
                Transaction.subcategory_id == subcategory_id,
            )
        ).all():
            spent_by_month[txn_date.month] = spent_by_month.get(txn_date.month, 0.0) + f(amt)

        for m in range(1, elapsed + 1):
            total += max(0.0, revised_by_month.get(m, 0.0) - spent_by_month.get(m, 0.0))

    return total


def _prior_claims(db: Session, subcategory_id: int, before_link_id: int) -> float:
    """Sum of target_amounts of goals linked to subcategory_id via links with id < before_link_id.
    This implements first-linked = first-served priority ordering."""
    prior_links = db.scalars(
        select(GoalSubcategoryLink).where(
            GoalSubcategoryLink.subcategory_id == subcategory_id,
            GoalSubcategoryLink.id < before_link_id,
        )
    ).all()
    total = 0.0
    for pl in prior_links:
        g = db.get(Goal, pl.goal_id)
        if g is not None:
            total += f(g.target_amount)
    return total


def _saved_from_links(db: Session, goal: Goal, today: date_type | None = None) -> float:
    """Saved-so-far via links. Each link claims a share of the subcategory's full-annual
    unspent budget (sequential, first-linked = first-served); that same share of the
    subcategory's *set-aside actually accumulated in elapsed months* counts as saved. So a
    goal carrying 100% of a subcategory's unspent budget gets 100% of its set-aside — the
    progress reflects what's truly been collected, not the full-year capacity. Falls back
    to manual contributions when no links exist."""
    links = sorted(
        db.scalars(select(GoalSubcategoryLink).where(GoalSubcategoryLink.goal_id == goal.id)).all(),
        key=lambda lk: lk.id,
    )
    if not links:
        rows = db.execute(
            select(GoalContribution.amount).where(GoalContribution.goal_id == goal.id)
        ).all()
        return sum(f(amt) for (amt,) in rows)

    total = 0.0
    remaining_target = f(goal.target_amount)
    for link in links:
        if link.subcategory_id is None or remaining_target <= 0:
            continue
        subcat_unspent = _subcat_remaining(db, goal.user_id, link.subcategory_id, today)
        prior = _prior_claims(db, link.subcategory_id, link.id)
        available = max(0.0, subcat_unspent - prior)
        claim = min(remaining_target, available)
        if subcat_unspent > 0:
            weight = claim / subcat_unspent
            total += weight * _subcat_set_aside(db, goal.user_id, link.subcategory_id, today)
        remaining_target -= claim
    return total


def goal_progress_summaries(db: Session, user: User, limit: int = 5) -> list[dict]:
    """Active goals with derived progress, nearest target_date first — compact context
    for the AI revision prompt. Returns
    ``[{name, target_amount, target_date, saved, remaining, monthly_required, on_track}]``.
    """
    goals = db.scalars(
        select(Goal)
        .where(Goal.user_id == user.id, Goal.archived.is_(False))
        .order_by(Goal.target_date.is_(None), Goal.target_date, Goal.id)
        .limit(limit)
    ).all()
    out: list[dict] = []
    for goal in goals:
        saved = _saved_from_links(db, goal)
        summary = compute_goal(
            target_amount=f(goal.target_amount),
            target_date=goal.target_date,
            saved=saved,
            created_at=goal.created_at.date() if goal.created_at else None,
        )
        out.append(
            {
                "name": goal.name,
                "target_amount": f(goal.target_amount),
                "target_date": goal.target_date.isoformat() if goal.target_date else None,
                "saved": round(summary["saved"], 2),
                "remaining": round(summary["remaining"], 2),
                "monthly_required": (
                    round(summary["monthly_required"], 2)
                    if summary["monthly_required"] is not None
                    else None
                ),
                "on_track": summary["on_track"],
            }
        )
    return out
