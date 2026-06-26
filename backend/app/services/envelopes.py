"""Per-envelope (subcategory) running balance for opt-in rollover.

When a subcategory has rollover enabled, its unspent budget carries into the same
envelope next month and overspend borrows forward:

    rolled_in(m)  = rolled_out(m - 1)            (0 in January)
    available(m)  = revised(m) + rolled_in(m)
    rolled_out(m) = available(m) - spent(m)

This redistributes budget *within* the same envelope across months; it does not
change the cash carry-forward chain (income - spent), which stays the wallet view.
Investments never roll over (they are retained wealth, handled by the caller).
"""
from __future__ import annotations


def envelope_row(
    budgets: dict[tuple[int, int], tuple[float, float]],
    spent: dict[tuple[int, int], float],
    sub_id: int,
    month: int,
) -> dict:
    """Chain Jan..month for one subcategory and return that month's envelope figures.

    `budgets` maps (sub_id, month) -> (initial, revised); `spent` maps (sub_id, month)
    -> amount. Both are the whole-year dicts month_view already loads, so no extra
    queries are needed.
    """
    rolled_in = 0.0
    row = {"rolled_in": 0.0, "available": 0.0, "rolled_out": 0.0}
    for m in range(1, month + 1):
        revised = budgets.get((sub_id, m), (0.0, 0.0))[1]
        sp = spent.get((sub_id, m), 0.0)
        available = revised + rolled_in
        rolled_out = available - sp
        row = {"rolled_in": rolled_in, "available": available, "rolled_out": rolled_out}
        rolled_in = rolled_out
    return row
