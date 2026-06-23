"""Auth seam. Until JWT login lands (phase 2), every request resolves to the
single seeded user. Swapping in real auth means only changing this function."""
from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import BudgetYear, User


def get_current_user(db: Session = Depends(get_db)) -> User:
    user = db.scalars(select(User).order_by(User.id)).first()
    if user is None:
        raise HTTPException(status_code=500, detail="No user seeded. Run `python -m app.seed`.")
    return user


def get_year_or_404(year: int, db: Session, user: User) -> BudgetYear:
    by = db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == year)
    ).first()
    if by is None:
        raise HTTPException(status_code=404, detail=f"Budget year {year} not found")
    return by
