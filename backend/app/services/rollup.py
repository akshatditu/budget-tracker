"""Aggregation core — mirrors the Excel math.

Per (subcategory, month):
    spent     = sum of transactions in that month
    remaining = revised - spent

Per (subcategory, year):
    annual_initial = sum of monthly initial
    annual_revised = sum of monthly revised        (revised rolls up to the year)
    spent          = sum of all transactions in year
    set_aside      = sum over ELAPSED months of max(0, revised - spent)
    current        = spent + set_aside
    remaining      = annual_revised - current
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    AnnualBudget,
    BudgetYear,
    Category,
    Income,
    MonthlyBudget,
    Subcategory,
    Transaction,
)

MONTHS = list(range(1, 13))
MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]


def f(x) -> float:
    """Decimal/None -> float."""
    return float(x) if x is not None else 0.0


def elapsed_months(year: int, today: date | None = None) -> int:
    """How many months are 'in the past' for set-aside purposes."""
    today = today or date.today()
    if year < today.year:
        return 12
    if year > today.year:
        return 0
    return today.month


def _spent_by_subcat_month(db: Session, year_id: int) -> dict[tuple[int, int], float]:
    rows = db.execute(
        select(
            Transaction.subcategory_id,
            func.extract("month", Transaction.txn_date),
            func.sum(Transaction.amount),
        )
        .where(Transaction.budget_year_id == year_id)
        .group_by(Transaction.subcategory_id, func.extract("month", Transaction.txn_date))
    ).all()
    return {(int(sid), int(m)): f(total) for sid, m, total in rows}


def _budget_by_subcat_month(
    db: Session, year_id: int
) -> dict[tuple[int, int], tuple[float, float]]:
    rows = db.scalars(
        select(MonthlyBudget).where(MonthlyBudget.budget_year_id == year_id)
    ).all()
    return {(r.subcategory_id, r.month): (f(r.initial_amount), f(r.revised_amount)) for r in rows}


def _active_structure(db: Session, user_id: int):
    """Returns ordered categories and their non-archived subcategories."""
    categories = db.scalars(
        select(Category).where(Category.user_id == user_id).order_by(Category.sort_order, Category.id)
    ).all()
    subs_by_cat: dict[int, list[Subcategory]] = {}
    subs = db.scalars(
        select(Subcategory)
        .where(Subcategory.user_id == user_id, Subcategory.archived.is_(False))
        .order_by(Subcategory.sort_order, Subcategory.id)
    ).all()
    for s in subs:
        subs_by_cat.setdefault(s.category_id, []).append(s)
    return categories, subs_by_cat


def income_by_month(db: Session, year_id: int) -> dict[int, float]:
    rows = db.execute(
        select(Income.month, func.sum(Income.amount))
        .where(Income.budget_year_id == year_id)
        .group_by(Income.month)
    ).all()
    return {int(m): f(total) for m, total in rows}


# --------------------------------------------------------------------------- #
# View builders
# --------------------------------------------------------------------------- #
def month_view(db: Session, by: BudgetYear, user, month: int) -> dict:
    """Full payload for one month: sections -> sub-items + summary."""
    categories, subs_by_cat = _active_structure(db, user.id)
    spent = _spent_by_subcat_month(db, by.id)
    budgets = _budget_by_subcat_month(db, by.id)
    incomes = income_by_month(db, by.id)

    sections = []
    section_totals = {}
    for cat in categories:
        items = []
        t_initial = t_revised = t_spent = 0.0
        for sub in subs_by_cat.get(cat.id, []):
            initial, revised = budgets.get((sub.id, month), (0.0, 0.0))
            sp = spent.get((sub.id, month), 0.0)
            items.append(
                {
                    "subcategory_id": sub.id,
                    "name": sub.name,
                    "initial": initial,
                    "revised": revised,
                    "spent": sp,
                    "remaining": revised - sp,
                }
            )
            t_initial += initial
            t_revised += revised
            t_spent += sp
        section_totals[cat.name] = t_revised
        sections.append(
            {
                "category_id": cat.id,
                "name": cat.name,
                "items": items,
                "totals": {
                    "initial": t_initial,
                    "revised": t_revised,
                    "spent": t_spent,
                    "remaining": t_revised - t_spent,
                },
            }
        )

    income = incomes.get(month, 0.0)
    budget_total = sum(section_totals.values())
    total_spent = sum(s["totals"]["spent"] for s in sections)

    return {
        "year": by.year,
        "month": month,
        "month_name": MONTH_NAMES[month - 1],
        "sections": sections,
        "summary": {
            "income": income,
            "budget_total": budget_total,
            "spent": total_spent,
            "section_totals": section_totals,
            "remaining_in_bank": income - total_spent,
        },
    }


def _subcat_annual(spent, budgets, sub_id, year_elapsed) -> dict:
    annual_initial = sum(budgets.get((sub_id, m), (0.0, 0.0))[0] for m in MONTHS)
    annual_revised = sum(budgets.get((sub_id, m), (0.0, 0.0))[1] for m in MONTHS)
    annual_spent = sum(spent.get((sub_id, m), 0.0) for m in MONTHS)
    set_aside = 0.0
    for m in range(1, year_elapsed + 1):
        revised = budgets.get((sub_id, m), (0.0, 0.0))[1]
        sp = spent.get((sub_id, m), 0.0)
        set_aside += max(0.0, revised - sp)
    current = annual_spent + set_aside
    return {
        "initial": annual_initial,
        "revised": annual_revised,
        "spent": annual_spent,
        "set_aside": set_aside,
        "current": current,
        "remaining": annual_revised - current,
    }


def annual_rollup(db: Session, by: BudgetYear, user) -> dict:
    categories, subs_by_cat = _active_structure(db, user.id)
    spent = _spent_by_subcat_month(db, by.id)
    budgets = _budget_by_subcat_month(db, by.id)
    incomes = income_by_month(db, by.id)
    year_elapsed = elapsed_months(by.year)

    sections = []
    # month x section grids
    spend_grid = {}
    budget_grid = {}
    plan_vs_actual = []

    for cat in categories:
        items = []
        sec_annual = {"initial": 0.0, "revised": 0.0, "spent": 0.0, "set_aside": 0.0, "current": 0.0, "remaining": 0.0}
        sec_month_spend = [0.0] * 12
        sec_month_budget = [0.0] * 12
        for sub in subs_by_cat.get(cat.id, []):
            a = _subcat_annual(spent, budgets, sub.id, year_elapsed)
            items.append({"subcategory_id": sub.id, "name": sub.name, **a})
            for k in sec_annual:
                sec_annual[k] += a[k]
            for i, m in enumerate(MONTHS):
                sec_month_spend[i] += spent.get((sub.id, m), 0.0)
                sec_month_budget[i] += budgets.get((sub.id, m), (0.0, 0.0))[1]
        spend_grid[cat.name] = sec_month_spend
        budget_grid[cat.name] = sec_month_budget
        sections.append({"category_id": cat.id, "name": cat.name, "items": items, "totals": sec_annual})

        ytd_budget = sum(sec_month_budget[:year_elapsed])
        ytd_spent = sum(sec_month_spend[:year_elapsed])
        plan = sec_annual["revised"]
        pct = (ytd_spent / ytd_budget) if ytd_budget else 0.0
        if pct > 1.0:
            status = "Over"
        elif pct > 0.85:
            status = "Watch"
        else:
            status = "OK"
        plan_vs_actual.append(
            {
                "section": cat.name,
                "annual_plan": plan,
                "ytd_budget": ytd_budget,
                "ytd_spent": ytd_spent,
                "variance": plan - sec_annual["current"],
                "pct_of_ytd_budget": pct,
                "status": status,
            }
        )

    income_total = sum(incomes.values())
    return {
        "year": by.year,
        "month_names": MONTH_NAMES,
        "sections": sections,
        "spend_grid": spend_grid,
        "budget_grid": budget_grid,
        "income_by_month": [incomes.get(m, 0.0) for m in MONTHS],
        "plan_vs_actual": plan_vs_actual,
        "totals": {
            "annual_plan": sum(s["totals"]["revised"] for s in sections),
            "spent": sum(s["totals"]["spent"] for s in sections),
            "current": sum(s["totals"]["current"] for s in sections),
            "income": income_total,
        },
    }
