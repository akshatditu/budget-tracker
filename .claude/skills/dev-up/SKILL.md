---
name: dev-up
description: Start the full Budget Tracker dev stack (Postgres + FastAPI backend + Vite frontend). Use when asked to run, start, boot, or spin up the app / dev servers locally.
---

# Start the dev stack

Bring up the three tiers in order. Each long-running server should be launched in the
background; verify it is healthy before moving on.

## 1. Postgres (Docker)
From the repo root:
```bash
docker compose up -d
```
Postgres listens on host port **5433**. The backend's default `database_url` already points here.
Wait until it accepts connections before running migrations.

## 2. Backend (FastAPI)
From `backend/`:
```bash
# first run only:
uv venv && source .venv/bin/activate && uv pip install -e ".[dev]"
cp .env.example .env
# Windows PowerShell activation instead: .\.venv\Scripts\Activate.ps1

alembic upgrade head        # apply migrations
python -m app.seed          # seed default user + sections + sub-items (idempotent-ish; skip if data exists)
uvicorn app.main:app --reload   # serves http://localhost:8000, docs at /docs
```
Health check: `GET http://localhost:8000/api/health` should return `{"status":"ok"}`.

## 3. Frontend (Vite)
From `frontend/`:
```bash
npm install        # first run only
npm run dev        # http://localhost:5173, proxies /api -> :8000
```

## Notes
- Order matters: Postgres → backend → frontend. The frontend proxies `/api` to the backend, which needs the DB.
- On Windows use the PowerShell tool for these commands; activate the venv with `.\.venv\Scripts\Activate.ps1`.
- Auth is Google SSO gated to `allowed_emails` in `.env`. For local work the seeded user owns all data; you can hit the API via `/docs` once a session cookie exists.
- To confirm the change you were asked about actually works in the browser, prefer the `preview_*` tools after the servers are up.
