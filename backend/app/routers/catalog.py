from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Category, Subcategory, User
from app.schemas import (
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    SubcategoryCreate,
    SubcategoryOut,
    SubcategoryUpdate,
)

router = APIRouter(prefix="/api", tags=["catalog"])


# ---- Categories ----
@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(
        select(Category).where(Category.user_id == user.id).order_by(Category.sort_order, Category.id)
    ).all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cat = Category(user_id=user.id, name=payload.name, sort_order=payload.sort_order, kind=payload.kind)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cat = db.get(Category, category_id)
    if cat is None or cat.user_id != user.id:
        raise HTTPException(404, "Category not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cat = db.get(Category, category_id)
    if cat is None or cat.user_id != user.id:
        raise HTTPException(404, "Category not found")
    db.delete(cat)
    db.commit()


# ---- Subcategories ----
@router.get("/subcategories", response_model=list[SubcategoryOut])
def list_subcategories(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Subcategory).where(Subcategory.user_id == user.id)
    if not include_archived:
        stmt = stmt.where(Subcategory.archived.is_(False))
    return db.scalars(stmt.order_by(Subcategory.sort_order, Subcategory.id)).all()


@router.post("/subcategories", response_model=SubcategoryOut, status_code=201)
def create_subcategory(payload: SubcategoryCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    cat = db.get(Category, payload.category_id)
    if cat is None or cat.user_id != user.id:
        raise HTTPException(404, "Category not found")
    sub = Subcategory(user_id=user.id, category_id=payload.category_id, name=payload.name, sort_order=payload.sort_order)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub


@router.patch("/subcategories/{subcategory_id}", response_model=SubcategoryOut)
def update_subcategory(subcategory_id: int, payload: SubcategoryUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    sub = db.get(Subcategory, subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(sub, k, v)
    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/subcategories/{subcategory_id}", status_code=204)
def delete_subcategory(subcategory_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Archive instead of hard-delete to preserve historical transactions."""
    sub = db.get(Subcategory, subcategory_id)
    if sub is None or sub.user_id != user.id:
        raise HTTPException(404, "Subcategory not found")
    sub.archived = True
    db.commit()
