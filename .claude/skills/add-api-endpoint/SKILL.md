---
name: add-api-endpoint
description: Add a new API endpoint end-to-end across the FastAPI backend and React frontend (router + schema + service + query hook + types). Use when asked to add, expose, or wire up a new API route, resource, or data field through the stack.
---

# Add an API endpoint end-to-end

This stack keeps a clear contract: the backend exposes JSON under `/api/*`, and the
frontend consumes it only through TanStack Query hooks. Touch every layer below so the
two stay in sync.

## Backend (`backend/app/`)
1. **Schema** — add request/response models to `schemas/__init__.py` (Pydantic v2,
   `from_attributes=True` via `ORMModel` for response types). Money fields are `float`.
2. **Model** — if it needs storage, add/extend a model in `models/__init__.py`
   (carry `user_id`, use the `MONEY` alias for money) and create a migration
   (see the `db-migration` skill).
3. **Service** — put any aggregation/derived math in `services/` (`rollup.py` /
   `carryforward.py`), not in the router. Reuse `f()`, `elapsed_months()`, and the
   `kind != "investment"` distinction.
4. **Router** — add the route to the right module in `routers/` (or create one and
   register it in `main.py` after the existing routers). Use
   `Depends(get_current_user)` and `get_year_or_404(...)`; filter every query by the
   current user; `db.commit()` and return a schema or small dict. Year-scoped routes
   use the `prefix="/api/years/{year}"` pattern.

## Frontend (`frontend/src/`)
5. **Types** — mirror the new JSON shape in `types/api.ts`.
6. **Hook** — add a query or mutation to `api/hooks.ts`. Queries: `get<T>(url, params)`
   with key `[resource, year, ...]` and `enabled: !!year`. Mutations: call
   `api.post/patch/put/delete` and, in `onSuccess`, **invalidate every view that
   recomputes from this data** (commonly `month`, `rollup`, `dashboard`, plus the
   resource's own key) — follow the existing `done()` helpers.
7. **UI** — consume the hook in the relevant `pages/` component. Get `year`/`month`
   from `useApp()`. Reuse primitives in `components/ui.tsx` and format money via
   `lib/format.ts`. Never call the axios `api` directly from a component.

## Verify
- Backend: `pytest` (add a service test if you changed math). Hit the route in `/docs`.
- Frontend: `npm run typecheck`. Then exercise it in the browser with the `preview_*`
  tools (start the stack via the `dev-up` skill first).
