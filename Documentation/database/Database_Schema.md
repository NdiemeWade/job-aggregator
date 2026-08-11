# Schéma de base de données — Gateway

Base de données : **PostgreSQL 15**.

Schéma ORM défini dans `Apps/Backend/src/services/models.py`.  
Script SQL d'initialisation : `Apps/Database/init.sql`.

---

## Diagramme entité-relation

```
┌─────────┐       ┌─────────┐       ┌────────────┐
│  roles  │◄──────│  users  │       │  companies │
│─────────│  FK   │─────────│       │────────────│
│ id (PK) │       │ id (PK) │       │ id (PK)    │
│ name    │       │ email   │       │ name       │
└─────────┘       │ password│       │ logo_url   │
                  │ _hash   │       │ website_url│
                  │ role_id │       └─────┬──────┘
                  │ created │             └──────┐ FK
                  │ _at     │                    ▼  
                  └────┬────┘            ┌────────────────┐
                       │                 │   job_offers   │
                       │ FK (M:N)        │────────────────│
                       ▼                 │ id (PK)        │
                  ┌──────────────┐       │ external_id    │
                  │user_favorite │       │ title          │
                  │──────────────│       │ description    │
                  │ user_id (PK) │       │ company_id (FK)│
                  │ job_offer_id │◄──────┤ location       │
                  │         (PK) │       │ contract_type  │
                  └──────────────┘       │ min_salary     │
                                         │ max_salary     │
                  ┌─────────┐            │ currency       │
                  │ skills  │            │ posted_at      │
                  │─────────│            │ rythm          │
                  │ id (PK) │            │ required_exp.  │
                  │ name    │            │ profession     │
                  └────┬────┘            │ source         │
                       │ FK (M:N)        │ is_moderated   │
                       ▼                 │ ai_summary     │
                  ┌──────────────────┐   │ relevance_score│
                  │ job_offer_skills │   │ normalized_at  │
                  │──────────────────│   └────────────────┘
                  │ job_offer_id (PK)│
                  │ skill_id     (PK)│
                  │ relevance        │
                  └──────────────────┘
```

---

## Tables

### `roles`

Référentiel des rôles. Seeded au démarrage.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Identifiant |
| `name` | `VARCHAR(50)` | UNIQUE, NOT NULL | Nom du rôle |

**Données initiales**

| id | name |
|---|---|
| 1 | `admin` |
| 2 | `user` |

---

### `users`

Comptes utilisateurs de la plateforme.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Identifiant auto-incrémenté |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Adresse email (identifiant de connexion) |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hash bcrypt du mot de passe |
| `role_id` | `INTEGER` | FK → `roles.id`, ON DELETE RESTRICT | Rôle associé (nullable) |
| `created_at` | `TIMESTAMP` | DEFAULT NOW() | Date de création du compte |

**Contraintes d'intégrité**
- L'email est unique : impossible de créer deux comptes avec le même email.
- La suppression d'un rôle est bloquée s'il est encore assigné (`ON DELETE RESTRICT`).
- Le mot de passe n'est jamais stocké en clair : uniquement le hash bcrypt.

---

### `companies`

Entreprises poster des offres.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Identifiant auto-incrémenté |
| `name` | `VARCHAR(255)` | UNIQUE, NOT NULL | Nom de l'entreprise |
| `logo_url` | `TEXT` | nullable | URL du logo |
| `website_url` | `TEXT` | nullable | Page entreprise WeLoveDevs |

**Contrainte** : `name` est unique → `ON CONFLICT DO NOTHING` à l'ingestion.

---

### `job_offers`

Offres d'emploi normalisées.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Identifiant interne |
| `external_id` | `VARCHAR(255)` | UNIQUE, nullable | ID d'origine WeLoveDevs (`objectID`) |
| `title` | `VARCHAR(255)` | NOT NULL | Intitulé du poste |
| `description` | `TEXT` | NOT NULL | Aperçu de la description |
| `company_id` | `INTEGER` | FK → `companies.id`, ON DELETE CASCADE | Entreprise associée |
| `location` | `VARCHAR(255)` | NOT NULL | Localisation |
| `contract_type` | `VARCHAR(100)` | nullable | `CDI`, `CDD`, `Stage`, `Alternance`, `Freelance` |
| `min_salary` | `INTEGER` | nullable | Salaire minimum annuel en euros |
| `max_salary` | `INTEGER` | nullable | Salaire maximum annuel en euros |
| `currency` | `VARCHAR(10)` | DEFAULT `'EUR'` | Devise |
| `posted_at` | `TIMESTAMP` | nullable | Date de publication |
| `rythm` | `VARCHAR(255)` | DEFAULT `'Sur site'` | Mode de travail |
| `required_experience` | `INTEGER` | nullable | Expérience requise en années |
| `profession` | `VARCHAR(100)` | nullable | Métier (depuis `profession.langContent.fr.name`) |
| `source` | `VARCHAR(50)` | DEFAULT `'welovedevs'` | Source de l'offre |
| `is_moderated` | `BOOLEAN` | DEFAULT `FALSE` | Validée par un admin |
| `ai_summary` | `TEXT` | nullable | Résumé généré par l'IA |
| `relevance_score` | `FLOAT` | nullable | Score de pertinence calculé |
| `normalized_at` | `TIMESTAMP` | DEFAULT NOW() | Horodatage de normalisation |

**Contrainte principale** : `external_id` est unique, pas de doublons même en cas de re-sync.

**Valeurs normalisées de `rythm`**

| Valeur API (`remotePolicy.frequency`) | Valeur stockée |
|---|---|
| `fullTime` | `Full remote` |
| `hybrid` | `Télétravail hybride` |
| `onSite` | `Sur site` |

**Valeurs normalisées de `contract_type`**

| Valeur brute | Valeur stockée |
|---|---|
| `cdi` / `CDI` | `CDI` |
| `cdd` / `CDD` | `CDD` |
| `freelance` / `contract` | `Freelance` |
| `stage` / `intern` | `Stage` |
| `alternance` | `Alternance` |

---

### `skills`

Référentiel des compétences (dédupliquées).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `SERIAL` | PK | Identifiant |
| `name` | `VARCHAR(100)` | UNIQUE, NOT NULL | Nom de la compétence |

---

### `job_offer_skills`

Table de liaison offre ↔ compétence (relation N:M).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `job_offer_id` | `INTEGER` | PK, FK → `job_offers.id`, ON DELETE CASCADE | |
| `skill_id` | `INTEGER` | PK, FK → `skills.id`, ON DELETE CASCADE | |
| `relevance` | `FLOAT` | nullable | Score de pertinence de la compétence pour cette offre |

---

### `user_favorite`

Table de liaison utilisateur ↔ offre favorite (relation N:M).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `user_id` | `INTEGER` | PK, FK → `users.id`, ON DELETE CASCADE | |
| `job_offer_id` | `INTEGER` | PK, FK → `job_offers.id`, ON DELETE CASCADE | |

---

## Stratégie de persistance

La base de données tourne dans un conteneur Docker dont le volume est monté sur l'hôte (`postgres_data`). Les données survivent aux redémarrages du conteneur.

Le script `init.sql` est exécuté automatiquement au premier démarrage du conteneur PostgreSQL (`docker-entrypoint-initdb.d/`). (`ON CONFLICT DO NOTHING` sur les seeds).

En environnement de test, une base **SQLite in-memory** est utilisée via `conftest.py`. Les modèles ORM (`Base.metadata.create_all()`) garantissent que le schéma de test reste toujours en sync avec le schéma de production.