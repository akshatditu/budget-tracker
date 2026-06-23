# Budget Tracker

A two-tier personal budget tracker that replaces a multi-sheet Excel workflow with
inline editing, a transaction ledger, automatic monthly/annual rollups, and dashboards.

- **Backend**: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS + lucide-react + TanStack Query + Recharts

## Model in one line

`Bills / Needs / Wants / Investments` → sub-items → per-month **Initial / Revised /
Spent / Remaining**, where Spent is summed from a transaction ledger, and the year
rolls up **Set Aside** (budgeted-but-unspent) + **Spent** = **Current**.

## Quick start

### 1. Start Postgres
```bash
docker compose up -d
```
(Postgres is exposed on host port **5433**.)

### 2. Backend
```bash
cd backend
uv venv && source .venv/bin/activate
uv pip install -e .
cp .env.example .env            # defaults already point at localhost:5433
alembic upgrade head            # create tables
python -m app.seed              # default user + sections + sub-items
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173  (proxies /api -> :8000)
```

## Tests
```bash
cd backend && pytest
```

## Project layout
See `backend/app/` (core, models, schemas, routers, services) and `frontend/src/`
(api, components, pages). Phase-2 items (JWT auth UI, net-worth tracker, Excel import)
are intentionally out of scope; the schema is already `user_id`-scoped for auth.
