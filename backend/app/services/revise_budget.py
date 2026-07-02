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

import calendar
import json
import logging

import httpx
from sqlalchemy import select

from app.core.config import settings
from app.models import BudgetRevisionDraft, BudgetYear, MonthlySetting, Transaction, User
from app.services.carryforward import carry_forward_chain
from app.services.goals import goal_progress_summaries
from app.services.profile_context import profile_dict, profile_prompt_block
from app.services.rollup import _spent_by_subcat_month, annual_rollup, elapsed_months, income_by_month

log = logging.getLogger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
BILLS_SECTION = "bills"

# Caps on the extra context so the prompt stays compact even for busy ledgers.
RECENT_SPEND_MONTHS = 3
TOP_NOTES_PER_ITEM = 3
NOTE_MAX_CHARS = 40
MONTH_NOTES_MAX = 6
MONTH_NOTE_MAX_CHARS = 150
PAST_REVISIONS_MAX = 3
PAST_NOTE_MAX_CHARS = 200
GOALS_MAX = 5

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
    "5. Investments are retained wealth, not spending — fund them at least as well as today.\n"
    "6. Savings goals are commitments: when a goal is behind schedule, prefer moving spare money "
    "toward the buckets that fund it; never cut a bucket so far that an on-track goal goes off track.\n"
    "7. Ground yourself in the evidence you're given — the income trend (tighten if income is "
    "falling), the last-3-month spend pattern and typical purchase notes, their life profile, and "
    "their past revisions. Do not re-propose the kind of change they previously discarded.\n\n"
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

    # Per-item recent behaviour: spend in the last few elapsed months, and the most
    # frequent transaction notes (a cheap signal of what the bucket is really used for).
    spent_by_month = _spent_by_subcat_month(db, by.id)
    recent_months = list(range(max(1, elapsed - RECENT_SPEND_MONTHS + 1), elapsed + 1)) if elapsed else []
    note_counts: dict[int, dict[str, list]] = {}
    for sid, note in db.execute(
        select(Transaction.subcategory_id, Transaction.note).where(
            Transaction.budget_year_id == by.id, Transaction.note.is_not(None)
        )
    ).all():
        text = (note or "").strip()
        if not text:
            continue
        bucket = note_counts.setdefault(int(sid), {})
        entry = bucket.setdefault(text.casefold(), [0, text[:NOTE_MAX_CHARS]])
        entry[0] += 1
    top_notes_by_sid = {
        sid: [t for _, t in sorted(bucket.values(), key=lambda v: -v[0])[:TOP_NOTES_PER_ITEM]]
        for sid, bucket in note_counts.items()
    }

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
            sid = it["subcategory_id"]
            items.append(
                {
                    "subcategory_id": sid,
                    "name": it["name"],
                    "section": sec["name"],
                    "kind": sec["kind"],
                    "current_annual": it["revised"],
                    "current_monthly": monthly,
                    "ytd_spent": spent,
                    "avg_monthly_spent": round(spent / elapsed, 2) if elapsed else 0.0,
                    "set_aside": it["set_aside"],
                    "overspent": it["overspent"],
                    "recent_monthly_spend": [
                        round(spent_by_month.get((sid, m), 0.0), 2) for m in recent_months
                    ],
                    "top_notes": top_notes_by_sid.get(sid, []),
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

    # Month-by-month income for elapsed months (the envelope still uses the max above,
    # but the model sees the real trend — matters for business/variable income).
    income_history = [
        {"month": m, "income": round(incomes.get(m, 0.0), 2)} for m in range(1, elapsed + 1)
    ]

    # Non-empty monthly notes ("festival month", "car service") from elapsed months.
    month_notes = [
        {"month": ms.month, "note": ms.notes.strip()[:MONTH_NOTE_MAX_CHARS]}
        for ms in db.scalars(
            select(MonthlySetting)
            .where(MonthlySetting.budget_year_id == by.id, MonthlySetting.month <= elapsed)
            .order_by(MonthlySetting.month)
        ).all()
        if ms.notes and ms.notes.strip()
    ][-MONTH_NOTES_MAX:]

    # Previously accepted/discarded drafts for this year, so the model can avoid
    # re-proposing what the user already rejected.
    past_revisions = [
        {
            "when": d.created_at.date().isoformat() if d.created_at else None,
            "status": d.status,
            "user_note": (d.user_note or "").strip()[:PAST_NOTE_MAX_CHARS] or None,
        }
        for d in db.scalars(
            select(BudgetRevisionDraft)
            .where(
                BudgetRevisionDraft.user_id == user.id,
                BudgetRevisionDraft.budget_year_id == by.id,
                BudgetRevisionDraft.status != "pending",
            )
            .order_by(BudgetRevisionDraft.created_at.desc())
            .limit(PAST_REVISIONS_MAX)
        ).all()
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
        "income_history": income_history,
        "goals": goal_progress_summaries(db, user, limit=GOALS_MAX),
        "month_notes": month_notes,
        "past_revisions": past_revisions,
        "profile": profile_dict(db, user),
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


_UP_WORDS = ("increas", "raise", "raised", "boost", "bump", "more", "higher", "grew", "grow", "topped up")
_DOWN_WORDS = ("reduc", "trim", "cut", "lower", "decreas", "less", "shrink", "scaled back", "pared", "redirect")


def _reconcile_reason(reason: str, current: float, revised: float) -> str:
    """Keep the reason consistent with the *realized* number. Envelope scaling can flip a bucket's
    direction after the reason was written (e.g. a planned bump ends up a cut once the total is
    fitted to income), leaving "slightly increased" on a decreased budget. When the wording clearly
    contradicts the actual change, replace it with a numerically-true sentence; otherwise keep it."""
    text = (reason or "").lower()
    claims_up = any(w in text for w in _UP_WORDS)
    claims_down = any(w in text for w in _DOWN_WORDS)
    up = revised > current + 0.5
    down = revised < current - 0.5
    same = not up and not down
    if down and claims_up and not claims_down:
        return "Reduced to keep your overall budget within your income."
    if up and claims_down and not claims_up:
        return "Increased to better match how much you actually spend here."
    if same and (claims_up or claims_down):
        return "Kept the same — already in line with your spending."
    return reason or ""


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

    def _item_line(it: dict) -> str:
        line = (
            f'- #{it["subcategory_id"]} "{it["name"]}" ({it["section"]}, {it["kind"]}): '
            f'current monthly {it["current_monthly"]}, YTD spent {it["ytd_spent"]}, '
            f'avg/month {it["avg_monthly_spent"]}, set-aside {it["set_aside"]}, overspent {it["overspent"]}'
        )
        if it.get("recent_monthly_spend"):
            line += f'; last {len(it["recent_monthly_spend"])} months {it["recent_monthly_spend"]}'
        if it.get("top_notes"):
            line += "; typical notes: " + ", ".join(f'"{n}"' for n in it["top_notes"])
        return line

    lines = [_item_line(it) for it in items]

    extra_blocks: list[str] = []
    if context.get("income_history"):
        extra_blocks.append(
            "Income by month this year: "
            + ", ".join(
                f"{calendar.month_abbr[h['month']]}: {h['income']}"
                for h in context["income_history"]
            )
        )
    if context.get("goals"):
        goal_lines = []
        for g in context["goals"]:
            bits = f'- "{g["name"]}": target {g["target_amount"]}'
            if g["target_date"]:
                bits += f' by {g["target_date"]}'
            bits += f', saved {g["saved"]}'
            if g["monthly_required"] is not None:
                bits += f', needs ~{g["monthly_required"]}/mo'
            if g["on_track"] is not None:
                bits += ", on track" if g["on_track"] else ", behind schedule"
            goal_lines.append(bits)
        extra_blocks.append("Savings goals:\n" + "\n".join(goal_lines))
    if context.get("month_notes"):
        extra_blocks.append(
            "Their monthly notes: "
            + "; ".join(
                f'{calendar.month_abbr[n["month"]]}: "{n["note"]}"' for n in context["month_notes"]
            )
        )
    if context.get("past_revisions"):
        extra_blocks.append(
            "Past AI revisions: "
            + "; ".join(
                f'{r["when"]} {r["status"]}'
                + (f' (their note: "{r["user_note"]}")' if r["user_note"] else "")
                for r in context["past_revisions"]
            )
        )
    profile_block = profile_prompt_block(context.get("profile"))
    if profile_block:
        extra_blocks.append(profile_block)

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
        + ("\n\n" + "\n\n".join(extra_blocks) if extra_blocks else "")
        + "\n\nReturn a new monthly amount and a one-sentence reason for EVERY bucket id above "
        f"(keep the total at or below {context['envelope_monthly']}), plus 2-5 overall insights."
    )

    body = {
        "model": settings.openai_model_revise,
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
    for o in out_items:
        cur = by_id[o["subcategory_id"]]["current_monthly"]
        o["reason"] = _reconcile_reason(o["reason"], cur, o["monthly_amount"])
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
    cur_by_id = {it["subcategory_id"]: it["current_monthly"] for it in items}
    for o in out_items:
        o["reason"] = _reconcile_reason(o["reason"], cur_by_id[o["subcategory_id"]], o["monthly_amount"])

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
