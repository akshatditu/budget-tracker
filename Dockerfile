# ---- Stage 1: build the React SPA ----
FROM node:20-slim AS frontend
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: FastAPI backend that also serves the built SPA ----
FROM python:3.11-slim AS app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

# Install the backend (deps + the `app` package) from its pyproject.
COPY backend/pyproject.toml ./
COPY backend/app ./app
RUN pip install .

# Alembic config + migrations, run from /app at container start.
COPY backend/alembic.ini ./
COPY backend/alembic ./alembic

# The production SPA build, served same-origin by FastAPI (app/main.py looks in app/static).
COPY --from=frontend /web/dist ./app/static

EXPOSE 8000
# Apply migrations (no-op once the data dump is loaded), then serve on Render's $PORT.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
