# API Reference

Base URL locale : `http://localhost:8000`

Documentation interactive Swagger : `http://localhost:8000/docs`

---

## Authentification

Toutes les routes protégées attendent un token JWT dans le header :

```
Authorization: Bearer <access_token>
```

Le token est obtenu via `/api/auth/register` ou `/api/auth/login`.

---

## Routes

### Health

#### `GET /`

Vérifie que l'API répond. Non protégée.

**Réponse 200**
```json
{ "message": "API is running. Go to /docs for Swagger UI" }
```

---

### Authentification — `/api/auth`

#### `POST /api/auth/register`

Inscrit un nouvel utilisateur. Retourne un token JWT.

**Rate limit** : 3 requêtes/minute par IP.

**Corps**
```json
{
  "email": "utilisateur@epitech.eu",
  "password": "MonMotDePasse123"
}
```

| Contrainte | Règle |
|---|---|
| `email` | Format email valide (Pydantic `EmailStr`) |
| `password` | Minimum 8 caractères |

**Réponses**

| Code | Cas |
|---|---|
| `201 Created` | Inscription réussie → `{ "access_token": "...", "token_type": "bearer" }` |
| `409 Conflict` | Email déjà utilisé |
| `422 Unprocessable Entity` | Données invalides (email malformé, mot de passe trop court) |
| `429 Too Many Requests` | Rate limit dépassé |

---

#### `POST /api/auth/login`

Connecte un utilisateur existant. Retourne un token JWT.

**Rate limit** : 5 requêtes/minute par IP (protection brute-force).

**Corps**
```json
{
  "email": "utilisateur@epitech.eu",
  "password": "MonMotDePasse123"
}
```

**Réponses**

| Code | Cas |
|---|---|
| `200 OK` | Connexion réussie → `{ "access_token": "...", "token_type": "bearer" }` |
| `401 Unauthorized` | Email inconnu ou mot de passe incorrect (message volontairement identique — anti user-enumeration) |
| `422 Unprocessable Entity` | Email malformé |
| `429 Too Many Requests` | Rate limit dépassé |

---

#### `GET /api/auth/me`

Retourne le profil de l'utilisateur connecté.

**Protégée** : JWT requis.

**Réponse 200**
```json
{
  "id": 1,
  "email": "utilisateur@epitech.eu",
  "role_id": 2
}
```

| Code | Cas |
|---|---|
| `200 OK` | Profil retourné |
| `401 Unauthorized` | Token absent, invalide ou expiré |
| `404 Not Found` | Utilisateur introuvable en base |

---

### Offres d'emploi — `/api/jobs`

#### `GET /api/jobs`

Retourne la liste des offres, triées par date décroissante. Supporte le filtrage multi-critères.

**Protégée** : JWT requis.

**Query parameters optionnels**

| Paramètre | Type | Description |
|---|---|---|
| `title` | `string` | Recherche partielle insensible à la casse sur le titre |
| `location` | `string` | Recherche partielle insensible à la casse sur la localisation |
| `contract_type` | `string` | Valeur exacte : `CDI`, `CDD`, `Stage`, `Alternance`, `Freelance` |
| `rythm` | `string` | Valeur exacte : `Sur site`, `Full remote`, `Télétravail hybride` |
| `min_salary` | `integer` | Salaire minimum souhaité (filtre sur `max_salary >= min_salary`) |
| `profession` | `string` | Recherche partielle sur la profession |

**Exemple de requête**
```
GET /api/jobs?location=Paris&contract_type=CDI&min_salary=40000
```

**Réponse 200** — tableau d'objets offre :
```json
[
  {
    "id": 1,
    "external_id": "wld-12345",
    "title": "Développeur Python Senior",
    "description": "Rejoignez notre équipe tech...",
    "company_id": 3,
    "location": "Paris, FR",
    "contract_type": "CDI",
    "min_salary": 45000,
    "max_salary": 65000,
    "currency": "EUR",
    "posted_at": "2023-11-14T12:00:00Z",
    "rythm": "Télétravail hybride",
    "required_experience": 5,
    "profession": "Développeur backend",
    "source": "WeLoveDevs",
    "is_moderated": false
  }
]
```

| Code | Cas |
|---|---|
| `200 OK` | Liste retournée (vide si aucun résultat) |
| `401 Unauthorized` | Token absent ou invalide |

---

#### `POST /api/jobs/sync`

Déclenche manuellement la collecte et l'ingestion des offres WeLoveDevs.

**Protégée** : JWT requis.

Le pipeline exécute dans l'ordre :
1. `Collector.collect_jobs()` — appels paginés à l'API WeLoveDevs (1 req/s)
2. `JobStandardizer.standardize()` — normalisation de chaque offre brute
3. Insertion en base avec `ON CONFLICT DO NOTHING` sur `external_id`

**Réponse 200**
```json
{
  "status": "success",
  "message": "Synchronisation terminée",
  "jobs_traites": 87
}
```

| Code | Cas |
|---|---|
| `200 OK` | Synchronisation terminée |
| `401 Unauthorized` | Token absent ou invalide |
| `500 Internal Server Error` | Échec de la récupération depuis l'API WeLoveDevs |

---

#### `PATCH /api/jobs/{job_id}/moderate`

Bascule le statut `is_moderated` d'une offre (toggle true/false).

**Protégée** : JWT requis + rôle `admin` (role_id = 1).

**Réponse 200**
```json
{
  "id": 1,
  "title": "Développeur Python Senior",
  "is_moderated": true
}
```

| Code | Cas |
|---|---|
| `200 OK` | Statut mis à jour |
| `401 Unauthorized` | Token absent ou invalide |
| `403 Forbidden` | Utilisateur non admin |
| `404 Not Found` | Offre introuvable |

---

### Utilisateurs — `/api/users`

> Toutes les routes de ce groupe nécessitent un JWT valide.

#### `GET /api/users`

Liste tous les utilisateurs. **Admin uniquement.**

**Réponse 200**
```json
[
  {
    "id": 1,
    "email": "admin@epitech.eu",
    "role_id": 1,
    "created_at": "2024-01-15 10:30:00"
  }
]
```

| Code | Cas |
|---|---|
| `200 OK` | Liste retournée |
| `403 Forbidden` | Utilisateur non admin |

---

#### `DELETE /api/users/{user_id}`

Supprime un utilisateur. **Admin uniquement.** Un admin ne peut pas se supprimer lui-même.

| Code | Cas |
|---|---|
| `204 No Content` | Suppression réussie |
| `400 Bad Request` | Tentative d'auto-suppression |
| `403 Forbidden` | Utilisateur non admin |
| `404 Not Found` | Utilisateur introuvable |

---

#### `PATCH /api/users/{user_id}/role`

Modifie le rôle d'un utilisateur. **Admin uniquement.**

**Corps**
```json
{ "role_id": 1 }
```

Les `role_id` valides sont `1` (admin) et `2` (user). Toute autre valeur retourne `400`.

| Code | Cas |
|---|---|
| `200 OK` | Rôle mis à jour → objet `UserAdminOut` |
| `400 Bad Request` | `role_id` invalide |
| `403 Forbidden` | Utilisateur non admin |
| `404 Not Found` | Utilisateur introuvable |

---

#### `GET /api/users/me/favorites`

Retourne les offres favorites de l'utilisateur connecté.

**Réponse 200**
```json
[
  {
    "id": 1,
    "title": "Développeur Python Senior",
    "location": "Paris, FR",
    "contract_type": "CDI",
    "min_salary": 45000,
    "max_salary": 65000,
    "currency": "EUR"
  }
]
```

---

#### `POST /api/users/me/favorites/{job_id}`

Ajoute une offre aux favoris.

| Code | Cas |
|---|---|
| `201 Created` | Ajout réussi |
| `404 Not Found` | Offre introuvable |
| `409 Conflict` | Offre déjà dans les favoris |

---

#### `DELETE /api/users/me/favorites/{job_id}`

Retire une offre des favoris.

| Code | Cas |
|---|---|
| `204 No Content` | Suppression réussie |
| `404 Not Found` | Favori introuvable |

---

## Headers de sécurité

Toutes les réponses incluent automatiquement ces headers (middleware HTTP) :

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

## Gestion des erreurs

Les erreurs non gérées retournent un message générique sans stack trace :

```json
{ "detail": "Une erreur interne est survenue." }
```

Les erreurs de validation Pydantic (422) retournent le détail des champs en cause.