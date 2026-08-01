"""Seed a default user and the section/sub-item structure (names only, no amounts).

Idempotent: re-running won't duplicate rows. Run with `python -m app.seed`.
"""
import os
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import BudgetYear, Category, Subcategory, User

# Override with SEED_EMAIL to seed a different local user.
DEFAULT_USER = {
    "email": os.environ.get("SEED_EMAIL", "demo@example.com"),
    "display_name": "Demo",
    "currency": "INR",
}

# Starter structure. Editable in the UI afterwards.
STRUCTURE: dict[str, list[str]] = {
    "Bills": [
        "Term Insurance", "Vehicle Insurance", "Phone/Wifi Bill", "OTT+Subscriptions",
        "Gym+Fitness", "Auto Maintenance", "Rent + Electricity",
    ],
    "Needs": [
        "Personal Care", "Clothing", "Fuel+Fastag", "Grocery", "Medicine", "Household",
    ],
    "Wants": ["Miscellaneous", "Going Out/Gifts", "Trips", "Food Delivery"],
    "Investments": ["SIPs", "Education Fund", "Vehicle"],
}

# Sections whose money is retained wealth (invested), never shown as spent.
CATEGORY_KINDS: dict[str, str] = {"Investments": "investment"}


def create_structure(db: Session, user: User, sections: list[dict]) -> None:
    """Idempotently create a user's categories + subcategories.

    `sections` is an ordered list of ``{"name", "kind", "items": [str]}``. Shared by
    the seed script (default user) and the onboarding endpoint (new users). Flushes
    but does not commit — the caller owns the transaction.
    """
    for cat_order, section in enumerate(sections):
        cat_name = section["name"]
        kind = section.get("kind", "spending")
        cat = db.scalars(
            select(Category).where(Category.user_id == user.id, Category.name == cat_name)
        ).first()
        if cat is None:
            cat = Category(user_id=user.id, name=cat_name, sort_order=cat_order, kind=kind)
            db.add(cat)
            db.flush()
        elif cat.kind != kind:
            cat.kind = kind
        for sub_order, sub_name in enumerate(section.get("items", [])):
            exists = db.scalars(
                select(Subcategory).where(
                    Subcategory.user_id == user.id,
                    Subcategory.category_id == cat.id,
                    Subcategory.name == sub_name,
                )
            ).first()
            if exists is None:
                db.add(Subcategory(user_id=user.id, category_id=cat.id, name=sub_name, sort_order=sub_order))


def seed() -> None:
    db = SessionLocal()
    try:
        user = db.scalars(select(User).where(User.email == DEFAULT_USER["email"])).first()
        if user is None:
            user = User(**DEFAULT_USER)
            db.add(user)
            db.flush()
            print(f"Created user {user.email} (id={user.id})")

        create_structure(
            db,
            user,
            [
                {"name": name, "kind": CATEGORY_KINDS.get(name, "spending"), "items": subs}
                for name, subs in STRUCTURE.items()
            ],
        )

        # Create the current calendar year as a starting container.
        current_year = date.today().year
        if db.scalars(
            select(BudgetYear).where(BudgetYear.user_id == user.id, BudgetYear.year == current_year)
        ).first() is None:
            db.add(BudgetYear(user_id=user.id, year=current_year))
            print(f"Created budget year {current_year}")

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
