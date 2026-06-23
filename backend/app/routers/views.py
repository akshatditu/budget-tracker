"""Composite read endpoints (month view, rollup, dashboard) + user/settings."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_year_or_404
from app.models import MonthlySetting, User
from app.schemas import MonthlySettingPatch, UserOut, UserUpdate
from app.services import rollup
from app.services.carryforward import carry_forward_chain, carry_forward_for_month

router = APIRouter(prefix="/api", tags=["views"])


# ---- current user / settings ----
@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


# ---- month view ----
@router.get("/years/{year}/months/{month}")
def month_view(year: int, month: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not 1 <= month <= 12:
        raise HTTPException(400, "month must be 1..12")
    by = get_year_or_404(year, db, user)
    view = rollup.month_view(db, by, user, month)
    cf = carry_forward_for_month(db, by, month)
    setting = db.scalars(
        select(MonthlySetting).where(MonthlySetting.budget_year_id == by.id, MonthlySetting.month == month)
    ).first()
    view["summary"]["carry_forward"] = cf
    view["summary"]["spend_limit"] = rollup.f(setting.spend_limit) if setting and setting.spend_limit is not None else None
    view["summary"]["notes"] = setting.notes if setting else None
    return view


@router.patch("/years/{year}/months/{month}/settings")
def patch_monthly_setting(
    year: int, month: int, payload: MonthlySettingPatch, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    if not 1 <= month <= 12:
        raise HTTPException(400, "month must be 1..12")
    by = get_year_or_404(year, db, user)
    setting = db.scalars(
        select(MonthlySetting).where(MonthlySetting.budget_year_id == by.id, MonthlySetting.month == month)
    ).first()
    if setting is None:
        setting = MonthlySetting(budget_year_id=by.id, month=month)
        db.add(setting)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(setting, k, v)
    db.commit()
    return {"month": month, "spend_limit": rollup.f(setting.spend_limit) if setting.spend_limit is not None else None, "opening_carry_forward": rollup.f(setting.opening_carry_forward) if setting.opening_carry_forward is not None else None, "notes": setting.notes}


# ---- annual rollup ----
@router.get("/years/{year}/rollup")
def annual_rollup(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    data = rollup.annual_rollup(db, by, user)
    data["carry_forward"] = carry_forward_chain(db, by)
    return data


# ---- dashboard ----
@router.get("/years/{year}/dashboard")
def dashboard(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    roll = rollup.annual_rollup(db, by, user)
    chain = carry_forward_chain(db, by)
    elapsed = rollup.elapsed_months(by.year)

    section_split = [
        {"name": s["name"], "spent": s["totals"]["spent"], "revised": s["totals"]["revised"], "current": s["totals"]["current"]}
        for s in roll["sections"]
    ]
    monthly_trend = [
        {
            "month": rollup.MONTH_NAMES[m - 1],
            "budget": sum(roll["budget_grid"][s["name"]][m - 1] for s in roll["sections"]),
            "spent": sum(roll["spend_grid"][s["name"]][m - 1] for s in roll["sections"]),
            "income": roll["income_by_month"][m - 1],
        }
        for m in rollup.MONTHS
    ]

    income_total = roll["totals"]["income"]
    spent_total = roll["totals"]["spent"]
    return {
        "year": by.year,
        "kpis": {
            "income": income_total,
            "annual_plan": roll["totals"]["annual_plan"],
            "spent": spent_total,
            "current": roll["totals"]["current"],
            "remaining_in_bank": chain[elapsed - 1]["carry_out"] if elapsed > 0 else 0.0,
            "elapsed_months": elapsed,
        },
        "section_split": section_split,
        "monthly_trend": monthly_trend,
        "plan_vs_actual": roll["plan_vs_actual"],
    }
