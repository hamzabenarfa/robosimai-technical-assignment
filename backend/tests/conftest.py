"""
Test fixtures.

Tests run against a dedicated database (default `robosim_test`) so the dev
data stays untouched. Each test gets a SQLAlchemy session that creates a
SAVEPOINT on entry; the outer transaction is rolled back at teardown so
nothing persists.
"""
from __future__ import annotations

import os
from collections.abc import Generator
from urllib.parse import urlsplit, urlunsplit

import psycopg
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

DEFAULT_TEST_URL = (
    "postgresql+psycopg://robosim:robosim@localhost:5433/robosim_test"
)
TEST_DB_URL = os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_URL)


def _admin_url(test_url: str) -> str:
    """Strip the db name from the URL so we can connect to postgres for DDL."""
    parts = urlsplit(test_url.replace("+psycopg", ""))
    return urlunsplit(parts._replace(path="/postgres"))


def _db_name(test_url: str) -> str:
    return urlsplit(test_url).path.lstrip("/")


def _ensure_test_database() -> None:
    admin_url = _admin_url(TEST_DB_URL)
    name = _db_name(TEST_DB_URL)
    with psycopg.connect(admin_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (name,))
            if not cur.fetchone():
                cur.execute(f'CREATE DATABASE "{name}"')


# DATABASE_URL must be set before app.config / app.database import.
_ensure_test_database()
os.environ["DATABASE_URL"] = TEST_DB_URL

from app import models  # noqa: E402, F401  (registers tables on Base.metadata)
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL, future=True)
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def db(engine) -> Generator[Session, None, None]:
    connection = engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(
        bind=connection,
        autoflush=False,
        autocommit=False,
        future=True,
        # Services call session.commit(); with this mode, commits release a
        # SAVEPOINT instead of the outer transaction, so we can roll back.
        join_transaction_mode="create_savepoint",
    )
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db) -> Generator[TestClient, None, None]:
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.pop(get_db, None)
