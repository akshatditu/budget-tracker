from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_year_or_404
from app.models import Subcategory, Transaction, User
from app.schemas import TransactionCreate, TransactionOut, TransactionUpdate

router = APIRouter(prefix="/api/years/{year}/transactions", tags=["transactions"])


def _check_sub(db: Session, user: User, sub_id: int) -> Subcategory:
    sub = db.get(Subcategory, sub_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")
    return sub


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    year: int,
    month: int | None = Query(default=None, ge=1, le=12),
    subcategory_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    by = get_year_or_404(year, db, user)
    stmt = select(Transaction).where(Transaction.budget_year_id == by.id)
    if month is not None:
        stmt = stmt.where(extract("month", Transaction.txn_date) == month)
    if subcategory_id is not None:
        stmt = stmt.where(Transaction.subcategory_id == subcategory_id)
    return db.scalars(stmt.order_by(Transaction.txn_date.desc(), Transaction.id.desc())).all()


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(year: int, payload: TransactionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    _check_sub(db, user, payload.subcategory_id)
    if payload.txn_date.year != year:
        raise HTTPException(400, "Transaction date must fall within the budget year")
    txn = Transaction(
        user_id=user.id,
        budget_year_id=by.id,
        subcategory_id=payload.subcategory_id,
        txn_date=payload.txn_date,
        amount=payload.amount,
        note=payload.note,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_transaction(year: int, txn_id: int, payload: TransactionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    txn = db.get(Transaction, txn_id)
    if txn is None or txn.budget_year_id != by.id or txn.user_id != user.id:
        raise HTTPException(404, "Transaction not found")
    data = payload.model_dump(exclude_unset=True)
    if "subcategory_id" in data:
        _check_sub(db, user, data["subcategory_id"])
    if "txn_date" in data and data["txn_date"].year != year:
        raise HTTPException(400, "Transaction date must fall within the budget year")
    for k, v in data.items():
        setattr(txn, k, v)
    db.commit()
    db.refresh(txn)
    return txn


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(year: int, txn_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    txn = db.get(Transaction, txn_id)
    if txn is None or txn.budget_year_id != by.id or txn.user_id != user.id:
        raise HTTPException(404, "Transaction not found")
    db.delete(txn)
    db.commit()
