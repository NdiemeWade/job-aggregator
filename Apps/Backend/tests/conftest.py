"""
conftest.py — Fixtures partagées pour les tests pytest.

Mis à jour : utilise Base.metadata.create_all() des modèles ORM
au lieu de CREATE TABLE text() manuels → cohérence garantie.
"""

import os
os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sqlite3

from Apps.Backend.src.services.database import get_db
from Apps.Backend.src.services.models import Base, User  # modèles ORM
from Apps.Backend.src.main import app


def _sqlite_creator():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.isolation_level = None
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


engine = create_engine("sqlite://", creator=_sqlite_creator, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    # Crée toutes les tables depuis les modèles ORM — toujours en sync avec models.py
    Base.metadata.create_all(bind=engine)

    # Seed des rôles
    with engine.connect() as conn:
        conn.execute(text("INSERT OR IGNORE INTO roles (id, name) VALUES (1, 'admin')"))
        conn.execute(text("INSERT OR IGNORE INTO roles (id, name) VALUES (2, 'user')"))
        conn.commit()
    yield


@pytest.fixture(autouse=True)
def clean_db():
    yield
    with engine.connect() as conn:
        conn.execute(text("DELETE FROM job_offer_skills"))
        conn.execute(text("DELETE FROM user_favorite"))
        conn.execute(text("DELETE FROM job_offers"))
        conn.execute(text("DELETE FROM companies"))
        conn.execute(text("DELETE FROM users"))
        conn.execute(text("DELETE FROM skills"))
        conn.commit()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def registered_user(client):
    user_data = {"email": "test@epitech.eu", "password": "TestPassword123"}
    response = client.post("/api/auth/register", json=user_data)
    token = response.json()["access_token"]
    return {**user_data, "token": token}


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


@pytest.fixture
def admin_user(client, db_session):
    user_data = {"email": "admin@epitech.eu", "password": "AdminPassword123"}
    response = client.post("/api/auth/register", json=user_data)
    token = response.json()["access_token"]

    from sqlalchemy import select
    from Apps.Backend.src.services.models import User
    user = db_session.execute(select(User).where(User.email == user_data["email"])).scalar_one()
    user.role_id = 1
    db_session.commit()

    return {**user_data, "token": token, "headers": {"Authorization": f"Bearer {token}"}}
