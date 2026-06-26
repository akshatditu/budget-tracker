"""Auth seam. The signed session cookie (set by routers/auth.py after Google SSO)
carries the logged-in user's email; every request resolves the user from it."""
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import BudgetYear, User


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    email = request.session.get("user_email")
    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def get_year_or_404(year: int, db: Session, user: User) -> BudgetYear:
    by = db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == year)
    ).first()
    if by is None:
        raise HTTPException(status_code=404, detail=f"Budget year {year} not found")
    return by
