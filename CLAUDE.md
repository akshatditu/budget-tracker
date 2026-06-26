# Budget Tracker

A two-tier personal budget tracker that replaces a multi-sheet Excel workflow with inline
editing, a transaction ledger, automatic monthly/annual rollups, and dashboards. See
`README.md` for setup and the domain model in one line.

- **Backend** (`backend/`): FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL. See [backend/CLAUDE.md](backend/CLAUDE.md).
- **Frontend** (`frontend/`): React + Vite + Tailwind v4 + TanStack Query + Recharts. See [frontend/CLAUDE.md](frontend/CLAUDE.md).

When working inside `backend/` or `frontend/`, read that directory's `CLAUDE.md` first — it
holds the conventions that matter most. This file covers what spans both tiers.

## The mental model
`Bills / Needs / Wants / Investments` (sections) → sub-items → per-month
**Initial / Revised / Spent / Remaining**. `Spent` is always summed from the transaction
ledger (never stored). The year rolls up **Set Aside** (budgeted-but-unspent, elapsed
months only) + **Spent** = **Current**. **Investments are retained wealth** — excluded from
"spent" totals and they don't drain the carry-forward pool. This distinction
(`kind != "investment"` vs `== "investment"`) must be preserved on both sides.

## The contract between tiers
- The frontend talks to the backend **only** under `/api/*`. In dev, Vite proxies `/api` →
  `:8000` (`frontend/vite.config.ts`). In prod the SPA is built into `backend/app/static/`
  and served same-origin by FastAPI — so there is **no CORS in prod; keep all API paths relative**.
- **Auth is cookie/session based** (Google SSO → signed Starlette session cookie). The
  frontend must send credentials via the shared axios instance (`withCredentials`). There
  is no JWT/bearer flow.
- **When you change the API shape, update both ends in the same change**: backend
  `schemas/__init__.py` ⟷ frontend `types/api.ts`, and add/adjust the hook in
  `frontend/src/api/hooks.ts`. The `add-api-endpoint` skill walks the full path.
- **Multi-tenancy**: every domain row carries `user_id`. Single-user today, but keep new
  tables and queries user-scoped.

## Running locally (order matters)
Postgres → backend → frontend. Use the **dev-up** skill, or:
```bash
docker compose up -d                              # Postgres on :5433
cd backend  && alembic upgrade head && uvicorn app.main:app --reload   # :8000
cd frontend && npm run dev                        # :5173
```

## Skills (in `.claude/skills/`)
- **dev-up** — start the full stack with health checks.
- **db-migration** — model edit → autogenerate → review → upgrade.
- **add-api-endpoint** — add a route end-to-end across both tiers.

## Verify before done
- Backend: `pytest` (from `backend/`) — add a service test when you touch rollup/carry-forward math.
- Frontend: `npm run typecheck` (from `frontend/`).
- Behavior: bring the stack up and confirm in the browser with the `preview_*` tools.

## Environment notes
- Windows host; use the PowerShell tool for shell commands. Activate the backend venv with `.\.venv\Scripts\Activate.ps1`.
- Secrets/config live in `backend/.env` (`.env.example` has working local defaults). Deploy config is in `render.yaml` / `Dockerfile` / `docker-compose.yml`.


Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.