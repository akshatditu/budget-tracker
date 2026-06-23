from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import AnnualBudget, BudgetYear, MonthlyBudget, User
from app.schemas import YearCreate, YearOut

router = APIRouter(prefix="/api/years", tags=["years"])


@router.get("", response_model=list[YearOut])
def list_years(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id).order_by(BudgetYear.year.desc())
    ).all()


@router.post("", response_model=YearOut, status_code=201)
def create_year(payload: YearCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    exists = db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == payload.year)
    ).first()
    if exists:
        raise HTTPException(409, f"Year {payload.year} already exists")

    by = BudgetYear(user_id=user.id, year=payload.year)
    db.add(by)
    db.flush()

    if payload.copy_structure_from is not None:
        src = db.scalars(
            select(BudgetYear).where(
                BudgetYear.user_id == user.id, BudgetYear.year == payload.copy_structure_from
            )
        ).first()
        if src:
            for ab in db.scalars(select(AnnualBudget).where(AnnualBudget.budget_year_id == src.id)):
                db.add(AnnualBudget(budget_year_id=by.id, subcategory_id=ab.subcategory_id, initial_amount=ab.initial_amount))
            for mb in db.scalars(select(MonthlyBudget).where(MonthlyBudget.budget_year_id == src.id)):
                db.add(
                    MonthlyBudget(
                        budget_year_id=by.id,
                        subcategory_id=mb.subcategory_id,
                        month=mb.month,
                        initial_amount=mb.initial_amount,
                        revised_amount=mb.revised_amount,
                    )
                )

    db.commit()
    db.refresh(by)
    return by


@router.get("/{year}", response_model=YearOut)
def get_year(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = db.scalars(
        select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == year)
    ).first()
    if by is None:
        raise HTTPException(404, f"Year {year} not found")
    return by
