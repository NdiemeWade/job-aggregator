"""
Tests unitaires pour les routes des offres d'emploi (main.py).

Couvre les routes :
  GET  /              - Health check
  GET  /api/jobs      - Liste des offres (protégée)
  POST /api/jobs/sync - Synchronisation WeLoveDevs (protégée)
"""

from unittest.mock import patch, MagicMock
from sqlalchemy import text


# ──────────────────────────────────────────────
# GET / (health check)
# ──────────────────────────────────────────────

class TestHealthCheck:
    def test_root_returns_ok(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "running" in data["message"].lower() or "API" in data["message"]


# ──────────────────────────────────────────────
# GET /api/jobs
# ──────────────────────────────────────────────

class TestReadJobs:
    def test_get_jobs_authenticated(self, client, auth_headers, db_session):
        db_session.execute(text("""
            INSERT INTO companies (id, name, website_url)
            VALUES (1, 'TestCorp', 'https://testcorp.com')
        """))
        db_session.execute(text("""
            INSERT INTO job_offers (
                id, external_id, title, description, company_id,
                location, contract_type, source
            ) VALUES (
                1, 'ext-001', 'Dev Python', 'Description test',
                1, 'Paris, FR', 'CDI', 'welovedevs'
            )
        """))
        db_session.commit()

        response = client.get("/api/jobs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["title"] == "Dev Python"

    def test_get_jobs_empty(self, client, auth_headers):
        response = client.get("/api/jobs", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_jobs_no_auth(self, client):
        response = client.get("/api/jobs")
        assert response.status_code == 401

    def test_get_jobs_invalid_token(self, client):
        response = client.get("/api/jobs", headers={
            "Authorization": "Bearer token_invalide",
        })
        assert response.status_code == 401


# ──────────────────────────────────────────────
# POST /api/jobs/sync
# ──────────────────────────────────────────────

class TestSyncJobs:
    def test_sync_no_auth(self, client):
        response = client.post("/api/jobs/sync")
        assert response.status_code == 401

    @patch("main.Collector")
    def test_sync_api_failure(self, mock_collector_class, client, auth_headers):
        mock_instance = MagicMock()
        mock_instance.collect_jobs.return_value = []
        mock_collector_class.return_value = mock_instance

        response = client.post("/api/jobs/sync", headers=auth_headers)
        assert response.status_code == 500

    @patch("main.Collector")
    @patch("main.JobStandardizer")
    def test_sync_success(
        self, mock_standardizer_class, mock_collector_class,
        client, auth_headers
    ):
        mock_collector = MagicMock()
        mock_collector.collect_jobs.return_value = [
            {"id": "wld-test-001", "title": "Test Job"},
        ]
        mock_collector_class.return_value = mock_collector

        mock_standardizer = MagicMock()
        mock_standardizer.standardize.return_value = {
            "company": {
                "name": "SyncCorp",
                "website_url": "https://synccorp.com",
            },
            "job_offer": {
                "external_id": "wld-test-001",
                "title": "Test Job Sync",
                "description": "Description sync",
                "location": "Lyon, FR",
                "contract_type": "CDI",
                "min_salary": 40000,
                "max_salary": 55000,
                "currency": "EUR",
                "posted_at": None,
                "rythm": "Sur site",
                "source": "WeLoveDevs",
                "required_experience": 2,
                "profession": "Dev",
            },
            "skills": [
                {"name": "Python", "relevance": 80.0},
            ],
        }
        mock_standardizer_class.return_value = mock_standardizer

        response = client.post("/api/jobs/sync", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["jobs_traites"] >= 1
