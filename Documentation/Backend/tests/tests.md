# Tests - Backend Gateway

Documentation de la stratégie de test, de la couverture et des instructions d'exécution.

---

## Vue d'ensemble

Le backend dispose d'une suite de tests automatisés exécutée en CI (GitHub Actions) à chaque push et pull request sur `main`.

| Fichier | Type | Couverture |
|---|---|---|
| `test_api_auth.py` | Intégration | Routes `/api/auth/*` |
| `test_api_jobs.py` | Intégration | Routes `/`, `/api/jobs`, `/api/jobs/sync` |
| `test_api_jobs_security.py` | Intégration + Sécurité | Rate limiting, filtres avancés, modération |
| `test_standardizer.py` | Unitaire | Toutes les fonctions de normalisation |

**Conformité cahier des charges** : ≥ 2 routes API testées + ≥ 1 fonction de normalisation testée

---

## Infrastructure de test (`conftest.py`)

### Stratégie

Les tests utilisent une **base SQLite in-memory** pour éviter toute dépendance externe (pas besoin d'une instance PostgreSQL active). Les modèles ORM (`Base.metadata.create_all()`) garantissent que le schéma de test reste toujours synchronisé avec le schéma de production.

### Fixtures disponibles

| Fixture | Scope | Description |
|---|---|---|
| `setup_test_db` | `session` | Crée les tables + seed des rôles (1=admin, 2=user) - une seule fois |
| `clean_db` | `function` (autouse) | Vide toutes les tables entre chaque test → isolation garantie |
| `client` | `function` | `TestClient` FastAPI avec override de `get_db()` sur SQLite |
| `db_session` | `function` | Session SQLAlchemy directe pour setup de données |
| `registered_user` | `function` | Crée un utilisateur via l'API et retourne ses credentials + token |
| `auth_headers` | `function` | Dict `{"Authorization": "Bearer <token>"}` prêt à l'emploi |
| `admin_user` | `function` | Crée un utilisateur et lui assigne `role_id=1` en base |

### Override de dépendances FastAPI

```python
app.dependency_overrides[get_db] = override_get_db
```

FastAPI injecte la session SQLite au lieu de PostgreSQL dans tous les handlers pendant les tests, sans modifier le code de production.

---

## `test_api_auth.py` - Routes d'authentification

### `TestRegister`

| Test | Ce qui est vérifié |
|---|---|
| `test_register_success` | `201` + présence de `access_token` + `token_type: bearer` |
| `test_register_duplicate_email` | `409` si l'email existe déjà |
| `test_register_invalid_email` | `422` pour un email malformé |
| `test_register_password_too_short` | `422` pour un mot de passe < 8 caractères |
| `test_register_missing_email` | `422` si le champ email est absent |
| `test_register_missing_password` | `422` si le champ password est absent |

### `TestLogin`

| Test | Ce qui est vérifié |
|---|---|
| `test_login_success` | `200` + token valide pour credentials corrects |
| `test_login_wrong_password` | `401` pour mauvais mot de passe |
| `test_login_nonexistent_email` | `401` pour email inconnu (même message = anti-enumeration) |
| `test_login_invalid_email_format` | `422` pour format email invalide |

### `TestGetMe`

| Test | Ce qui est vérifié |
|---|---|
| `test_get_me_authenticated` | `200` + email correct dans la réponse |
| `test_get_me_no_token` | `401` sans header Authorization |
| `test_get_me_invalid_token` | `401` avec token forgé |

---

## `test_api_jobs.py` - Routes des offres

### `TestHealthCheck`

| Test | Ce qui est vérifié |
|---|---|
| `test_root_returns_ok` | `200` + message contenant "running" ou "API" |

### `TestReadJobs`

| Test | Ce qui est vérifié |
|---|---|
| `test_get_jobs_authenticated` | `200` + liste contenant l'offre insérée |
| `test_get_jobs_empty` | `200` + tableau vide si aucune offre |
| `test_get_jobs_no_auth` | `401` sans token |
| `test_get_jobs_invalid_token` | `401` avec token invalide |

### `TestSyncJobs`

| Test | Ce qui est vérifié |
|---|---|
| `test_sync_no_auth` | `401` sans token |
| `test_sync_api_failure` | `500` si `Collector.collect_jobs()` retourne liste vide (mock) |
| `test_sync_success` | `200` + `status: success` + `jobs_traites >= 1` (mocks Collector + Standardizer) |

---

## `test_api_jobs_security.py` - Sécurité et fonctionnalités avancées

### `TestRateLimiting`

| Test | Ce qui est vérifié |
|---|---|
| `test_login_rate_limit_triggers_429` | 6 tentatives de login → au moins un `429` |
| `test_register_rate_limit_triggers_429` | 4 tentatives d'inscription → au moins un `429` |

### `TestJobSearch` - Filtres avancés

| Test | Filtre testé |
|---|---|
| `test_get_all_jobs` | Aucun filtre → 3 offres |
| `test_filter_by_title` | `?title=python` → 1 offre |
| `test_filter_by_location` | `?location=Paris` → 2 offres |
| `test_filter_by_contract_type` | `?contract_type=Stage` → 1 offre |
| `test_filter_by_min_salary` | `?min_salary=55000` → 1 offre |
| `test_filter_combined` | `?location=Paris&contract_type=CDI` → 2 offres |
| `test_filter_no_result` | `?title=inexistant` → tableau vide |
| `test_jobs_requires_auth` | Sans token → `401` |

### `TestJobModeration`

| Test | Ce qui est vérifié |
|---|---|
| `test_admin_can_moderate` | Admin → `200` + `is_moderated: true` |
| `test_moderate_toggles_back` | 2e appel admin → `is_moderated: false` (toggle) |
| `test_user_cannot_moderate` | User standard → `403` |
| `test_moderate_not_found` | ID inexistant → `404` |
| `test_moderate_requires_auth` | Sans token → `401` |

---

## `test_standardizer.py` - Normalisation des données

### `TestCleanSalary`

Couvre : suffixe `k`, majuscule `K`, entier brut, espaces, symbole `€`, suffixe `/an`, `None`, chaîne vide, chaîne invalide, flottant avec `k`.

### `TestParseSalaryRange`

Couvre : séparateur `→`, séparateur `-`, valeur unique, entrée `None`, chaîne vide.

### `TestNormalizeContractType`

Couvre : `cdi`, `CDI`, `CDD`, `freelance`, `stage`, `alternance`, `intern` → `Stage`, `contract` → `Freelance`, `None`, type inconnu préservé, espaces trimmés.

### `TestParseLocation`

Couvre : localisation simple, avec `- Télétravail`, avec `- Remote`, `None`, chaîne vide.

### `TestNormalizeRythmFromPolicy`

Couvre : `fullTime` → `Full remote`, `hybrid` → `Télétravail hybride`, `onSite` → `Sur site`, fréquence inconnue → `Sur site`, dict vide → `Sur site`.

### `TestStandardize` - Pipeline complet

| Test | Ce qui est vérifié |
|---|---|
| `test_standardize_returns_correct_structure` | Présence des clés `company`, `job_offer`, `skills` |
| `test_standardize_company_fields` | `name` et `website_url` corrects |
| `test_standardize_job_offer_fields` | `external_id`, `title`, `description`, `location`, `contract_type`, `min_salary`, `max_salary`, `currency`, `rythm`, `source`, `required_experience`, `profession` |
| `test_standardize_skills` | 2 skills avec `name` et `relevance` |
| `test_standardize_posted_at_conversion` | `posted_at` est un objet `datetime` |
| `test_standardize_empty_data_raises_error` | `ValueError` sur `None` et `{}` |
| `test_standardize_missing_optional_fields` | Valeurs par défaut correctes si champs absents |
| `test_standardize_no_skills` | `skills` = liste vide si `skillsList` absent |
| `test_standardize_company_unknown_when_missing` | `company.name` = `"Inconnue"` si absent |

---

## Lancer les tests

### Tous les tests

```bash
cd Apps/Backend
python -m pytest tests/ -v
```

### Un fichier spécifique

```bash
python -m pytest tests/test_standardizer.py -v
python -m pytest tests/test_api_auth.py -v
python -m pytest tests/test_api_jobs_security.py -v
```

### Avec rapport de couverture (optionnel)

```bash
pip install pytest-cov
python -m pytest tests/ --cov=src --cov-report=term-missing
```

### En mode silencieux (CI)

```bash
python -m pytest tests/ -q
```

---

## Configuration pytest

**Fichier** : `Apps/Backend/pytest.ini`

```ini
[pytest]
testpaths = tests
pythonpath = src
```

- `testpaths = tests` : pytest cherche uniquement dans le dossier `tests/`
- `pythonpath = src` : les imports `from services.auth import ...` fonctionnent sans modification de `PYTHONPATH`

---

## Dépendances de test

Listées dans `requirements.txt` :

```
pytest       # Framework de test
httpx        # Client HTTP async pour TestClient FastAPI
```

Aucune dépendance externe (PostgreSQL, Redis...) n'est requise pour lancer les tests.