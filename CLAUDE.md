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
