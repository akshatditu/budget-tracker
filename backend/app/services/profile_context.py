"""Lifestyle profile helpers shared by the Build and Revise AI flows.

The profile is collected by the wizard's optional "About your life" step and
stored once per user (see models.UserProfile). Both AI services receive it as a
plain dict of the non-null fields; `profile_prompt_block` renders that dict as
compact prompt lines, emitting only what the user actually shared.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User, UserProfile
from app.schemas import LifestyleProfileIn

_FIELDS = (
    "family_size",
    "dependents",
    "earners",
    "city_tier",
    "short_term_goals",
    "long_term_goals",
    "emergency_fund",
    "other_loans",
    "savings_level",
)

_EMERGENCY_LABELS = {
    "none": "none yet",
    "building": "building one",
    "three_to_six": "3-6 months of expenses",
    "six_plus": "6+ months of expenses",
}
_LOAN_LABELS = {
    "none": "none",
    "small": "small",
    "significant": "significant",
}
_SAVINGS_LABELS = {
    "just_starting": "just starting",
    "some_cushion": "some cushion",
    "comfortable": "comfortable",
}
_CITY_LABELS = {
    "metro": "metro (high)",
    "tier2": "tier-2 city (moderate)",
    "tier3": "tier-3 city / town (lower)",
}


def upsert_profile(db: Session, user: User, data: LifestyleProfileIn) -> UserProfile:
    """Get-or-create the user's profile row and assign the submitted fields.

    Flushes but does not commit — the caller owns the transaction.
    """
    row = db.scalars(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    if row is None:
        row = UserProfile(user_id=user.id)
        db.add(row)
    for field in _FIELDS:
        setattr(row, field, getattr(data, field))
    db.flush()
    return row


def profile_dict(db: Session, user: User) -> dict | None:
    """The user's profile as a dict of non-null fields, or None when absent/empty."""
    row = db.scalars(select(UserProfile).where(UserProfile.user_id == user.id)).first()
    if row is None:
        return None
    out = {f: getattr(row, f) for f in _FIELDS if getattr(row, f) is not None}
    return out or None


def profile_prompt_block(p: dict | None) -> str:
    """Render the profile as compact prompt lines; empty string when nothing to say."""
    if not p:
        return ""
    lines: list[str] = []

    household: list[str] = []
    if p.get("family_size"):
        household.append(f"{p['family_size']} people")
    if p.get("dependents") is not None:
        household.append(f"{p['dependents']} dependents")
    if p.get("earners"):
        household.append(f"{p['earners']} income")
    if household:
        lines.append("- Household: " + ", ".join(household))

    if p.get("city_tier"):
        lines.append(f"- City cost of living: {_CITY_LABELS.get(p['city_tier'], p['city_tier'])}")

    money_bits: list[str] = []
    if p.get("emergency_fund"):
        money_bits.append(
            f"emergency fund: {_EMERGENCY_LABELS.get(p['emergency_fund'], p['emergency_fund'])}"
        )
    if p.get("other_loans"):
        money_bits.append(f"other loans: {_LOAN_LABELS.get(p['other_loans'], p['other_loans'])}")
    if p.get("savings_level"):
        money_bits.append(f"savings: {_SAVINGS_LABELS.get(p['savings_level'], p['savings_level'])}")
    if money_bits:
        lines.append("- " + "; ".join(money_bits).capitalize())

    if p.get("short_term_goals"):
        lines.append(f"- Short-term goals: {p['short_term_goals']}")
    if p.get("long_term_goals"):
        lines.append(f"- Long-term goals: {p['long_term_goals']}")

    if not lines:
        return ""
    return "About them:\n" + "\n".join(lines)
