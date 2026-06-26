"""Sinking-fund / goal endpoints. Goals are user-scoped (they span budget years).

`saved` is summed from the GoalContribution ledger in Python — amounts are encrypted
at rest so SUM() can't run in SQL (same pattern as rollup._spent_by_subcat_month).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Goal, GoalContribution, User
from app.schemas import (
    GoalContributionCreate,
    GoalContributionOut,
    GoalCreate,
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


def _saved(db: Session, goal_id: int) -> float:
    rows = db.execute(
        select(GoalContribution.amount).where(GoalContribution.goal_id == goal_id)
    ).all()
    return sum(f(amt) for (amt,) in rows)


def _goal_dict(db: Session, goal: Goal) -> dict:
    saved = _saved(db, goal.id)
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
