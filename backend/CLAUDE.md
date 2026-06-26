# Backend — Budget Tracker API

FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL. Serves a JSON API under `/api/*` and,
in production, the built SPA. See the repo `README.md` for the domain model in one line.

## Layout
- `app/main.py` — app factory: session + CORS middleware, router registration, SPA catch-all (kept **after** the API routers so `/api/*` always wins).
- `app/core/` — `config.py` (pydantic-settings, reads `.env`), `database.py` (engine/`SessionLocal`/`Base`/`get_db`), `deps.py` (`get_current_user`, `get_year_or_404`).
- `app/models/__init__.py` — all SQLAlchemy models in one file.
- `app/schemas/__init__.py` — all Pydantic v2 request/response schemas in one file.
- `app/routers/` — one module per resource: `auth`, `years`, `catalog`, `budgets`, `transactions`, `incomes`, `views`.
- `app/services/` — pure aggregation logic: `rollup.py` (month view + annual rollup) and `carryforward.py` (running carry-forward chain). **All the Excel math lives here, not in routers.**
- `app/seed.py` — seeds the default user + 4 sections + sub-items.
- `alembic/` — migrations; `env.py` imports `app.models` so `Base.metadata` is populated.

## Domain model (read `app/models/__init__.py` first)
- `Category` (the 4 sections) → `Subcategory` (sub-items, soft-deleted via `archived`).
- `BudgetYear` scopes everything to a year. `AnnualBudget` = yearly initial per sub-item (split /12). `MonthlyBudget` = per-month `initial_amount` + `revised_amount` (**`revised` is the editable lever**; the annual revised total is the sum of the 12 months).
- `Transaction` = the ledger; **`spent` is always summed from transactions**, never stored.
- `Income`, `MonthlySetting` (per-month `spend_limit` / `opening_carry_forward` / `notes`).

## Conventions — match these
- **Money**: store as `Numeric(14,2)` (`MONEY` alias) to avoid float drift; expose as `float` in schemas. Use `rollup.f(x)` to coerce `Decimal | None → float`.
- **Multi-tenancy**: every domain row carries `user_id`. Auth is single-user today but the schema is already user-scoped — **keep adding `user_id` to new tables and filter every query by the current user**. Resolve the user with `Depends(get_current_user)`; never trust an id from the request body.
- **Year lookups**: use `get_year_or_404(year, db, user)` rather than re-querying `BudgetYear`.
- **Routers stay thin**: validate ownership, mutate, `db.commit()`, return a small dict or schema. Push any non-trivial aggregation into `app/services/`.
- **Get-or-create** pattern for `MonthlyBudget`/`MonthlySetting` rows (see `_get_or_create_monthly` in `routers/budgets.py`) — rows are created lazily on first edit.
- **Investments are retained wealth**: a `Category.kind == "investment"` is excluded from "spent" totals and never drains the carry-forward pool. Preserve this distinction in any new rollup math (`kind != "investment"` vs `== "investment"`).
- **Set-aside / current**: only count *elapsed* months — use `rollup.elapsed_months(year)`. The formulas are documented at the top of `rollup.py`; keep that docstring in sync if you change them.
- Use SQLAlchemy 2.0 style (`select(...)`, `db.scalars(...)`, `Mapped[...]`), not legacy `Query`.

## Auth
Google SSO (OAuth Authorization Code) in `routers/auth.py`. On success the user's email is stored in a signed Starlette session cookie; `get_current_user` reads it each request. Access is gated to `settings.allowed_email_list`. There is no JWT/bearer flow — it's cookie/session based, so the frontend uses `withCredentials`.

## Commands (run from `backend/`)
```bash
# one-time env (Windows PowerShell: .\.venv\Scripts\Activate.ps1)
uv venv && source .venv/bin/activate && uv pip install -e ".[dev]"
cp .env.example .env

alembic upgrade head            # apply migrations
python -m app.seed              # seed default data
uvicorn app.main:app --reload   # http://localhost:8000  (docs at /docs)
pytest                          # tests live in tests/
```
Postgres runs via `docker compose up -d` (host port **5433**; `database_url` defaults to it).

## Migrations
1. Edit models in `app/models/__init__.py`.
2. `alembic revision --autogenerate -m "short description"` (env.py uses `compare_type=True`).
3. Review the generated file in `alembic/versions/` — autogenerate misses some changes; hand-edit as needed.
4. `alembic upgrade head`, then add a `downgrade()`.

## Tests
`pytest` from `backend/`. Tests (`tests/test_rollup.py`, `tests/test_investments.py`) focus on the service-layer math. When you change rollup/carry-forward logic, add or update a service test rather than testing through the router.
