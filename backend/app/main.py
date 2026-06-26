import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.routers import (
    auth,
    budgets,
    catalog,
    goals,
    incomes,
    onboarding,
    reconciliation,
    transactions,
    views,
    years,
)

app = FastAPI(title="Budget Tracker API", version="0.1.0")

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    https_only=settings.public_base_url.startswith("https"),
    same_site="lax",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(years.router)
app.include_router(catalog.router)
app.include_router(budgets.router)
app.include_router(transactions.router)
app.include_router(incomes.router)
app.include_router(goals.router)
app.include_router(reconciliation.router)
app.include_router(views.router)


# Serve the built SPA same-origin (only when a production build is present, so
# local dev with the Vite server is unaffected). Keep this AFTER the API routers
# so /api/* always wins; the catch-all only handles non-API paths.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
