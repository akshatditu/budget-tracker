"""Carry-forward pool.

Each month a running balance chains forward:
    carry_in(month)  = carry_out(month - 1)            (month 1 uses opening setting)
    net(month)       = income(month) - spent(month)
    carry_out(month) = carry_in(month) + net(month)

This is the 'From Last Month -> Total Set Aside -> Net Carry Forward' chain from the
Excel monthly summary, generalised across the whole year.
"""
from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import BudgetYear, Category, MonthlySetting, Subcategory, Transaction
from app.services.rollup import MONTH_NAMES, MONTHS, f, income_by_month


def _by_month(db: Session, year_id: int, *, investment: bool) -> dict[int, float]:
    """Sum transactions per month, filtered by whether their category is an investment."""
    op = Category.kind == "investment" if investment else Category.kind != "investment"
    rows = db.execute(
        select(func.extract("month", Transaction.txn_date), func.sum(Transaction.amount))
        .join(Subcategory, Subcategory.id == Transaction.subcategory_id)
        .join(Category, Category.id == Subcategory.category_id)
        .where(Transaction.budget_year_id == year_id, op)
        .group_by(func.extract("month", Transaction.txn_date))
    ).all()
    return {int(m): f(total) for m, total in rows}


def carry_forward_chain(db: Session, by: BudgetYear) -> list[dict]:
    incomes = income_by_month(db, by.id)
    # Investment money is retained wealth, so it doesn't drain the carry-forward pool.
    spent = _by_month(db, by.id, investment=False)
    invested = _by_month(db, by.id, investment=True)

    opening = db.scalars(
        select(MonthlySetting.opening_carry_forward).where(
            MonthlySetting.budget_year_id == by.id, MonthlySetting.month == 1
        )
    ).first()
    carry_in = f(opening)

    chain = []
    for m in MONTHS:
        inc = incomes.get(m, 0.0)
        sp = spent.get(m, 0.0)
        inv = invested.get(m, 0.0)
        net = inc - sp
        carry_out = carry_in + net
        chain.append(
            {
                "month": m,
                "month_name": MONTH_NAMES[m - 1],
                "carry_in": carry_in,
                "income": inc,
                "spent": sp,
                "invested": inv,
                "net": net,
                "carry_out": carry_out,
            }
        )
        carry_in = carry_out
    return chain


def carry_forward_for_month(db: Session, by: BudgetYear, month: int) -> dict:
    for row in carry_forward_chain(db, by):
        if row["month"] == month:
            return row
    return {"month": month, "carry_in": 0.0, "income": 0.0, "spent": 0.0, "invested": 0.0, "net": 0.0, "carry_out": 0.0}
