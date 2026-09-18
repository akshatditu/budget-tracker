"""Recurring-payment schedule math and the auto-posting catch-up.

There is no background scheduler (the host sleeps), so posting is lazy: the app calls
`post_due` on load and it posts every occurrence with next_due_date <= today, advancing
the `next_due_date` cursor. Because the cursor only moves forward, re-running is a no-op
and deleting an auto-posted transaction never re-posts it.

Month-based frequencies step from `start_date` (the anchor) and clamp to month end, so a
sub anchored on the 31st charges Feb 28/29 and returns to the 31st in March.
"""
from __future__ import annotations

import calendar
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BudgetYear, Subscription, Transaction, User

STEP_MONTHS = {"monthly": 1, "quarterly": 3, "semiannual": 6, "yearly": 12}


def nth_occurrence(start: date, frequency: str, n: int) -> date:
    if frequency == "weekly":
        return start + timedelta(weeks=n)
    total = start.month - 1 + n * STEP_MONTHS[frequency]
    y, m = start.year + total // 12, total % 12 + 1
    return date(y, m, min(start.day, calendar.monthrange(y, m)[1]))


def first_due_on_or_after(start: date, frequency: str, day: date) -> date:
    if day <= start:
        return start
    if frequency == "weekly":
        return nth_occurrence(start, frequency, -(-(day - start).days // 7))
    months = (day.year - start.year) * 12 + day.month - start.month
    n = max(0, months // STEP_MONTHS[frequency])
    while (d := nth_occurrence(start, frequency, n)) < day:
        n += 1
    return d


def next_after(sub: Subscription, day: date) -> date:
    return first_due_on_or_after(sub.start_date, sub.frequency, day + timedelta(days=1))


def _in_range(sub: Subscription, d: date) -> bool:
    return sub.end_date is None or d <= sub.end_date


def post_due(db: Session, user: User, today: date) -> int:
    """Post every due occurrence of the user's active subscriptions. Rows are locked so
    concurrent syncs (two tabs) can't double-post. Stops at an occurrence whose budget
    year doesn't exist yet, leaving the cursor so it posts once the year is created."""
    subs = db.scalars(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.active.is_(True),
            Subscription.next_due_date <= today,
        )
        .with_for_update()
    ).all()
    years = dict(
        db.execute(select(BudgetYear.year, BudgetYear.id).where(BudgetYear.user_id == user.id)).all()
    )
    posted = 0
    for sub in subs:
        while sub.next_due_date <= today and _in_range(sub, sub.next_due_date):
            by_id = years.get(sub.next_due_date.year)
            if by_id is None:
                break
            db.add(
                Transaction(
                    user_id=user.id,
                    budget_year_id=by_id,
                    subcategory_id=sub.subcategory_id,
                    txn_date=sub.next_due_date,
                    amount=sub.amount,
                    note=sub.name,
                    subscription_id=sub.id,
                )
            )
            posted += 1
            sub.next_due_date = next_after(sub, sub.next_due_date)
    db.commit()
    return posted


def occurrences_between(sub: Subscription, start: date, end: date) -> list[date]:
    """Not-yet-posted occurrences in [start, end] (inclusive)."""
    out: list[date] = []
    d = first_due_on_or_after(sub.start_date, sub.frequency, max(start, sub.next_due_date))
    while d <= end and _in_range(sub, d):
        out.append(d)
        d = next_after(sub, d)
    return out
