"""
Tests unitaires pour les routes d'authentification (auth.py).

Couvre les routes :
  POST /api/auth/register  - Inscription
  POST /api/auth/login     - Connexion
  GET  /api/auth/me        - Profil utilisateur connecté
"""


# ──────────────────────────────────────────────
# POST /api/auth/register
# ──────────────────────────────────────────────

class TestRegister:
    def test_register_success(self, client):
        response = client.post("/api/auth/register", json={
            "email": "nouveau@epitech.eu",
            "password": "MotDePasse123",
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, client, registered_user):
        response = client.post("/api/auth/register", json={
            "email": registered_user["email"],
            "password": "AutreMotDePasse1",
        })
        assert response.status_code == 409

    def test_register_invalid_email(self, client):
        response = client.post("/api/auth/register", json={
            "email": "pas-un-email",
            "password": "MotDePasse123",
        })
        assert response.status_code == 422

    def test_register_password_too_short(self, client):
        response = client.post("/api/auth/register", json={
            "email": "short@epitech.eu",
            "password": "1234567",
        })
        assert response.status_code == 422

    def test_register_missing_email(self, client):
        response = client.post("/api/auth/register", json={
            "password": "MotDePasse123",
        })
        assert response.status_code == 422

    def test_register_missing_password(self, client):
        response = client.post("/api/auth/register", json={
            "email": "missing@epitech.eu",
        })
        assert response.status_code == 422


# ──────────────────────────────────────────────
# POST /api/auth/login
# ──────────────────────────────────────────────

class TestLogin:
    def test_login_success(self, client, registered_user):
        response = client.post("/api/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, registered_user):
        response = client.post("/api/auth/login", json={
            "email": registered_user["email"],
            "password": "MauvaisMotDePasse",
        })
        assert response.status_code == 401

    def test_login_nonexistent_email(self, client):
        response = client.post("/api/auth/login", json={
            "email": "inconnu@epitech.eu",
            "password": "MotDePasse123",
        })
        assert response.status_code == 401

    def test_login_invalid_email_format(self, client):
        response = client.post("/api/auth/login", json={
            "email": "pas-un-email",
            "password": "MotDePasse123",
        })
        assert response.status_code == 422


# ──────────────────────────────────────────────
# GET /api/auth/me
# ──────────────────────────────────────────────

class TestGetMe:
    def test_get_me_authenticated(self, client, registered_user, auth_headers):
        response = client.get("/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user["email"]
        assert "id" in data

    def test_get_me_no_token(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, client):
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer token_invalide_12345",
        })
        assert response.status_code == 401
