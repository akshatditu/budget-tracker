# Frontend — Budget Tracker SPA

React 18 + Vite + TypeScript + Tailwind CSS v4 + TanStack Query + React Router v6 + Recharts.
Talks to the FastAPI backend under `/api` (proxied to `:8000` in dev — see `vite.config.ts`).

## Layout
- `src/main.tsx` — root render: `QueryClientProvider` + `BrowserRouter`.
- `src/App.tsx` — auth gate (renders `<Login>` until `useAuth()` resolves a user) then `<Layout>` + routes.
- `src/lib/api.ts` — the single axios instance (`baseURL: "/api"`, `withCredentials: true`). A response interceptor broadcasts `auth:unauthorized` on any 401 so the app flips to the login screen.
- `src/lib/auth.tsx` — `useAuth()` (probes `/auth/me`), `useAuthExpiryListener()`, `logout()`.
- `src/lib/AppContext.tsx` — global `year` / `month` selection, persisted to `localStorage` (`bt.year` / `bt.month`). Read it via `useApp()`.
- `src/api/hooks.ts` — **all** TanStack Query hooks (queries + mutations) for the API. This is the data layer.
- `src/types/api.ts` — TypeScript types mirroring the backend JSON contract.
- `src/components/` — `Layout.tsx` (nav shell) and `ui.tsx` (shared primitives).
- `src/pages/` — one component per route: `Dashboard`, `MonthView`, `AnnualRollup`, `BudgetSetup`, `Transactions`, `Income`, `Settings`, `Login`.
- `src/lib/format.ts` — money/number formatting helpers.

## Conventions — match these
- **Never call `api` (axios) directly from a component.** Add a hook to `src/api/hooks.ts` and use it. Queries use `get<T>(url, params)`; mutations call `api.post/patch/put/delete` and invalidate on success.
- **Query keys are `[resource, year, ...]`.** Mutations invalidate the affected keys (e.g. a transaction edit invalidates `transactions`, `month`, `rollup`, `dashboard` for that year). When you add a mutation that changes derived numbers, **invalidate every view that recomputes from it** — follow the `done()` helpers already in the file.
- **`year` and `month` come from `useApp()`**, not component state. Most data hooks take `year` and are `enabled: !!year`.
- **Auth is cookie-based** — every request must go through the shared `api` instance so `withCredentials` sends the session cookie. Don't create new axios instances.
- **Types mirror the backend.** When a backend schema/response changes, update `src/types/api.ts` to match. Money fields are plain `number`.
- **Tailwind v4** (configured via the `@tailwindcss/vite` plugin and `src/index.css` — no `tailwind.config.js`). Style with utility classes; reuse primitives from `components/ui.tsx`. Semantic tokens like `text-muted` are defined in `index.css`.
- Charts use **Recharts**; icons use **lucide-react**.

## Commands (run from `frontend/`)
```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api -> :8000) — backend must be running
npm run build      # tsc (typecheck) + vite build
npm run typecheck  # tsc --noEmit, no build
```
There is no separate lint/test setup — `npm run typecheck` is the gate. **Run it after non-trivial changes.**

## Working with the backend
The dev server only proxies `/api`; the backend (`uvicorn`) must be running on `:8000` and Postgres on `:5433`. In production the SPA is built into `backend/app/static/` and served same-origin by FastAPI, so there is no CORS in prod — keep all API paths relative (`/api/...`).

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