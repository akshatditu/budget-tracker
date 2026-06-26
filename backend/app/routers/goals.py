"""Sinking-fund / goal endpoints. Goals are user-scoped (they span budget years).

`saved` is computed from GoalSubcategoryLink rows when any exist. Each link
contributes min(remaining_target, max(0, subcat_unspent - prior_claims)) where
prior_claims = sum of target_amounts of goals linked to the same subcategory via
links with a lower id (first-linked = first-served). When no links exist the goal
falls back to the manual GoalContribution ledger — amounts are encrypted at rest
so SUM() can't run in SQL.
"""
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import BudgetYear, Goal, GoalContribution, GoalSubcategoryLink, MonthlyBudget, Subcategory, Transaction, User
from app.schemas import (
    GoalContributionCreate,
    GoalContributionOut,
    GoalCreate,
    GoalSubcategoryLinkCreate,
    GoalUpdate,
    SubcatUnspentOut,
)
from app.services.goals import compute_goal
from app.services.rollup import elapsed_months, f

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _get_goal(db: Session, user: User, goal_id: int) -> Goal:
    goal = db.get(Goal, goal_id)
    if goal is None or goal.user_id != user.id:
        raise HTTPException(404, "Goal not found")
    return goal


def _subcat_remaining(db: Session, user_id: int, subcategory_id: int, today: date_type | None = None) -> float:
    """Total unspent budget for a subcategory: max(0, revised_annual − spent_ytd).

    Uses the full annual revised budget (all 12 months, not just elapsed ones) minus
    all actual transactions. This lets a goal see the entire remaining budget for the
    year — e.g. ₹47,016 revised − ₹25,759 spent = ₹21,257 — rather than only the
    tiny set-aside from elapsed months. Past budget years with a positive surplus are
    included; future years (year > today) are skipped.

    This is the goal's *capacity* on the subcategory (used for link weights and the
    link-eligibility check). For how much is actually saved so far, see _subcat_set_aside.
    """
    today = today or date_type.today()
    budget_years = db.scalars(select(BudgetYear).where(BudgetYear.user_id == user_id)).all()

    total = 0.0
    for by in budget_years:
        if by.year > today.year:
            continue  # future years not started yet

        revised_total = sum(
            f(row.revised_amount)
            for row in db.scalars(
                select(MonthlyBudget).where(
                    MonthlyBudget.budget_year_id == by.id,
                    MonthlyBudget.subcategory_id == subcategory_id,
                )
            ).all()
        )

        spent_total = sum(
            f(amt)
            for (amt,) in db.execute(
                select(Transaction.amount).where(
                    Transaction.budget_year_id == by.id,
                    Transaction.subcategory_id == subcategory_id,
                )
            ).all()
        )

        remaining = revised_total - spent_total
        if remaining > 0:
            total += remaining

    return total


def _subcat_set_aside(
    db: Session, user_id: int, subcategory_id: int, today: date_type | None = None
) -> float:
    """Set-aside actually accumulated for a subcategory: sum over ELAPSED months of
    max(0, revised − spent), across all started budget years. This is what has genuinely
    been put aside so far — unlike _subcat_remaining (full-annual capacity, including
    months not yet elapsed). Mirrors the Set-Aside column in the annual rollup.
    """
    today = today or date_type.today()
    budget_years = db.scalars(select(BudgetYear).where(BudgetYear.user_id == user_id)).all()

    total = 0.0
    for by in budget_years:
        if by.year > today.year:
            continue
        elapsed = elapsed_months(by.year, today)
        if elapsed <= 0:
            continue

        revised_by_month = {
            row.month: f(row.revised_amount)
            for row in db.scalars(
                select(MonthlyBudget).where(
                    MonthlyBudget.budget_year_id == by.id,
                    MonthlyBudget.subcategory_id == subcategory_id,
                )
            ).all()
        }
        spent_by_month: dict[int, float] = {}
        for txn_date, amt in db.execute(
            select(Transaction.txn_date, Transaction.amount).where(
                Transaction.budget_year_id == by.id,
                Transaction.subcategory_id == subcategory_id,
            )
        ).all():
            spent_by_month[txn_date.month] = spent_by_month.get(txn_date.month, 0.0) + f(amt)

        for m in range(1, elapsed + 1):
            total += max(0.0, revised_by_month.get(m, 0.0) - spent_by_month.get(m, 0.0))

    return total


def _prior_claims(db: Session, subcategory_id: int, before_link_id: int) -> float:
    """Sum of target_amounts of goals linked to subcategory_id via links with id < before_link_id.
    This implements first-linked = first-served priority ordering."""
    prior_links = db.scalars(
        select(GoalSubcategoryLink).where(
            GoalSubcategoryLink.subcategory_id == subcategory_id,
            GoalSubcategoryLink.id < before_link_id,
        )
    ).all()
    total = 0.0
    for pl in prior_links:
        g = db.get(Goal, pl.goal_id)
        if g is not None:
            total += f(g.target_amount)
    return total


def _saved_from_links(db: Session, goal: Goal, today: date_type | None = None) -> float:
    """Saved-so-far via links. Each link claims a share of the subcategory's full-annual
    unspent budget (sequential, first-linked = first-served); that same share of the
    subcategory's *set-aside actually accumulated in elapsed months* counts as saved. So a
    goal carrying 100% of a subcategory's unspent budget gets 100% of its set-aside — the
    progress reflects what's truly been collected, not the full-year capacity. Falls back
    to manual contributions when no links exist."""
    links = sorted(
        db.scalars(select(GoalSubcategoryLink).where(GoalSubcategoryLink.goal_id == goal.id)).all(),
        key=lambda lk: lk.id,
    )
    if not links:
        rows = db.execute(
            select(GoalContribution.amount).where(GoalContribution.goal_id == goal.id)
        ).all()
        return sum(f(amt) for (amt,) in rows)

    total = 0.0
    remaining_target = f(goal.target_amount)
    for link in links:
        if link.subcategory_id is None or remaining_target <= 0:
            continue
        subcat_unspent = _subcat_remaining(db, goal.user_id, link.subcategory_id, today)
        prior = _prior_claims(db, link.subcategory_id, link.id)
        available = max(0.0, subcat_unspent - prior)
        claim = min(remaining_target, available)
        if subcat_unspent > 0:
            weight = claim / subcat_unspent
            total += weight * _subcat_set_aside(db, goal.user_id, link.subcategory_id, today)
        remaining_target -= claim
    return total


def _link_out(db: Session, link: GoalSubcategoryLink, goal: Goal) -> dict:
    sub = db.get(Subcategory, link.subcategory_id) if link.subcategory_id else None
    auto_weight = 0.0
    if link.subcategory_id is not None:
        unspent = _subcat_remaining(db, goal.user_id, link.subcategory_id)
        prior = _prior_claims(db, link.subcategory_id, link.id)
        available = max(0.0, unspent - prior)
        claim = min(f(goal.target_amount), available)
        auto_weight = round(claim / unspent * 100, 2) if unspent > 0 else 0.0
    return {
        "id": link.id,
        "subcategory_id": link.subcategory_id,
        "subcategory_name": sub.name if sub else None,
        "auto_weight": auto_weight,
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
        "links": [_link_out(db, lk, goal) for lk in links],
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

# NOTE: this endpoint must come before /{goal_id} routes so FastAPI doesn't try
# to parse "subcategory-unspent" as an integer goal_id.
@router.get("/subcategory-unspent", response_model=SubcatUnspentOut)
def get_subcat_unspent(
    subcategory_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return unspent budget, amount already claimed by linked goals, and what remains
    available for a new goal link. Used by the frontend Add Link picker."""
    sub = db.get(Subcategory, subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")
    unspent = _subcat_remaining(db, user.id, subcategory_id)
    existing_links = db.scalars(
        select(GoalSubcategoryLink)
        .where(
            GoalSubcategoryLink.subcategory_id == subcategory_id,
            GoalSubcategoryLink.user_id == user.id,
        )
        .order_by(GoalSubcategoryLink.id)
    ).all()
    claimed = sum(f(db.get(Goal, lk.goal_id).target_amount) for lk in existing_links if db.get(Goal, lk.goal_id))
    available = max(0.0, unspent - claimed)
    return SubcatUnspentOut(unspent=unspent, claimed=claimed, available=available)


@router.get("/{goal_id}/links")
def list_links(goal_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    goal = _get_goal(db, user, goal_id)
    links = db.scalars(
        select(GoalSubcategoryLink).where(GoalSubcategoryLink.goal_id == goal_id)
    ).all()
    return [_link_out(db, lk, goal) for lk in links]


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

    # Validate that enough unspent budget is available for this goal's target.
    unspent = _subcat_remaining(db, user.id, payload.subcategory_id)
    existing_links = db.scalars(
        select(GoalSubcategoryLink).where(
            GoalSubcategoryLink.subcategory_id == payload.subcategory_id,
            GoalSubcategoryLink.user_id == user.id,
        )
    ).all()
    claimed = sum(f(db.get(Goal, lk.goal_id).target_amount) for lk in existing_links if db.get(Goal, lk.goal_id))
    available = max(0.0, unspent - claimed)
    goal_target = f(goal.target_amount)
    # Compare at whole-rupee precision (the precision the UI displays). `available`
    # can sit a sub-rupee fraction below an apparently-equal target — e.g. ₹21,256.98
    # vs ₹21,257 — which both render as ₹21,257; enforcing that invisible gap would
    # wrongly reject the link.
    if goal_target > 0 and round(available) < round(goal_target):
        raise HTTPException(
            422,
            f"Only \u20b9{available:,.0f} is available in this subcategory "
            f"(unspent \u20b9{unspent:,.0f} − claimed \u20b9{claimed:,.0f}). "
            f"Increase the subcategory budget by at least \u20b9{goal_target - available:,.0f} first.",
        )

    link = GoalSubcategoryLink(
        user_id=user.id,
        goal_id=goal.id,
        subcategory_id=payload.subcategory_id,
    )
    db.add(link)
    db.commit()
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
