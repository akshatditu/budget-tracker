---
name: db-migration
description: Create and apply an Alembic database migration after changing SQLAlchemy models. Use when adding/altering tables or columns in backend/app/models, or when asked to make/run a migration or update the DB schema.
---

# Create a database migration

All models live in `backend/app/models/__init__.py`. Alembic is configured in
`backend/alembic/` and `env.py` imports the models so `Base.metadata` is populated.
Run everything from `backend/` with the venv activated (`.\.venv\Scripts\Activate.ps1`
on Windows). Postgres must be up (`docker compose up -d`, port 5433).

## Steps
1. **Edit the model** in `app/models/__init__.py`. Money columns use the `MONEY`
   (`Numeric(14,2)`) alias. New domain tables must include a `user_id` FK
   (`ForeignKey("users.id", ondelete="CASCADE")`, indexed) to stay user-scoped.

2. **Generate the migration:**
   ```bash
   alembic revision --autogenerate -m "short description"
   ```
   `env.py` sets `compare_type=True`, so type changes are detected.

3. **Review the generated file** in `alembic/versions/`. Autogenerate is not perfect —
   check both `upgrade()` and `downgrade()`, add server defaults for non-nullable
   columns on existing tables (see `a1b2c3d4e5f6_category_kind.py` for the
   `server_default="spending"` pattern), and fix anything it missed.

4. **Apply it:**
   ```bash
   alembic upgrade head
   ```

5. **Verify**: `alembic current` should show your new revision. If the change affects
   rollup/carry-forward math or seeded data, also update `app/seed.py` and the relevant
   tests in `tests/`, then run `pytest`.

## Gotchas
- Keep `downgrade()` real — don't leave it as `pass`.
- If autogenerate produces an empty migration, the models and DB are already in sync (or the model isn't imported in `env.py`).
- Never edit a migration that has already been applied in a shared/deployed environment; add a new one instead.
