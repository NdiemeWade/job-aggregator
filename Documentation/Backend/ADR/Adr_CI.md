# ADR - CI/CD : pipeline GitHub Actions

**Date** : 2024  
**Statut** : Accepté  
**Contexte** : Mise en place d'une intégration continue automatisée sur le backend Python.

---

## Décision

### Système CI choisi : GitHub Actions

**Why** - GitHub Actions est natif au dépôt GitHub, ne nécessite pas d'infrastructure supplémentaire, et s'intègre directement aux pull requests. Le cahier des charges impose `runs-on: self-hosted` - les runners auto-hébergés Epitech sont directement supportés.

**How** - Un workflow unique `backend-ci.yml` se déclenche automatiquement sur :
- Chaque `push` sur `main`
- Chaque `pull_request` ciblant `main`

---

## Workflow défini

**Fichier** : `.github/workflows/backend-ci.yml`

```yaml
name: Backend CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: self-hosted
    defaults:
      run:
        working-directory: Apps/Backend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Lint with flake8
        run: |
          flake8 src/ --max-line-length=120
          flake8 tests/ --max-line-length=120 --ignore=E402,W391
      - name: Run tests
        run: python -m pytest tests/ -v
```

---

## Checks automatisés et justification

### 1. Installation des dépendances

**Why** - Vérifie que `requirements.txt` est complet et qu'une installation depuis zéro fonctionne. Détecte les dépendances manquantes ou les conflits de version avant qu'ils n'arrivent en production.

**How** - `pip install -r requirements.txt` dans un environnement propre fourni par le runner.

**Trade-off** - Pas de cache pip configuré actuellement, donc chaque run réinstalle les dépendances. Sur un runner self-hosted avec cache système, l'impact est limité.

### 2. Lint avec flake8

**Why** - La qualité du code est une exigence explicite du cahier des charges. flake8 détecte les erreurs syntaxiques, les imports inutilisés, les lignes trop longues, et les conventions PEP8 non respectées, avant même d'exécuter les tests.

**How**
- `src/` : longueur max 120 caractères (accommodation pour les docstrings longues)
- `tests/` : `E402` (imports non en tête) et `W391` (ligne vide en fin) ignorés car pattern pytest courant

**Trade-off** - flake8 seul ne vérifie pas les types. Un check mypy serait plus complet mais alourdirait le pipeline. À envisager si le projet grandit.

### 3. Tests automatisés avec pytest

**Why** - Le cahier des charges impose des tests automatisés couvrant **au minimum deux routes API** et **une fonction de normalisation**. Les tests protègent contre les régressions lors des modifications futures.

**How** - `python -m pytest tests/ -v` exécute l'ensemble des tests unitaires et d'intégration :

| Fichier de test | Couverture |
|---|---|
| `test_api_auth.py` | Routes `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| `test_api_jobs.py` | Routes `GET /`, `GET /api/jobs`, `POST /api/jobs/sync` |
| `test_api_jobs_security.py` | Rate limiting (429), filtres de recherche, modération admin |
| `test_standardizer.py` | 30+ cas unitaires sur `_clean_salary`, `_parse_salary_range`, `_normalize_contract_type`, `_parse_location`, `_normalize_rythm_from_policy`, `standardize()` |

**Conformité cahier des charges**

| Exigence | Routes/fonctions testées |
|---|---|
| ≥ 2 routes API | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/jobs`, `/api/jobs/sync`, `/api/jobs/{id}/moderate` |
| ≥ 1 fonction de normalisation | `_clean_salary()`, `_parse_salary_range()`, `_normalize_contract_type()`, `_parse_location()`, `_normalize_rythm_from_policy()`, `standardize()` |

**Trade-off** - Les tests utilisent une base SQLite in-memory (via `conftest.py`) plutôt que PostgreSQL pour éviter une dépendance externe dans le CI. Le comportement est identique pour les opérations CRUD standard.

---

## Stratégie de test

La fixture `conftest.py` initialise une base SQLite in-memory partagée pour la session de test, avec :
- Création des tables via `Base.metadata.create_all()` - toujours en sync avec `models.py`
- Seed des rôles `admin` (1) et `user` (2)
- Nettoyage de toutes les tables entre chaque test (`autouse=True`)
- Override de la dépendance `get_db()` FastAPI via `app.dependency_overrides`

Cette approche garantit l'isolation complète entre les tests et la reproductibilité.

---

## Ce que le pipeline protège

| Risque | Protection CI |
|---|---|
| Import ou syntaxe cassé | flake8 + install deps |
| Régression sur une route API | pytest routes |
| Régression sur la normalisation | pytest standardizer |
| Dépendance manquante dans requirements.txt | pip install |
| Code non PEP8 | flake8 |

---

## Alternative rejetée : GitHub-hosted runners (`ubuntu-latest`)

**Pourquoi rejeté** - Le cahier des charges l'interdit explicitement : "Workflows that do not target self-hosted runners will not be evaluated." Les runners GitHub-hosted ne seront pas évalués par le jury.

---

## Evidence

- `.github/workflows/backend-ci.yml`
- `Apps/Backend/tests/` - 4 fichiers de tests
- `Apps/Backend/tests/conftest.py` - configuration fixtures
- `Apps/Backend/pytest.ini` - configuration pytest (`testpaths = tests`, `pythonpath = src`)