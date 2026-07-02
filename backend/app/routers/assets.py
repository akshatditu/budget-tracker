"""Assets / net worth: manually-entered holdings (stocks, MF, PPF, FD, cash, ...).
User-scoped and not tied to a budget year — this is the current point-in-time picture."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import AssetHolding, User
from app.schemas import AssetHoldingCreate, AssetHoldingOut, AssetHoldingUpdate

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("", response_model=list[AssetHoldingOut])
def list_assets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(AssetHolding)
        .where(AssetHolding.user_id == user.id)
        .order_by(AssetHolding.category, AssetHolding.id)
    ).all()


@router.post("", response_model=AssetHoldingOut, status_code=201)
def create_asset(
    payload: AssetHoldingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    holding = AssetHolding(
        user_id=user.id,
        category=payload.category,
        name=payload.name,
        amount=payload.amount,
        as_of_date=date.today(),  # stamped to the day it's added
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.patch("/{holding_id}", response_model=AssetHoldingOut)
def update_asset(
    holding_id: int,
    payload: AssetHoldingUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    holding = db.get(AssetHolding, holding_id)
    if holding is None or holding.user_id != user.id:
        raise HTTPException(404, "Asset holding not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(holding, k, v)
    holding.as_of_date = date.today()  # any edit re-stamps the "last updated" day
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{holding_id}", status_code=204)
def delete_asset(holding_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    holding = db.get(AssetHolding, holding_id)
    if holding is None or holding.user_id != user.id:
        raise HTTPException(404, "Asset holding not found")
    db.delete(holding)
    db.commit()
