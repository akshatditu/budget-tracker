"""Unit tests for the rollup math (no DB) — pin the Excel-parity semantics."""
from datetime import date
from types import SimpleNamespace

from app.services.rollup import _rank_top_subcats, _subcat_annual, days_left_in_month, elapsed_months


def test_elapsed_months():
    assert elapsed_months(2025, today=date(2026, 6, 23)) == 12  # past year
    assert elapsed_months(2027, today=date(2026, 6, 23)) == 0   # future year
    assert elapsed_months(2026, today=date(2026, 6, 23)) == 6   # current year -> June


def test_days_left_in_month():
    # Current month: today inclusive through month end (June has 30 days).
    assert days_left_in_month(2026, 6, today=date(2026, 6, 23)) == 8
    assert days_left_in_month(2026, 6, today=date(2026, 6, 30)) == 1
    # Past month -> nothing left to pace.
    assert days_left_in_month(2026, 5, today=date(2026, 6, 23)) == 0
    # Future month -> the whole month is still ahead (July has 31 days).
    assert days_left_in_month(2026, 7, today=date(2026, 6, 23)) == 31


def test_subcat_annual_set_aside_and_current():
    """Jan revised 12000 (spent 8000), Feb-Dec revised 10000 (unspent), elapsed=6."""
    sub_id = 1
    budgets = {(sub_id, m): (10000.0, 12000.0 if m == 1 else 10000.0) for m in range(1, 13)}
    spent = {(sub_id, 1): 8000.0}

    a = _subcat_annual(spent, budgets, sub_id, year_elapsed=6)

    assert a["revised"] == 122000.0           # 12000 + 11*10000
    assert a["spent"] == 8000.0
    assert a["set_aside"] == 54000.0          # (12000-8000) + 5*10000
    assert a["overspent"] == 0.0              # no elapsed month went over
    assert a["available"] == 54000.0          # set_aside - overspent
    assert a["current"] == 62000.0            # spent + set_aside
    assert a["remaining"] == 60000.0          # revised - current


def test_subcat_annual_overspend_no_negative_set_aside():
    """Overspending a month contributes 0 (not negative) to set-aside."""
    sub_id = 2
    budgets = {(sub_id, 1): (5000.0, 5000.0)}
    spent = {(sub_id, 1): 9000.0}

    a = _subcat_annual(spent, budgets, sub_id, year_elapsed=1)

    assert a["set_aside"] == 0.0
    assert a["overspent"] == 4000.0           # spent - revised, surfaced explicitly
    assert a["available"] == -4000.0          # set_aside - overspent, net is negative
    assert a["spent"] == 9000.0
    assert a["current"] == 9000.0
    assert a["remaining"] == 5000.0 - 9000.0  # revised - current, can go negative


def _structure():
    """Two spending sections + one investment section, with sub-items."""
    cats = [
        SimpleNamespace(id=1, name="Needs", kind="spending"),
        SimpleNamespace(id=2, name="Wants", kind="spending"),
        SimpleNamespace(id=3, name="Investments", kind="investment"),
    ]
    subs = {
        1: [SimpleNamespace(id=10, name="Groceries"), SimpleNamespace(id=11, name="Fuel")],
        2: [SimpleNamespace(id=20, name="Dining")],
        3: [SimpleNamespace(id=30, name="Stocks")],
    }
    return cats, subs


def test_rank_top_subcats_ranking_and_mom():
    cats, subs = _structure()
    spent = {
        (10, 1): 5000.0, (10, 2): 6000.0,   # Groceries ytd 11000, MoM +1000
        (11, 1): 2000.0, (11, 2): 1000.0,   # Fuel ytd 3000, MoM -1000
        (20, 2): 4000.0,                    # Dining ytd 4000
        (30, 1): 50000.0, (30, 2): 50000.0, # Stocks (investment) — excluded
    }
    rows = _rank_top_subcats(spent, cats, subs, year_elapsed=2)

    assert [r["name"] for r in rows] == ["Groceries", "Dining", "Fuel"]
    assert rows[0]["ytd_spent"] == 11000.0
    assert rows[0]["this_month"] == 6000.0
    assert rows[0]["last_month"] == 5000.0
    assert rows[0]["mom_change"] == 1000.0
    assert rows[2]["mom_change"] == -1000.0
    assert all(r["section"] != "Investments" for r in rows)


def test_rank_top_subcats_limit_and_zero_rows_dropped():
    cats, subs = _structure()
    spent = {(10, 1): 100.0, (11, 1): 200.0, (20, 1): 300.0}
    rows = _rank_top_subcats(spent, cats, subs, year_elapsed=1, limit=2)
    assert [r["name"] for r in rows] == ["Dining", "Fuel"]
    # Zero-spend rows never appear even under the limit.
    rows_all = _rank_top_subcats({(10, 1): 100.0}, cats, subs, year_elapsed=1)
    assert [r["name"] for r in rows_all] == ["Groceries"]


def test_rank_top_subcats_january_has_no_mom():
    cats, subs = _structure()
    rows = _rank_top_subcats({(10, 1): 100.0}, cats, subs, year_elapsed=1)
    assert rows[0]["last_month"] is None
    assert rows[0]["mom_change"] is None


def test_rank_top_subcats_elapsed_zero():
    cats, subs = _structure()
    assert _rank_top_subcats({(10, 1): 100.0}, cats, subs, year_elapsed=0) == []
