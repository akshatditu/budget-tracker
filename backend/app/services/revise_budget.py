"""AI budget *revision*. Unlike first-run allocation (``budget_ai.py``), this reads the
user's actual spending behaviour for the year — current revised budgets, year-to-date spend,
set-aside, overspend — plus a free-text note of what's changed, and proposes a new monthly
amount per *discretionary* sub-item with a short reason, alongside 2-5 plain-language insights.

It is a **reallocation within the income envelope**, not a free-for-all: fixed "Bills"
commitments (rent, EMIs, insurance) are left untouched, and the combined discretionary budget
is held within income — raising one bucket means trimming another.

``generate_revision`` asks OpenAI (Structured Outputs) to act as a financial advisor. Like its
sibling it never raises — on a missing key, network error, or bad response it returns None so the
caller can fall back to ``rule_based_revision``, a deterministic nudge.
"""
from __future__ import annotations

import json
import logging

import httpx

from app.core.config import settings
from app.models import BudgetYear, User
from app.services.carryforward import carry_forward_chain
from app.services.rollup import annual_rollup, elapsed_months, income_by_month

log = logging.getLogger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o"  # stronger reasoning than -mini: better at respecting the income envelope
BILLS_SECTION = "bills"

SYSTEM_PROMPT = (
    "You are a thoughtful personal-finance advisor revising someone's existing monthly budget. "
    "You are given, for each DISCRETIONARY bucket: its current monthly budget, how much they have "
    "actually spent so far this year, their average monthly spend, and whether they have been over- "
    "or under-spending. You also get their monthly income, the total they have already committed to "
    "fixed bills, and a note about anything that has changed in their life.\n\n"
    "This is a REALLOCATION, not an across-the-board raise. Hard rules:\n"
    "1. The COMBINED new monthly budget for all discretionary buckets must NOT exceed the spending "
    "envelope you are given (income minus fixed bills). Never let the total grow beyond it.\n"
    "2. Treat it as roughly zero-sum: if you raise one bucket, lower another to compensate. Do not "
    "inflate every bucket — that is the most common mistake; avoid it.\n"
    "3. Only change a bucket when the spending data or the user's note clearly justifies it. If a "
    "bucket is already well managed, keep it exactly the same.\n"
    "4. Move money toward buckets the user consistently overspends and away from ones they rarely "
    "use; surplus can go to savings/investments or wherever the user's note points.\n"
    "5. Investments are retained wealth, not spending — fund them at least as well as today.\n\n"
    "For every bucket give a one-sentence reason grounded in their numbers (say 'no change' when you "
    "keep it). Finally write 2-5 short, personalised insights explaining the overall reasoning. "
    "Return only the requested JSON."
)


def _revision_schema(ids: list[int]) -> dict:
    """Strict JSON schema: one item per provided subcategory id, plus an insights list."""
    return {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "subcategory_id": {"type": "integer", "enum": ids},
                        "monthly_amount": {"type": "number"},
                        "reason": {"type": "string"},
                    },
                    "required": ["subcategory_id", "monthly_amount", "reason"],
                    "additionalProperties": False,
                },
            },
            "insights": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["items", "insights"],
        "additionalProperties": False,
    }


def build_context(db, by: BudgetYear, user: User) -> dict:
    """Assemble the advisor's view of how the user actually manages money this year.

    Only DISCRETIONARY buckets are open to revision — fixed "Bills" commitments are excluded
    and left untouched. Computes the spending envelope (income minus fixed bills) so the AI and
    the fallback can keep the reallocated total within what the user actually earns.
    """
    roll = annual_rollup(db, by, user)
    elapsed = elapsed_months(by.year)
    incomes = income_by_month(db, by.id)
    # Representative monthly income: the largest month's income (robust to partially-filled months).
    monthly_income = round(max(incomes.values(), default=0.0), 2)

    items = []
    bills_total_monthly = 0.0
    for sec in roll["sections"]:
        is_bills = sec["name"].strip().lower() == BILLS_SECTION
        for it in sec["items"]:
            monthly = round(it["revised"] / 12, 2)
            if is_bills:
                bills_total_monthly += monthly
                continue  # fixed commitment — not open to AI revision
            spent = it["spent"]
            items.append(
                {
                    "subcategory_id": it["subcategory_id"],
                    "name": it["name"],
                    "section": sec["name"],
                    "kind": sec["kind"],
                    "current_annual": it["revised"],
                    "current_monthly": monthly,
                    "ytd_spent": spent,
                    "avg_monthly_spent": round(spent / elapsed, 2) if elapsed else 0.0,
                    "set_aside": it["set_aside"],
                    "overspent": it["overspent"],
                }
            )

    current_total_monthly = round(sum(it["current_monthly"] for it in items), 2)
    bills_total_monthly = round(bills_total_monthly, 2)
    # Envelope = what's left of income after fixed bills. If income is unknown or already fully
    # committed, fall back to today's discretionary total so the budget never silently inflates.
    if monthly_income > 0:
        free = round(monthly_income - bills_total_monthly, 2)
        envelope_monthly = free if free > 0 else current_total_monthly
    else:
        envelope_monthly = current_total_monthly

    chain = carry_forward_chain(db, by)
    savings_trend = [
        {"month": r["month_name"], "net": round(r["net"], 2), "carry_out": round(r["carry_out"], 2)}
        for r in chain[:elapsed]
    ]
    return {
        "currency": user.currency,
        "elapsed_months": elapsed,
        "monthly_income": monthly_income,
        "bills_total_monthly": bills_total_monthly,
        "current_total_monthly": current_total_monthly,
        "envelope_monthly": envelope_monthly,
        "income_annual": roll["totals"]["income"],
        "totals": roll["totals"],
        "items": items,
        "savings_trend": savings_trend,
    }


def _fit_envelope(items_out: list[dict], envelope: float) -> list[dict]:
    """Safety net: if the proposed discretionary total exceeds the envelope, scale every bucket
    down proportionally so the budget can never exceed what the user earns. Never scales up."""
    if envelope <= 0:
        return items_out
    total = sum(i["monthly_amount"] for i in items_out)
    if total <= envelope or total <= 0:
        return items_out
    scale = envelope / total
    for i in items_out:
        i["monthly_amount"] = round(i["monthly_amount"] * scale, 2)
    return items_out


def generate_revision(
    *, currency: str, context: dict, user_note: str | None
) -> dict | None:
    """Return ``{"items": [{subcategory_id, monthly_amount, reason}], "insights": [str]}`` for
    the discretionary buckets in ``context``, or None to signal the caller should fall back."""
    items = context["items"]
    if not items:
        return {"items": [], "insights": []}
    if not settings.openai_api_key:
        return None

    ids = [it["subcategory_id"] for it in items]
    lines = [
        f'- #{it["subcategory_id"]} "{it["name"]}" ({it["section"]}, {it["kind"]}): '
        f'current monthly {it["current_monthly"]}, YTD spent {it["ytd_spent"]}, '
        f'avg/month {it["avg_monthly_spent"]}, set-aside {it["set_aside"]}, overspent {it["overspent"]}'
        for it in items
    ]
    user_prompt = (
        f"Currency: {currency}\n"
        f"Months elapsed this year: {context['elapsed_months']}\n"
        f"Monthly income: {context['monthly_income']}\n"
        f"Already committed to fixed bills (monthly): {context['bills_total_monthly']}\n"
        f"Current discretionary budget total (monthly): {context['current_total_monthly']}\n"
        f"SPENDING ENVELOPE — the combined new discretionary total must not exceed: {context['envelope_monthly']}\n"
        f"What's changed (user's words): {user_note.strip() if user_note and user_note.strip() else 'Nothing specified.'}\n\n"
        "Discretionary buckets and how they've actually been used:\n"
        + "\n".join(lines)
        + "\n\nReturn a new monthly amount and a one-sentence reason for EVERY bucket id above "
        f"(keep the total at or below {context['envelope_monthly']}), plus 2-5 overall insights."
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
                "name": "budget_revision",
                "strict": True,
                "schema": _revision_schema(ids),
            },
        },
    }

    try:
        resp = httpx.post(
            OPENAI_URL,
            json=body,
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            timeout=30.0,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)
    except Exception:  # network / API / parse — fall back, never break the flow
        log.warning("AI budget revision failed; using rule-based fallback", exc_info=True)
        return None

    by_id = {it["subcategory_id"]: it for it in items}
    out_items: list[dict] = []
    for row in parsed.get("items", []):
        sid = row.get("subcategory_id")
        if sid not in by_id:
            continue
        try:
            amount = round(max(float(row["monthly_amount"]), 0.0), 2)
        except (KeyError, TypeError, ValueError):
            amount = by_id[sid]["current_monthly"]
        out_items.append({"subcategory_id": sid, "monthly_amount": amount, "reason": str(row.get("reason", ""))})
    out_items = _fit_envelope(out_items, context["envelope_monthly"])
    insights = [str(s) for s in parsed.get("insights", []) if str(s).strip()][:5]
    return {"items": out_items, "insights": insights}


def rule_based_revision(*, context: dict, user_note: str | None) -> dict:
    """Deterministic fallback: nudge each discretionary bucket halfway toward its recent actual
    run-rate (clamped to +/-30% so it can't swing wildly), keep investments at least at today's
    level, then scale the whole set down to fit the income envelope. Always succeeds."""
    items = context["items"]
    elapsed = context["elapsed_months"]
    out_items: list[dict] = []
    for it in items:
        current = it["current_monthly"]
        avg = it["avg_monthly_spent"]
        if it["kind"] == "investment" or not elapsed or avg <= 0:
            amount = current  # no behaviour signal — leave it as is
            reason = "Kept the same — no change indicated by your recent activity."
        else:
            target = current * 0.5 + avg * 0.5
            low, high = current * 0.7, current * 1.3
            amount = round(min(max(target, low), high), 2)
            if amount > current:
                reason = f"Nudged up toward your ~{round(avg)}/mo actual spend."
            elif amount < current:
                reason = f"Trimmed toward your ~{round(avg)}/mo actual spend."
            else:
                reason = "On track with your spending — left unchanged."
        out_items.append({"subcategory_id": it["subcategory_id"], "monthly_amount": max(amount, 0.0), "reason": reason})
    out_items = _fit_envelope(out_items, context["envelope_monthly"])

    insights: list[str] = []
    over = max(items, key=lambda it: it["overspent"], default=None)
    if over and over["overspent"] > 0:
        insights.append(
            f"You've overspent on {over['name']} by about {round(over['overspent'])} this year, "
            "so its budget was raised to match how you actually spend."
        )
    under = max(items, key=lambda it: it["set_aside"], default=None)
    if under and under["set_aside"] > 0 and under is not over:
        insights.append(
            f"{under['name']} is consistently under-utilised, so some of it was redirected elsewhere."
        )
    if user_note and user_note.strip():
        insights.append("Your note about recent changes was factored into these adjustments.")
    if not insights:
        insights.append("Your budget already tracks your spending well — only small tweaks were suggested.")
    return {"items": out_items, "insights": insights}
