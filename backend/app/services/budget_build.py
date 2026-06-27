"""Build (or rebuild) a year's budget from the wizard inputs: fixed bills at their exact
amount, everything else allocated by the AI (with a deterministic fallback), and the stated
income persisted for the current month. Shared by first-run onboarding and the in-app
"Build my budget with AI" regeneration so both behave identically."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import BudgetYear, Category, Income, Subcategory, User
from app.seed import create_structure
from app.services.budget_ai import generate_allocation, rule_based_allocation
from app.services.budget_apply import apply_annual_budget

BILLS_SECTION = "Bills"


def build_budget(
    db: Session,
    user: User,
    by: BudgetYear,
    *,
    sections: list[dict],
    fixed_bills: list[dict],
    employment_type: str | None,
    monthly_income: float | None,
    reset_revised: bool = False,
    from_month: int = 1,
) -> None:
    """Create/merge the category structure and write amounts for the given year.

    ``sections`` is ``[{"name", "kind", "items": [str]}]`` and ``fixed_bills`` is
    ``[{"name", "amount"}]``. ``reset_revised``/``from_month`` are passed through to
    :func:`apply_annual_budget` to control how an already-filled year is overwritten.
    Flushes its work but does not commit — the caller owns the transaction.
    """
    fixed_names = {b["name"].lower() for b in fixed_bills}

    # Fixed bills become sub-items under Bills so they get a category + amount like any other.
    if fixed_bills:
        bills = next((s for s in sections if s["name"].lower() == BILLS_SECTION.lower()), None)
        if bills is None:
            bills = {"name": BILLS_SECTION, "kind": "spending", "items": []}
            sections.append(bills)
        for b in fixed_bills:
            if b["name"] not in bills["items"]:
                bills["items"].append(b["name"])
    create_structure(db, user, sections)
    db.flush()

    # Map every (existing + freshly created) sub-item by name, with its section + kind.
    rows = db.execute(
        select(Subcategory, Category)
        .join(Category, Subcategory.category_id == Category.id)
        .where(Subcategory.user_id == user.id, Subcategory.archived.is_(False))
    ).all()
    sub_by_name = {sub.name.lower(): sub for sub, _ in rows}

    # Fixed bills: assign the exact monthly amount the user entered.
    for b in fixed_bills:
        sub = sub_by_name.get(b["name"].lower())
        if sub is not None:
            apply_annual_budget(db, by.id, sub.id, b["amount"] * 12, reset_revised=reset_revised, from_month=from_month)

    # Discretionary picks (everything that isn't a fixed bill): allocate via AI, with a
    # deterministic fallback so we always produce a usable budget.
    discretionary = [
        {"name": sub.name, "kind": cat.kind, "section": cat.name}
        for sub, cat in rows
        if sub.name.lower() not in fixed_names
    ]
    fixed_total = sum(b["amount"] for b in fixed_bills)
    income = monthly_income or 0.0
    allocation = generate_allocation(
        currency=user.currency,
        employment_type=employment_type,
        monthly_income=income,
        fixed_total=fixed_total,
        discretionary=discretionary,
    )
    if allocation is None:
        allocation = rule_based_allocation(
            monthly_income=income, fixed_total=fixed_total, discretionary=discretionary
        )
    for name, amount in allocation.items():
        sub = sub_by_name.get(name.lower())
        if sub is not None and amount > 0:
            apply_annual_budget(db, by.id, sub.id, amount * 12, reset_revised=reset_revised, from_month=from_month)

    # Persist the stated income for the current month — upsert so repeated runs don't stack.
    if monthly_income and monthly_income > 0:
        month = datetime.now(timezone.utc).month
        source = "Salary" if employment_type == "salaried" else "Business"
        existing = db.scalars(
            select(Income).where(
                Income.user_id == user.id, Income.budget_year_id == by.id, Income.month == month
            )
        ).first()
        if existing is not None:
            existing.amount = monthly_income
            existing.source = source
        else:
            db.add(
                Income(
                    user_id=user.id,
                    budget_year_id=by.id,
                    month=month,
                    source=source,
                    amount=monthly_income,
                )
            )
