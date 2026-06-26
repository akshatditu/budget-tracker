"""First-run onboarding: build a new user's sections + sub-items from their picks."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import BudgetYear, User
from app.schemas import OnboardingPayload, UserOut
from app.seed import create_structure

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
    create_structure(db, user, sections)

    # Create the current year so the dashboard is immediately usable after onboarding.
    current_year = datetime.now(timezone.utc).year
    year_exists = db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == current_year)
    ).first()
    if year_exists is None:
        db.add(BudgetYear(user_id=user.id, year=current_year))

    user.onboarded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
