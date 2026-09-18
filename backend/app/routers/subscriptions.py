"""Subscriptions / recurring payments. User-scoped (they span years); each due occurrence
is auto-posted to the transaction ledger by `POST /sync` (see services/subscriptions.py)."""
import calendar
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Subcategory, Subscription, Transaction, User
from app.schemas import SubscriptionCreate, SubscriptionOut, SubscriptionUpdate, UpcomingChargeOut
from app.services import subscriptions as svc

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


def _check_sub(db: Session, user: User, sub_id: int) -> None:
    sub = db.get(Subcategory, sub_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")


def _get_or_404(db: Session, user: User, sid: int) -> Subscription:
    s = db.get(Subscription, sid)
    if s is None or s.user_id != user.id:
        raise HTTPException(404, "Subscription not found")
    return s


def _check_dates(start: date, end: date | None) -> None:
    if end is not None and end < start:
        raise HTTPException(400, "End date must be on or after the start date")


@router.get("", response_model=list[SubscriptionOut])
def list_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(Subscription).where(Subscription.user_id == user.id).order_by(Subscription.next_due_date, Subscription.id)
    ).all()


@router.post("", response_model=SubscriptionOut, status_code=201)
def create_subscription(payload: SubscriptionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _check_sub(db, user, payload.subcategory_id)
    _check_dates(payload.start_date, payload.end_date)
    s = Subscription(
        user_id=user.id,
        **payload.model_dump(),
        # No backfill: the first auto-post is the next occurrence on/after today.
        next_due_date=svc.first_due_on_or_after(payload.start_date, payload.frequency, date.today()),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.patch("/{sid}", response_model=SubscriptionOut)
def update_subscription(sid: int, payload: SubscriptionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = _get_or_404(db, user, sid)
    data = payload.model_dump(exclude_unset=True)
    if "subcategory_id" in data:
        _check_sub(db, user, data["subcategory_id"])
    resumed = data.get("active") is True and not s.active
    for k, v in data.items():
        setattr(s, k, v)
    _check_dates(s.start_date, s.end_date)
    if resumed or {"frequency", "start_date"} & data.keys():
        # Re-anchor from today (a resume never posts the charges missed while paused),
        # but never before a charge that was already auto-posted.
        last = db.scalar(select(func.max(Transaction.txn_date)).where(Transaction.subscription_id == s.id))
        floor = max(date.today(), last + timedelta(days=1)) if last else date.today()
        s.next_due_date = svc.first_due_on_or_after(s.start_date, s.frequency, floor)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{sid}", status_code=204)
def delete_subscription(sid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(_get_or_404(db, user, sid))
    db.commit()


@router.post("/sync")
def sync_subscriptions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"posted": svc.post_due(db, user, date.today())}


@router.get("/upcoming", response_model=list[UpcomingChargeOut])
def upcoming_charges(
    year: int,
    month: int = Query(ge=1, le=12),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    start = max(date.today(), date(year, month, 1))
    end = date(year, month, calendar.monthrange(year, month)[1])
    subs = db.scalars(
        select(Subscription).where(Subscription.user_id == user.id, Subscription.active.is_(True))
    ).all()
    out = [
        UpcomingChargeOut(subscription_id=s.id, name=s.name, subcategory_id=s.subcategory_id, amount=s.amount, due_date=d)
        for s in subs
        for d in svc.occurrences_between(s, start, end)
    ]
    return sorted(out, key=lambda c: (c.due_date, c.name))
