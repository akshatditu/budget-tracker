from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_year_or_404
from app.models import Income, User
from app.schemas import IncomeCreate, IncomeOut, IncomeUpdate

router = APIRouter(prefix="/api/years/{year}/incomes", tags=["incomes"])


@router.get("", response_model=list[IncomeOut])
def list_incomes(
    year: int,
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    by = get_year_or_404(year, db, user)
    stmt = select(Income).where(Income.budget_year_id == by.id)
    if month is not None:
        stmt = stmt.where(Income.month == month)
    return db.scalars(stmt.order_by(Income.month, Income.id)).all()


@router.post("", response_model=IncomeOut, status_code=201)
def create_income(year: int, payload: IncomeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    inc = Income(
        user_id=user.id,
        budget_year_id=by.id,
        month=payload.month,
        source=payload.source,
        amount=payload.amount,
        income_date=payload.income_date,
        note=payload.note,
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc


@router.patch("/{income_id}", response_model=IncomeOut)
def update_income(year: int, income_id: int, payload: IncomeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    inc = db.get(Income, income_id)
    if inc is None or inc.budget_year_id != by.id or inc.user_id != user.id:
        raise HTTPException(404, "Income not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(inc, k, v)
    db.commit()
    db.refresh(inc)
    return inc


@router.delete("/{income_id}", status_code=204)
def delete_income(year: int, income_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    inc = db.get(Income, income_id)
    if inc is None or inc.budget_year_id != by.id or inc.user_id != user.id:
        raise HTTPException(404, "Income not found")
    db.delete(inc)
    db.commit()
