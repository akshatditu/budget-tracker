"""Unit tests for the rollup math (no DB) — pin the Excel-parity semantics."""
from datetime import date

from app.services.rollup import _subcat_annual, elapsed_months


def test_elapsed_months():
    assert elapsed_months(2025, today=date(2026, 6, 23)) == 12  # past year
    assert elapsed_months(2027, today=date(2026, 6, 23)) == 0   # future year
    assert elapsed_months(2026, today=date(2026, 6, 23)) == 6   # current year -> June


def test_subcat_annual_set_aside_and_current():
    """Jan revised 12000 (spent 8000), Feb-Dec revised 10000 (unspent), elapsed=6."""
    sub_id = 1
    budgets = {(sub_id, m): (10000.0, 12000.0 if m == 1 else 10000.0) for m in range(1, 13)}
    spent = {(sub_id, 1): 8000.0}

    a = _subcat_annual(spent, budgets, sub_id, year_elapsed=6)

    assert a["revised"] == 122000.0           # 12000 + 11*10000
    assert a["spent"] == 8000.0
    assert a["set_aside"] == 54000.0          # (12000-8000) + 5*10000
    assert a["current"] == 62000.0            # spent + set_aside
    assert a["remaining"] == 60000.0          # revised - current


def test_subcat_annual_overspend_no_negative_set_aside():
    """Overspending a month contributes 0 (not negative) to set-aside."""
    sub_id = 2
    budgets = {(sub_id, 1): (5000.0, 5000.0)}
    spent = {(sub_id, 1): 9000.0}

    a = _subcat_annual(spent, budgets, sub_id, year_elapsed=1)

    assert a["set_aside"] == 0.0
    assert a["spent"] == 9000.0
    assert a["current"] == 9000.0
    assert a["remaining"] == 5000.0 - 9000.0  # revised - current, can go negative
