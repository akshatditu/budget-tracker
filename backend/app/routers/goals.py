"""Sinking-fund / goal endpoints. Goals are user-scoped (they span budget years).

`saved` is computed from GoalSubcategoryLink rows when any exist (each link
contributes weight/100 × sum of max(0, revised−spent) over elapsed months for its
subcategory). When no links exist the goal falls back to the manual GoalContribution
ledger — amounts are encrypted at rest so SUM() can't run in SQL.
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import BudgetYear, Goal, GoalContribution, GoalSubcategoryLink, MonthlyBudget, Subcategory, Transaction, User
from app.schemas import (
    GoalContributionCreate,
    GoalContributionOut,
    GoalCreate,
    GoalSubcategoryLinkCreate,
    GoalSubcategoryLinkUpdate,
    GoalUpdate,
)
from app.services.goals import compute_goal
from app.services.rollup import f

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _get_goal(db: Session, user: User, goal_id: int) -> Goal:
    goal = db.get(Goal, goal_id)
    if goal is None or goal.user_id != user.id:
        raise HTTPException(404, "Goal not found")
    return goal


def _subcat_remaining(db: Session, user_id: int, subcategory_id: int) -> float:
    """Sum max(0, revised − spent) over all elapsed months for one subcategory."""
    today = date_type.today()
    budget_years = db.scalars(select(BudgetYear).where(BudgetYear.user_id == user_id)).all()

    total = 0.0
    for by in budget_years:
        if by.year < today.year:
            months = range(1, 13)
        elif by.year == today.year:
            months = range(1, today.month + 1)
        else:
            continue

        budget_rows = {
            row.month: f(row.revised_amount)
            for row in db.scalars(
                select(MonthlyBudget).where(
                    MonthlyBudget.budget_year_id == by.id,
                    MonthlyBudget.subcategory_id == subcategory_id,
                )
            ).all()
        }

        txn_rows = db.execute(
            select(
                func.extract("month", Transaction.txn_date).label("m"),
                Transaction.amount,
            ).where(
                Transaction.budget_year_id == by.id,
                Transaction.subcategory_id == subcategory_id,
            )
        ).all()
        spent_by_month: dict[int, float] = {}
        for m, amt in txn_rows:
            key = int(m)
            spent_by_month[key] = spent_by_month.get(key, 0.0) + f(amt)

        for m in months:
            remaining = budget_rows.get(m, 0.0) - spent_by_month.get(m, 0.0)
            if remaining > 0:
                total += remaining

    return total


def _saved_from_links(db: Session, goal: Goal) -> float:
    """Weighted sum of subcategory remaining across all links. Falls back to manual
    contributions when no links exist."""
    links = db.scalars(
        select(GoalSubcategoryLink).where(GoalSubcategoryLink.goal_id == goal.id)
    ).all()
    if not links:
        rows = db.execute(
            select(GoalContribution.amount).where(GoalContribution.goal_id == goal.id)
        ).all()
        return sum(f(amt) for (amt,) in rows)

    total = 0.0
    for link in links:
        if link.subcategory_id is None:
            continue
        total += (float(link.weight) / 100.0) * _subcat_remaining(db, goal.user_id, link.subcategory_id)
    return total


def _link_out(db: Session, link: GoalSubcategoryLink) -> dict:
    sub = db.get(Subcategory, link.subcategory_id) if link.subcategory_id else None
    return {
        "id": link.id,
        "subcategory_id": link.subcategory_id,
        "subcategory_name": sub.name if sub else None,
        "weight": float(link.weight),
    }


def _goal_dict(db: Session, goal: Goal) -> dict:
    saved = _saved_from_links(db, goal)
    links = db.scalars(
        select(GoalSubcategoryLink).where(GoalSubcategoryLink.goal_id == goal.id)
    ).all()
    summary = compute_goal(
        target_amount=f(goal.target_amount),
        target_date=goal.target_date,
        saved=saved,
        created_at=goal.created_at.date() if goal.created_at else None,
    )
    return {
        "id": goal.id,
        "name": goal.name,
        "target_amount": f(goal.target_amount),
        "target_date": goal.target_date,
        "archived": goal.archived,
        "links": [_link_out(db, lk) for lk in links],
        **summary,
    }


@router.get("")
def list_goals(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Goal).where(Goal.user_id == user.id)
    if not include_archived:
        stmt = stmt.where(Goal.archived.is_(False))
    goals = db.scalars(stmt.order_by(Goal.target_date.is_(None), Goal.target_date, Goal.id)).all()
    return [_goal_dict(db, g) for g in goals]


@router.post("", status_code=201)
def create_goal(payload: GoalCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = Goal(
        user_id=user.id,
        name=payload.name,
        target_amount=payload.target_amount,
        target_date=payload.target_date,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _goal_dict(db, goal)


@router.patch("/{goal_id}")
def update_goal(goal_id: int, payload: GoalUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = _get_goal(db, user, goal_id)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)
    db.commit()
    db.refresh(goal)
    return _goal_dict(db, goal)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = _get_goal(db, user, goal_id)
    db.delete(goal)
    db.commit()


# ---- subcategory links ----

@router.get("/{goal_id}/links")
def list_links(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_goal(db, user, goal_id)
    links = db.scalars(
        select(GoalSubcategoryLink).where(GoalSubcategoryLink.goal_id == goal_id)
    ).all()
    return [_link_out(db, lk) for lk in links]


@router.post("/{goal_id}/links", status_code=201)
def add_link(
    goal_id: int,
    payload: GoalSubcategoryLinkCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _get_goal(db, user, goal_id)
    sub = db.get(Subcategory, payload.subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")
    existing = db.scalars(
        select(GoalSubcategoryLink).where(
            GoalSubcategoryLink.goal_id == goal_id,
            GoalSubcategoryLink.subcategory_id == payload.subcategory_id,
        )
    ).first()
    if existing:
        raise HTTPException(409, "This subcategory is already linked to this goal")
    link = GoalSubcategoryLink(
        user_id=user.id,
        goal_id=goal.id,
        subcategory_id=payload.subcategory_id,
        weight=payload.weight,
    )
    db.add(link)
    db.commit()
    return _goal_dict(db, goal)


@router.patch("/{goal_id}/links/{link_id}")
def update_link(
    goal_id: int,
    link_id: int,
    payload: GoalSubcategoryLinkUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_goal(db, user, goal_id)
    link = db.get(GoalSubcategoryLink, link_id)
    if link is None or link.goal_id != goal_id or link.user_id != user.id:
        raise HTTPException(404, "Link not found")
    link.weight = payload.weight
    db.commit()
    goal = db.get(Goal, goal_id)
    return _goal_dict(db, goal)


@router.delete("/{goal_id}/links/{link_id}", status_code=204)
def remove_link(
    goal_id: int,
    link_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_goal(db, user, goal_id)
    link = db.get(GoalSubcategoryLink, link_id)
    if link is None or link.goal_id != goal_id or link.user_id != user.id:
        raise HTTPException(404, "Link not found")
    db.delete(link)
    db.commit()


# ---- contributions ledger ----
@router.get("/{goal_id}/contributions", response_model=list[GoalContributionOut])
def list_contributions(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_goal(db, user, goal_id)
    return db.scalars(
        select(GoalContribution)
        .where(GoalContribution.goal_id == goal_id)
        .order_by(GoalContribution.contrib_date.desc(), GoalContribution.id.desc())
    ).all()


@router.post("/{goal_id}/contributions", status_code=201)
def add_contribution(
    goal_id: int,
    payload: GoalContributionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = _get_goal(db, user, goal_id)
    contrib = GoalContribution(
        user_id=user.id,
        goal_id=goal.id,
        amount=payload.amount,
        contrib_date=payload.contrib_date,
        note=payload.note,
    )
    db.add(contrib)
    db.commit()
    return _goal_dict(db, goal)


@router.delete("/{goal_id}/contributions/{contrib_id}", status_code=204)
def delete_contribution(goal_id: int, contrib_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _get_goal(db, user, goal_id)
    contrib = db.get(GoalContribution, contrib_id)
    if contrib is None or contrib.goal_id != goal_id or contrib.user_id != user.id:
        raise HTTPException(404, "Contribution not found")
    db.delete(contrib)
    db.commit()
