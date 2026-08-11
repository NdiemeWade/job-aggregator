# ADR - Architecture et choix de stack

**Date** : 2024  
**Statut** : Accepté  
**Contexte** : Choix de la stack backend, des frontières de services et de l'organisation du projet.

---

## Contexte

L'équipe devait choisir une stack backend capable de gérer une API REST, une intégration API externe paginée, une authentification JWT, et une suite de tests automatisés, tout en restant déployable via Docker Compose.

---

## Décision

### Stack backend

| Composant | Choix | Version |
|---|---|---|
| Langage | Python | 3.11 |
| Framework API | FastAPI | 0.100+ |
| ORM | SQLAlchemy | 2.x |
| Base de données | PostgreSQL | 15 |
| Auth | python-jose (JWT) + passlib (bcrypt) | - |
| Rate limiting | slowapi | - |
| Tests | pytest + httpx | - |
| Serveur ASGI | Uvicorn | - |

### Frontières de services (Docker Compose)

```
┌──────────────────────────────────────────────────────┐
│                   docker-compose.yml                 │
│                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────┐   │
│  │frontend │    │ backend │    │       db        │   │
│  │React/TS │───▶│FastAPI  │───▶│ PostgreSQL 15   │   │
│  │:5173    │    │:8000    │    │:5432            │   │
│  └─────────┘    └─────────┘    └─────────────────┘   │
└──────────────────────────────────────────────────────┘
```

3 services minimum comme requis. Le frontend est commenté dans `docker-compose.yml` pendant le développement (Vite lancé en local) et sera décommenté pour la livraison finale.

### Organisation du code backend

Le backend suit un découpage en couches :

```
src/
├── main.py          # Composition root, routes globales
└── services/
    ├── auth.py      # Logique d'authentification
    ├── users.py     # Logique utilisateurs/admin/favoris
    ├── models.py    # Couche domaine (ORM)
    ├── schemas.py   # Couche contrat API (Pydantic)
    ├── database.py  # Couche infrastructure (connexion)
    ├── security.py  # Utilitaires transverses (JWT, hash)
    ├── Collector.py # Collecte externe
    └── Standardizer.py # Normalisation
```

Ce découpage respecte le **principe de responsabilité unique** : chaque fichier a un rôle précis et peut être testé indépendamment.

---

## Pourquoi FastAPI et non Flask ou Django ?

**Why** - Il nous fallait un framework Python moderne avec validation automatique des entrées/sorties, documentation Swagger auto-générée, et support natif de la programmation asynchrone pour les appels API externes.

**How** - FastAPI génère automatiquement la documentation OpenAPI depuis les schémas Pydantic. Les dépendances (`Depends()`) permettent d'injecter la session DB et le token JWT proprement dans chaque route, sans code boilerplate.

**Trade-off**

| | FastAPI | Flask | Django REST |
|---|---|---|---|
| Validation auto | Pydantic natif | pas manuel | Serializers |
| Swagger auto | oui | pas extension | extension |
| Async natif | oui | non | non |
| Courbe d'apprentissage | Faible | Très faible | Élevée |
| Taille du projet | Léger | Très léger | Lourd |

**Alternative rejetée : Flask** - Flask est plus simple pour des projets minimalistes, mais nécessite de nombreuses extensions tierces (Flask-JWT, Flask-SQLAlchemy, Marshmallow) qui alourdissent la configuration et fragmentent la documentation. FastAPI centralise tout cela nativement.

---

## Pourquoi SQLAlchemy ORM et non du SQL brut ?

**Why** - Le SQL brut via `text()` est rapide à écrire mais expose directement aux injections SQL si un paramètre est mal géré. L'ORM garantit la sécurité par construction.

**How** - Tous les accès base passent par `select(Model).where(Model.champ == valeur)`. SQLAlchemy paramètre automatiquement toutes les valeurs. La migration vers l'ORM complet (en remplacement des `text()` initiaux) a été documentée dans les commits.

**Trade-off** - L'ORM est légèrement moins performant que du SQL natif optimisé pour des requêtes très complexes. Pour ce projet (pas de JOIN massifs, volumes modérés), ce trade-off est acceptable.

---

## Pourquoi PostgreSQL et non SQLite en production ?

**Why** - SQLite est fichier-local et ne supporte pas la concurrence multi-process. PostgreSQL gère les connexions simultanées, les contraintes d'intégrité avancées et est production-ready.

**How** - PostgreSQL tourne dans un conteneur Docker avec un volume persistant. SQLite est utilisé **uniquement en test** (in-memory, via `conftest.py`) pour des tests rapides et isolés sans dépendance externe.

**Trade-off** - PostgreSQL nécessite un conteneur supplémentaire. La complexité est gérée par Docker Compose.

---

## Evidence

- `Apps/Backend/src/main.py` - composition root FastAPI
- `Apps/Backend/src/services/models.py` - modèles ORM
- `Apps/Backend/src/services/schemas.py` - schémas Pydantic
- `docker-compose.yml` - 3 services définis
- `Apps/Backend/tests/conftest.py` - SQLite in-memory pour les tests