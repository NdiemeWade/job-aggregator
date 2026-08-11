"""
test_api_jobs_security.py — Tests sécurité et nouvelles fonctionnalités.

Couvre :
  - Rate limiting (429) sur /login
  - Recherche et filtrage sur GET /api/jobs
  - Modération des offres PATCH /api/jobs/{id}/moderate
"""

import pytest
from sqlalchemy import text


# ──────────────────────────────────────────────
# Rate limiting — brute force /login
# ──────────────────────────────────────────────

class TestRateLimiting:
    def test_login_rate_limit_triggers_429(self, client):
        """
        Après 5 tentatives de login en moins d'une minute,
        slowapi doit retourner un 429.
        """
        payload = {"email": "test@epitech.eu", "password": "mauvais"}

        responses = [
            client.post("/api/auth/login", json=payload)
            for _ in range(6)
        ]

        status_codes = [r.status_code for r in responses]

        # Les 5 premières → 401 (mauvais mot de passe)
        # La 6ème → 429 (rate limit)
        assert 429 in status_codes, (
            f"Aucun 429 reçu après 6 tentatives. Codes obtenus : {status_codes}"
        )

    def test_register_rate_limit_triggers_429(self, client):
        """
        Après 3 tentatives d'inscription en moins d'une minute,
        slowapi doit retourner un 429.
        """
        responses = [
            client.post("/api/auth/register", json={
                "email": f"user{i}@epitech.eu",
                "password": "TestPassword123"
            })
            for i in range(4)
        ]

        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes, (
            f"Aucun 429 reçu après 4 tentatives. Codes obtenus : {status_codes}"
        )


# ──────────────────────────────────────────────
# Recherche et filtrage GET /api/jobs
# ──────────────────────────────────────────────

class TestJobSearch:
    def _insert_jobs(self, db_session):
        """Insère des offres de test."""
        db_session.execute(text("""
            INSERT INTO companies (id, name, website_url)
            VALUES (1, 'TechCorp', 'https://techcorp.com'),
                   (2, 'DataCorp', 'https://datacorp.com')
        """))
        db_session.execute(text("""
            INSERT INTO job_offers (
                id, external_id, title, description, company_id,
                location, contract_type, rythm, max_salary, source, profession
            ) VALUES
            (1, 'ext-001', 'Dev Python', 'Desc', 1, 'Paris, FR', 'CDI', 'Sur site', 50000, 'welovedevs', 'Backend'),
            (2, 'ext-002', 'Dev React', 'Desc', 1, 'Lyon, FR', 'Stage', 'Full remote', 1500, 'welovedevs', 'Frontend'),
            (3, 'ext-003', 'Data Engineer', 'Desc', 2, 'Paris, FR', 'CDI', 'Sur site', 60000, 'welovedevs', 'Data')
        """))
        db_session.commit()

    def test_get_all_jobs(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_filter_by_title(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs?title=python", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert "Python" in data[0]["title"]

    def test_filter_by_location(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs?location=Paris", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_filter_by_contract_type(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs?contract_type=Stage", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["contract_type"] == "Stage"

    def test_filter_by_min_salary(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs?min_salary=55000", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Data Engineer"

    def test_filter_combined(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs?location=Paris&contract_type=CDI", headers=auth_headers)
        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_filter_no_result(self, client, auth_headers, db_session):
        self._insert_jobs(db_session)
        response = client.get("/api/jobs?title=inexistant", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_jobs_requires_auth(self, client):
        response = client.get("/api/jobs")
        assert response.status_code == 401


# ──────────────────────────────────────────────
# Modération des offres
# ──────────────────────────────────────────────

class TestJobModeration:
    def _insert_job(self, db_session):
        db_session.execute(text(
            "INSERT INTO companies (id, name) VALUES (1, 'Corp')"
        ))
        db_session.execute(text("""
            INSERT INTO job_offers (id, external_id, title, description, company_id, location, source)
            VALUES (1, 'ext-001', 'Dev Python', 'Desc', 1, 'Paris', 'welovedevs')
        """))
        db_session.commit()

    def test_admin_can_moderate(self, client, admin_user, db_session):
        self._insert_job(db_session)
        response = client.patch("/api/jobs/1/moderate", headers=admin_user["headers"])
        assert response.status_code == 200
        assert response.json()["is_moderated"] is True

    def test_moderate_toggles_back(self, client, admin_user, db_session):
        self._insert_job(db_session)
        client.patch("/api/jobs/1/moderate", headers=admin_user["headers"])
        response = client.patch("/api/jobs/1/moderate", headers=admin_user["headers"])
        assert response.json()["is_moderated"] is False

    def test_user_cannot_moderate(self, client, auth_headers, db_session):
        self._insert_job(db_session)
        response = client.patch("/api/jobs/1/moderate", headers=auth_headers)
        assert response.status_code == 403

    def test_moderate_not_found(self, client, admin_user):
        response = client.patch("/api/jobs/999/moderate", headers=admin_user["headers"])
        assert response.status_code == 404

    def test_moderate_requires_auth(self, client):
        response = client.patch("/api/jobs/1/moderate")
        assert response.status_code == 401