from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import budgets, catalog, incomes, transactions, views, years

app = FastAPI(title="Budget Tracker API", version="0.1.0")

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


app.include_router(years.router)
app.include_router(catalog.router)
app.include_router(budgets.router)
app.include_router(transactions.router)
app.include_router(incomes.router)
app.include_router(views.router)
