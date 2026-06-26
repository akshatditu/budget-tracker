"""Sinking-fund / goal math.

`saved` is summed from the GoalContribution ledger (never stored), mirroring how
`spent` is summed from transactions. `monthly_required` paces the remaining amount
over the months left until the target date; `on_track` compares saved-so-far against
a straight-line schedule anchored at the goal's creation date.
"""
from __future__ import annotations

from datetime import date


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
