"""First-run onboarding: build a new user's sections + sub-items from their picks, then
auto-allocate a starting budget. The heavy lifting lives in ``services.budget_build`` so the
in-app "Build my budget with AI" regeneration behaves identically."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import BudgetYear, User
from app.schemas import OnboardingPayload, UserOut
from app.services.budget_build import build_budget
from app.services.profile_context import profile_dict, upsert_profile

router = APIRouter(prefix="/api", tags=["onboarding"])


@router.post("/onboarding", response_model=UserOut)
def complete_onboarding(
    payload: OnboardingPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.onboarded_at is not None:
        raise HTTPException(409, "Onboarding already completed")

    sections = [
        {"name": s.name.strip(), "kind": s.kind, "items": [i.strip() for i in s.items if i.strip()]}
        for s in payload.sections
        if s.name.strip()
    ]
    fixed_bills = [{"name": b.name.strip(), "amount": b.amount} for b in payload.fixed_bills if b.name.strip()]

    # Create the current year so the dashboard is immediately usable after onboarding.
    current_year = datetime.now(timezone.utc).year
    by = db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == current_year)
    ).first()
    if by is None:
        by = BudgetYear(user_id=user.id, year=current_year)
        db.add(by)
    db.flush()

    # Persist the optional lifestyle profile, then feed whatever is stored to the AI.
    if payload.profile is not None:
        upsert_profile(db, user, payload.profile)

    build_budget(
        db,
        user,
        by,
        sections=sections,
        fixed_bills=fixed_bills,
        employment_type=payload.employment_type,
        monthly_income=payload.monthly_income,
        profile=profile_dict(db, user),
    )

    user.onboarded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
