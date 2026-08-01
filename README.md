# BudgetIQ — Budget Tracker

A full-stack personal finance app that replaces a multi-sheet Excel budgeting workflow with
a transaction ledger, automatic monthly and annual rollups, carry-forward math, and
dashboards. Built and deployed end to end: FastAPI + PostgreSQL on the backend, React + Vite
on the front, encrypted at rest, running in production.

**Live app:** [budgetiq.in](https://www.budgetiq.in)

## Why it exists

Spreadsheet budgeting breaks down in two places: reconciling what you *planned* against what
you *actually spent*, and rolling twelve months up into a coherent annual picture. BudgetIQ
models both directly — `Spent` is always derived from the ledger, never typed in, and the
annual view computes **Set Aside** (budgeted but unspent, elapsed months only) + **Spent** =
**Current**.

One design decision shapes the whole domain model: **investments are retained wealth, not
spending.** They're excluded from spent totals and never drain the carry-forward pool, so the
"what's left to spend" number stays honest.

## Features

- **Two-tier budget** — `Bills / Needs / Wants / Investments` → sub-items → per-month
  Initial / Revised / Spent / Remaining, editable inline.
- **Transaction ledger** — every expense recorded; spent totals are summed, never stored.
- **Carry-forward** — unspent budget chains month to month as a running pool.
- **Annual rollup** — twelve months aggregated with elapsed-month-aware set-aside math.
- **AI budget generation** — first-run allocation and "Revise with AI" over spending history,
  with a deterministic rule-based fallback when no API key is configured.
- **Net worth & goals** — asset tracking and goal progress alongside the budget.
- **Reconciliation** — compare planned vs. actual and adjust.
- **Encryption at rest** — all money values are Fernet-encrypted in the database; the key
  lives only in the server environment.
- **Onboarding wizard + guided tour**, four themes (calm/bold × light/dark), and a
  server-rendered SEO fallback for the SPA.

## Architecture

```
React SPA (Vite)  ──/api/*──▶  FastAPI  ──▶  PostgreSQL
     │                            │
  TanStack Query            SQLAlchemy 2.0 + Alembic
  Tailwind v4 / Recharts    Fernet encryption layer
```

- **Single origin in production.** The SPA is built into `backend/app/static/` and served by
  FastAPI, so there's no CORS in prod and all API paths stay relative. In dev, Vite proxies
  `/api` → `:8000`.
- **Cookie/session auth.** Google SSO (OAuth authorization code) → signed Starlette session
  cookie. No JWT/bearer flow.
- **Aggregation lives in services, not routers.** All the rollup and carry-forward math is in
  `backend/app/services/` (`rollup.py`, `carryforward.py`, `envelopes.py`), unit-tested
  independently of HTTP.
- **User-scoped schema.** Every domain row carries `user_id`.

**Stack:** FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL · Pydantic v2 · React · TypeScript ·
Vite · Tailwind CSS v4 · TanStack Query · Recharts · Docker · Render

## Running locally

Order matters: Postgres → backend → frontend.

### 1. Postgres
```bash
docker compose up -d
```
Exposed on host port **5433**.

### 2. Backend
```bash
cd backend
uv venv && source .venv/bin/activate    # Windows: .\.venv\Scripts\Activate.ps1
uv pip install -e .
cp .env.example .env                    # defaults point at localhost:5433
```

Generate an encryption key and add it to `.env` as `ENCRYPTION_KEY` — the app won't import
without one:
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Then:
```bash
alembic upgrade head            # create tables
python -m app.seed              # default user + sections + sub-items
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Google SSO needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from the Google Cloud Console;
see `backend/.env.example` for every supported variable.

## Tests
```bash
cd backend && pytest            # service-layer rollup and investment math
cd frontend && npm run typecheck
```

## Project layout

```
backend/app/
  core/       config, database, auth deps, encryption
  models/     SQLAlchemy models (one file)
  schemas/    Pydantic request/response schemas (one file)
  routers/    one module per resource
  services/   rollup, carry-forward, envelopes, AI budget generation
frontend/src/
  api/        axios instance + TanStack Query hooks
  pages/      Dashboard, MonthView, AnnualRollup, NetWorth, Goals, …
  components/ shared UI + landing page
```

## License

MIT — see [LICENSE](LICENSE).
