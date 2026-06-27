"""Apply a yearly initial budget to a sub-item: store the annual figure and split it
evenly across the 12 monthly rows. Shared by the annual-budget PUT endpoint and the
onboarding flow (which seeds amounts for every picked sub-item at once)."""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AnnualBudget, MonthlyBudget
from app.services.rollup import MONTHS


def apply_annual_budget(
    db: Session,
    year_id: int,
    sub_id: int,
    annual_amount: float,
    *,
    reset_revised: bool = False,
    from_month: int = 1,
) -> float:
    """Upsert the AnnualBudget initial and split it /12 across MonthlyBudget rows.

    New monthly rows get initial == revised == the per-month split. Existing rows always
    have their initial refreshed; by default they keep their revised edits. When
    ``reset_revised`` is set, existing rows in months ``>= from_month`` also have revised
    reset to the per-month split — used when regenerating a budget that's already filled in
    (``from_month=1`` replaces the whole year; the current month replaces "going forward").
    Flushes but does not commit — the caller owns the transaction. Returns the per-month amount.
    """
    ab = db.scalars(
        select(AnnualBudget).where(
            AnnualBudget.budget_year_id == year_id, AnnualBudget.subcategory_id == sub_id
        )
    ).first()
    if ab is None:
        ab = AnnualBudget(budget_year_id=year_id, subcategory_id=sub_id)
        db.add(ab)
    ab.initial_amount = annual_amount

    per_month = round(annual_amount / 12, 2)
    for m in MONTHS:
        existing = db.scalars(
            select(MonthlyBudget).where(
                MonthlyBudget.budget_year_id == year_id,
                MonthlyBudget.subcategory_id == sub_id,
                MonthlyBudget.month == m,
            )
        ).first()
        if existing is None:
            db.add(
                MonthlyBudget(
                    budget_year_id=year_id,
                    subcategory_id=sub_id,
                    month=m,
                    initial_amount=per_month,
                    revised_amount=per_month,
                )
            )
        else:
            existing.initial_amount = per_month
            if reset_revised and m >= from_month:
                existing.revised_amount = per_month
    db.flush()
    return per_month
