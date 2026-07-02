"""AI budget revision: generate a draft from actual spending, review it, then accept or
discard. Only one *pending* draft may exist per (user, year); accepting applies the revised
amounts forward (current + future months) and keeps the row as revision history."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_year_or_404
from app.models import BudgetRevisionDraft, BudgetRevisionItem, Category, Subcategory, User
from app.schemas import BudgetRevisionDraftOut, RevisionGeneratePayload
from app.services.budget_apply import apply_revised_budget
from app.services.revise_budget import build_context, generate_revision, rule_based_revision
from app.services.rollup import f

router = APIRouter(prefix="/api/years/{year}", tags=["revision"])

PENDING = "pending"
ACCEPTED = "accepted"
DISCARDED = "discarded"
DRAFT_EXISTS_MSG = (
    "You already have a pending AI budget revision. "
    "Please either accept or discard it before generating another revision."
)


def _pending_draft(db: Session, user_id: int, year_id: int) -> BudgetRevisionDraft | None:
    return db.scalars(
        select(BudgetRevisionDraft).where(
            BudgetRevisionDraft.user_id == user_id,
            BudgetRevisionDraft.budget_year_id == year_id,
            BudgetRevisionDraft.status == PENDING,
        )
    ).first()


def _serialize(db: Session, draft: BudgetRevisionDraft, year: int) -> dict:
    """Build the BudgetRevisionDraftOut payload, joining sub-item name/section/kind."""
    meta = {
        sub.id: (sub.name, cat.name, cat.kind)
        for sub, cat in db.execute(
            select(Subcategory, Category).join(Category, Subcategory.category_id == Category.id)
        ).all()
    }
    items = []
    for it in draft.items:
        name, section, kind = meta.get(it.subcategory_id, ("(removed)", "", "spending"))
        current = f(it.current_annual)
        revised = f(it.revised_annual)
        items.append(
            {
                "subcategory_id": it.subcategory_id,
                "name": name,
                "section": section,
                "kind": kind,
                "current_annual": current,
                "revised_annual": revised,
                "delta": round(revised - current, 2),
                "reason": it.reason,
            }
        )
    return {
        "id": draft.id,
        "year": year,
        "status": draft.status,
        "user_note": draft.user_note,
        "created_at": draft.created_at,
        "items": items,
        "insights": json.loads(draft.insights) if draft.insights else [],
    }


@router.get("/budget-revision", response_model=BudgetRevisionDraftOut | None)
def get_budget_revision(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """The current pending AI revision draft for the year, or null if none."""
    by = get_year_or_404(year, db, user)
    draft = _pending_draft(db, user.id, by.id)
    return _serialize(db, draft, year) if draft else None


@router.post("/budget-revision", response_model=BudgetRevisionDraftOut)
def generate_budget_revision(
    year: int,
    payload: RevisionGeneratePayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Analyse the year's actual spending + the user's note and store a draft revision.
    Refuses (409) when a pending draft already exists — one at a time."""
    by = get_year_or_404(year, db, user)
    if _pending_draft(db, user.id, by.id) is not None:
        raise HTTPException(409, DRAFT_EXISTS_MSG)

    context = build_context(db, by, user)
    result = generate_revision(currency=user.currency, context=context, user_note=payload.user_note)
    if result is None:
        result = rule_based_revision(context=context, user_note=payload.user_note)

    current_by_id = {it["subcategory_id"]: it["current_annual"] for it in context["items"]}
    draft = BudgetRevisionDraft(
        user_id=user.id,
        budget_year_id=by.id,
        status=PENDING,
        user_note=(payload.user_note or None),
        insights=json.dumps(result["insights"]),
    )
    db.add(draft)
    db.flush()
    for row in result["items"]:
        sid = row["subcategory_id"]
        if sid not in current_by_id:
            continue
        db.add(
            BudgetRevisionItem(
                draft_id=draft.id,
                subcategory_id=sid,
                current_annual=current_by_id[sid],
                revised_annual=round(row["monthly_amount"] * 12, 2),
                reason=row.get("reason"),
            )
        )
    db.commit()
    db.refresh(draft)
    return _serialize(db, draft, year)


@router.post("/budget-revision/accept", response_model=BudgetRevisionDraftOut)
def accept_budget_revision(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Apply the pending draft's revised amounts across the whole year (every month's revised set
    to the new rate; the initial budget is left untouched) and mark it accepted. The accepted draft
    is kept as the new baseline for future revisions."""
    by = get_year_or_404(year, db, user)
    draft = _pending_draft(db, user.id, by.id)
    if draft is None:
        raise HTTPException(404, "No pending revision to accept")

    for it in draft.items:
        apply_revised_budget(db, by.id, it.subcategory_id, f(it.revised_annual))
    draft.status = ACCEPTED
    draft.accepted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(draft)
    return _serialize(db, draft, year)


@router.delete("/budget-revision", status_code=204)
def discard_budget_revision(year: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Discard the pending draft; the live budget is left untouched. The row is kept
    (status="discarded") so future revisions can learn what the user rejected."""
    by = get_year_or_404(year, db, user)
    draft = _pending_draft(db, user.id, by.id)
    if draft is not None:
        draft.status = DISCARDED
        db.commit()
    return Response(status_code=204)
