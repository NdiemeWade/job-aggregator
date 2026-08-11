# Setup & Run - Backend Gateway

---

## Prérequis

- **Docker** ≥ 20 et **Docker Compose** ≥ 2
- **Python** 3.11+ (uniquement pour les tests locaux sans Docker)

---

## Démarrage rapide (Docker Compose)

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd <nom-du-repo>
```

### 2. Créer le fichier `.env`

```bash
cp .env.example .env  # si le fichier exemple existe
# ou créer manuellement :
```

Contenu minimal du `.env` (à la racine du projet) :

```env
# Base de données PostgreSQL
POSTGRES_USER=gateway_user
POSTGRES_PASSWORD=gateway_password
POSTGRES_DB=gateway_db
DATABASE_URL=postgresql://gateway_user:gateway_password@db:5432/gateway_db

# JWT - changer en production
SECRET_KEY=une-cle-secrete-longue-et-aleatoire-minimum-32-chars

# API WeLoveDevs
WELOVEDEVS_API_KEY=votre-cle-api-welovedevs

# Optionnel - durée de vie du token en minutes (défaut : 10080 = 7 jours)
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

> **Important** : `SECRET_KEY` doit être une chaîne longue et aléatoire. En production, générez-la avec :
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 3. Démarrer la stack complète

```bash
docker compose up --build
```

Services démarrés :
- **Backend** : `http://localhost:8000`
- **Base de données** : `localhost:5432`

La base de données est initialisée automatiquement au premier démarrage via `Apps/Database/init.sql`.

### 4. Vérifier que l'API répond

```bash
curl http://localhost:8000/
# → { "message": "API is running. Go to /docs for Swagger UI" }
```

**Documentation Swagger interactive** : http://localhost:8000/docs

---

## Tests

### Tests locaux (sans Docker)

```bash
cd Apps/Backend

# Créer un environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# ou : .venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer tous les tests
python -m pytest tests/ -v
```

Les tests utilisent une base SQLite in-memory - aucune instance PostgreSQL n'est nécessaire.

### Lancer un fichier de test spécifique

```bash
# Tests d'authentification
python -m pytest tests/test_api_auth.py -v

# Tests des offres
python -m pytest tests/test_api_jobs.py -v

# Tests de sécurité (rate limiting, filtres, modération)
python -m pytest tests/test_api_jobs_security.py -v

# Tests unitaires normalisation
python -m pytest tests/test_standardizer.py -v
```

---

## Synchroniser les offres WeLoveDevs

Une fois authentifié, déclencher la collecte manuellement :

```bash
# 1. S'authentifier
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.eu","password":"MotDePasse123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Déclencher la sync
curl -X POST http://localhost:8000/api/jobs/sync \
  -H "Authorization: Bearer $TOKEN"
```

---

## Variables d'environnement - référence complète

| Variable | Obligatoire | Description | Exemple |
|---|---|---|---|
| `DATABASE_URL` | oui | URL SQLAlchemy PostgreSQL | `postgresql://user:pass@db:5432/dbname` |
| `SECRET_KEY` | oui | Clé de signature JWT (min. 32 chars) | `abc123...` |
| `WELOVEDEVS_API_KEY` | oui | Clé API WeLoveDevs | `wld_xxxxx` |
| `POSTGRES_USER` | oui (Docker) | Utilisateur PostgreSQL | `gateway_user` |
| `POSTGRES_PASSWORD` | oui (Docker) | Mot de passe PostgreSQL | `gateway_password` |
| `POSTGRES_DB` | oui (Docker) | Nom de la base | `gateway_db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | non | Durée de vie JWT en minutes | `10080` (7 jours) |

---

## Structure des fichiers de configuration

```
.                          ← Racine du projet
├── .env                   ← Variables d'environnement (JAMAIS commité)
├── docker-compose.yml     ← Orchestration des services
└── Apps/
    └── Backend/
        ├── Dockerfile     ← Image backend Python 3.11
        ├── requirements.txt
        └── pytest.ini     ← Configuration pytest
```

---

## Lint (flake8)

```bash
cd Apps/Backend

# Lint du code source
flake8 src/ --max-line-length=120 --count --show-source --statistics

# Lint des tests
flake8 tests/ --max-line-length=120 --ignore=E402,W391 --count --show-source --statistics
```

---

## Commandes Docker utiles

```bash
# Démarrer en arrière-plan
docker compose up -d

# Voir les logs du backend
docker compose logs backend -f

# Arrêter sans supprimer les données
docker compose stop

# Arrêter ET supprimer les conteneurs (les données persistent dans le volume)
docker compose down

# Supprimer aussi les volumes (ATTENTION : efface la base)
docker compose down -v

# Reconstruire l'image backend
docker compose build backend
```