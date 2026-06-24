#!/usr/bin/env bash
set -euo pipefail

# Wait for DB and apply migrations, then start the API.
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
