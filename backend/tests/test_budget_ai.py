"""Deterministic fallback allocation (no network). Verifies fixed bills are excluded,
investments get funded, each section is split evenly, amounts are non-negative, and the
total never exceeds the income remaining after fixed bills."""
from app.services.budget_ai import rule_based_allocation

DISCRETIONARY = [
    {"name": "Grocery", "kind": "spending", "section": "Needs"},
    {"name": "Fuel", "kind": "spending", "section": "Needs"},
    {"name": "Dining Out", "kind": "spending", "section": "Wants"},
    {"name": "SIP", "kind": "investment", "section": "Investments"},
]


def test_allocation_stays_within_remaining_income():
    income, fixed = 80000.0, 30000.0
    alloc = rule_based_allocation(monthly_income=income, fixed_total=fixed, discretionary=DISCRETIONARY)

    # Fixed bills are handled separately — never appear in the allocation.
    assert set(alloc) == {"Grocery", "Fuel", "Dining Out", "SIP"}
    assert all(v >= 0 for v in alloc.values())
    # Total discretionary spend cannot exceed what's left after fixed bills (modulo rounding).
    assert sum(alloc.values()) <= (income - fixed) + 1.0


def test_investments_are_funded():
    alloc = rule_based_allocation(monthly_income=80000.0, fixed_total=30000.0, discretionary=DISCRETIONARY)
    assert alloc["SIP"] > 0


def test_section_split_is_even():
    alloc = rule_based_allocation(monthly_income=80000.0, fixed_total=30000.0, discretionary=DISCRETIONARY)
    # The two Needs items share their section budget equally.
    assert alloc["Grocery"] == alloc["Fuel"]


def test_no_disposable_income_zeroes_out():
    alloc = rule_based_allocation(monthly_income=20000.0, fixed_total=25000.0, discretionary=DISCRETIONARY)
    assert all(v == 0 for v in alloc.values())


def test_empty_discretionary_returns_empty():
    assert rule_based_allocation(monthly_income=50000.0, fixed_total=0.0, discretionary=[]) == {}


def test_dependents_shift_needs_weight():
    income, fixed = 80000.0, 30000.0
    base = rule_based_allocation(monthly_income=income, fixed_total=fixed, discretionary=DISCRETIONARY)
    fam = rule_based_allocation(
        monthly_income=income, fixed_total=fixed, discretionary=DISCRETIONARY,
        profile={"dependents": 2},
    )
    # A household with dependents gets more for needs, less for wants; total still fits.
    assert fam["Grocery"] > base["Grocery"]
    assert fam["Dining Out"] < base["Dining Out"]
    assert sum(fam.values()) <= (income - fixed) + 1.0
