"""First-run budget allocation. Given monthly income, already-committed fixed bills,
and the discretionary buckets the user picked, produce a monthly amount per bucket.

`generate_allocation` asks OpenAI (gpt-4o-mini, Structured Outputs) to act as a finance
expert. It never raises — on a missing key, network error, or bad response it returns
None so the caller can fall back to `rule_based_allocation`, a deterministic split.
"""
from __future__ import annotations

import json
import logging

import httpx

from app.core.config import settings

log = logging.getLogger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = (
    "You are a prudent personal-finance expert helping someone set up a monthly budget. "
    "You are given their monthly income, the fixed bills they have already committed to "
    "(rent, EMIs — these are fixed and NOT yours to change), and a list of discretionary "
    "buckets to fund (everyday needs, lifestyle wants, and investments). Allocate the "
    "income that REMAINS after fixed bills across the buckets as realistic monthly amounts. "
    "Investments are savings the person keeps, not spending — fund them meaningfully (aim "
    "for roughly 15-25% of income when possible). Keep needs ahead of wants. The amounts you "
    "return should not exceed the remaining income. Return only the requested JSON object: a "
    "number (in the user's currency, no symbols) for every bucket name."
)


def _discretionary_schema(names: list[str]) -> dict:
    """Strict JSON schema: one numeric property per bucket name."""
    return {
        "type": "object",
        "properties": {name: {"type": "number"} for name in names},
        "required": names,
        "additionalProperties": False,
    }


def generate_allocation(
    *,
    currency: str,
    employment_type: str | None,
    monthly_income: float,
    fixed_total: float,
    discretionary: list[dict],
) -> dict[str, float] | None:
    """Return ``{bucket_name: monthly_amount}`` for the discretionary buckets, or None
    to signal the caller should fall back. ``discretionary`` items are
    ``{"name", "kind", "section"}``."""
    if not discretionary:
        return {}
    if not settings.openai_api_key or not monthly_income or monthly_income <= 0:
        return None

    names = [d["name"] for d in discretionary]
    remaining = round(max(monthly_income - fixed_total, 0.0), 2)
    buckets = [f'- "{d["name"]}" ({d["section"]}, {d["kind"]})' for d in discretionary]
    user_prompt = (
        f"Currency: {currency}\n"
        f"Employment: {employment_type or 'unspecified'}\n"
        f"Monthly income: {round(monthly_income, 2)}\n"
        f"Fixed bills already committed (total): {round(fixed_total, 2)}\n"
        f"Income remaining to allocate: {remaining}\n\n"
        "Allocate the remaining income across these buckets (return a monthly amount for each):\n"
        + "\n".join(buckets)
    )

    body = {
        "model": MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "budget_allocation",
                "strict": True,
                "schema": _discretionary_schema(names),
            },
        },
    }

    try:
        resp = httpx.post(
            OPENAI_URL,
            json=body,
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            timeout=15.0,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except Exception:  # network / API / parse — fall back, never break onboarding
        log.warning("AI budget allocation failed; using rule-based fallback", exc_info=True)
        return None

    # Keep only the real buckets, coerce to non-negative floats.
    out: dict[str, float] = {}
    for name in names:
        try:
            out[name] = round(max(float(parsed[name]), 0.0), 2)
        except (KeyError, TypeError, ValueError):
            out[name] = 0.0
    return out


def rule_based_allocation(
    *, monthly_income: float, fixed_total: float, discretionary: list[dict]
) -> dict[str, float]:
    """Deterministic fallback: spread the income remaining after fixed bills across the
    discretionary buckets by section weight (needs-like 0.5, wants 0.3, investments 0.2),
    renormalised over the sections actually present, then split evenly within each section.
    Total never exceeds the remaining income."""
    if not discretionary:
        return {}
    disposable = max((monthly_income or 0.0) - fixed_total, 0.0)

    def base_weight(item: dict) -> float:
        if item["kind"] == "investment":
            return 0.2
        return 0.3 if item["section"].strip().lower() == "wants" else 0.5

    # Group items per section, remembering that section's base weight.
    groups: dict[str, list[str]] = {}
    weights: dict[str, float] = {}
    for d in discretionary:
        sec = d["section"]
        groups.setdefault(sec, []).append(d["name"])
        weights[sec] = base_weight(d)

    total_weight = sum(weights.values()) or 1.0
    out: dict[str, float] = {}
    for sec, items in groups.items():
        section_budget = disposable * (weights[sec] / total_weight)
        per_item = round(section_budget / len(items), 2) if items else 0.0
        for name in items:
            out[name] = max(per_item, 0.0)
    return out
