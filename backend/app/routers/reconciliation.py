"""Reconciliation: record the actual bank balance and compare it against the
computed carry-forward chain so drift can be caught instead of silently accruing."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_year_or_404
from app.models import BalanceSnapshot, User
from app.schemas import BalanceSnapshotCreate
from app.services.carryforward import reconcile

router = APIRouter(prefix="/api/years/{year}/reconciliations", tags=["reconciliation"])


@router.get("")
def list_reconciliations(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    snapshots = db.scalars(
        select(BalanceSnapshot)
        .where(BalanceSnapshot.budget_year_id == by.id, BalanceSnapshot.user_id == user.id)
        .order_by(BalanceSnapshot.as_of_date.desc(), BalanceSnapshot.id.desc())
    ).all()
    return reconcile(db, by, snapshots)


@router.post("", status_code=201)
def create_reconciliation(
    year: int,
    payload: BalanceSnapshotCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    by = get_year_or_404(year, db, user)
    if payload.as_of_date.year != year:
        raise HTTPException(400, "Snapshot date must fall within the budget year")
    snap = BalanceSnapshot(
        user_id=user.id,
        budget_year_id=by.id,
        as_of_date=payload.as_of_date,
        actual_balance=payload.actual_balance,
        note=payload.note,
    )
    db.add(snap)
    db.commit()
    return reconcile(db, by, [snap])[0]


@router.delete("/{snapshot_id}", status_code=204)
def delete_reconciliation(year: int, snapshot_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    by = get_year_or_404(year, db, user)
    snap = db.get(BalanceSnapshot, snapshot_id)
    if snap is None or snap.budget_year_id != by.id or snap.user_id != user.id:
        raise HTTPException(404, "Snapshot not found")
    db.delete(snap)
    db.commit()
