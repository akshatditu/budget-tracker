from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_year_or_404
from app.models import AnnualBudget, MonthlyBudget, Subcategory, User
from app.schemas import AnnualBudgetSet, AnnualRevisedPatch, GenerateBudgetPayload, MonthlyBudgetPatch
from app.services.budget_apply import apply_annual_budget
from app.services.budget_build import build_budget
from app.services.rollup import elapsed_months, f

router = APIRouter(prefix="/api/years/{year}", tags=["budgets"])


def _get_or_create_monthly(db: Session, year_id: int, sub_id: int, month: int) -> MonthlyBudget:
    mb = db.scalars(
        select(MonthlyBudget).where(
            MonthlyBudget.budget_year_id == year_id,
            MonthlyBudget.subcategory_id == sub_id,
            MonthlyBudget.month == month,
        )
    ).first()
    if mb is None:
        mb = MonthlyBudget(budget_year_id=year_id, subcategory_id=sub_id, month=month, initial_amount=0, revised_amount=0)
        db.add(mb)
        db.flush()
    return mb


@router.post("/generate-budget")
def generate_budget(
    year: int,
    payload: GenerateBudgetPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Regenerate the year's budget with the AI allocator (in-app, for existing users).
    `override_mode` controls how amounts already in place are overwritten."""
    by = get_year_or_404(year, db, user)
    sections = [
        {"name": s.name.strip(), "kind": s.kind, "items": [i.strip() for i in s.items if i.strip()]}
        for s in payload.sections
        if s.name.strip()
    ]
    fixed_bills = [{"name": b.name.strip(), "amount": b.amount} for b in payload.fixed_bills if b.name.strip()]

    # "replace" rewrites every month; "forward" only the current + future months.
    from_month = 1 if payload.override_mode == "replace" else elapsed_months(year)
    build_budget(
        db,
        user,
        by,
        sections=sections,
        fixed_bills=fixed_bills,
        employment_type=payload.employment_type,
        monthly_income=payload.monthly_income,
        reset_revised=True,
        from_month=from_month,
    )
    db.commit()
    return {"year": year, "override_mode": payload.override_mode}


@router.get("/annual-budget")
def get_annual_budget(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Per sub-item: stored annual initial + rolled-up revised (sum of months) + YTD revised."""
    by = get_year_or_404(year, db, user)
    current_month = elapsed_months(year)
    annuals = {
        ab.subcategory_id: f(ab.initial_amount)
        for ab in db.scalars(select(AnnualBudget).where(AnnualBudget.budget_year_id == by.id))
    }
    revised_sum: dict[int, float] = {}
    ytd_revised_sum: dict[int, float] = {}
    for mb in db.scalars(select(MonthlyBudget).where(MonthlyBudget.budget_year_id == by.id)):
        revised_sum[mb.subcategory_id] = revised_sum.get(mb.subcategory_id, 0.0) + f(mb.revised_amount)
        if mb.month <= current_month:
            ytd_revised_sum[mb.subcategory_id] = ytd_revised_sum.get(mb.subcategory_id, 0.0) + f(mb.revised_amount)

    subs = db.scalars(
        select(Subcategory).where(Subcategory.user_id == user.id, Subcategory.archived.is_(False))
    ).all()
    return [
        {
            "subcategory_id": s.id,
            "category_id": s.category_id,
            "name": s.name,
            "initial_annual": annuals.get(s.id, 0.0),
            "revised_annual": revised_sum.get(s.id, 0.0),
            "ytd_revised": ytd_revised_sum.get(s.id, 0.0),
        }
        for s in subs
    ]


@router.put("/annual-budget/{subcategory_id}")
def set_annual_budget(
    year: int,
    subcategory_id: int,
    payload: AnnualBudgetSet,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Set the yearly initial budget for a sub-item and split it evenly across 12
    months. Existing per-month *revised* edits are preserved; only newly created
    monthly rows get revised initialised to the split."""
    by = get_year_or_404(year, db, user)
    sub = db.get(Subcategory, subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")

    per_month = apply_annual_budget(db, by.id, subcategory_id, payload.initial_amount)
    db.commit()
    return {"subcategory_id": subcategory_id, "initial_annual": payload.initial_amount, "per_month": per_month}


@router.patch("/annual-budget/{subcategory_id}/revised")
def set_annual_revised_budget(
    year: int,
    subcategory_id: int,
    payload: AnnualRevisedPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Set the annual revised budget, distributing the remainder after YTD across future months."""
    by = get_year_or_404(year, db, user)
    sub = db.get(Subcategory, subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")

    current_month = elapsed_months(year)
    ytd_revised = sum(
        f(mb.revised_amount)
        for mb in db.scalars(
            select(MonthlyBudget).where(
                MonthlyBudget.budget_year_id == by.id,
                MonthlyBudget.subcategory_id == subcategory_id,
                MonthlyBudget.month <= current_month,
            )
        )
    )

    future_months = list(range(current_month + 1, 13))
    if future_months:
        per_month = round((payload.revised_amount - ytd_revised) / len(future_months), 2)
        for m in future_months:
            mb = _get_or_create_monthly(db, by.id, subcategory_id, m)
            mb.revised_amount = per_month

    db.commit()
    return {"subcategory_id": subcategory_id, "revised_amount": payload.revised_amount}


@router.patch("/months/{month}/budget/{subcategory_id}")
def patch_monthly_budget(
    year: int,
    month: int,
    subcategory_id: int,
    payload: MonthlyBudgetPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not 1 <= month <= 12:
        raise HTTPException(400, "month must be 1..12")
    by = get_year_or_404(year, db, user)
    sub = db.get(Subcategory, subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")
    mb = _get_or_create_monthly(db, by.id, subcategory_id, month)
    mb.revised_amount = payload.revised_amount
    db.commit()
    return {"subcategory_id": subcategory_id, "month": month, "revised_amount": payload.revised_amount}
