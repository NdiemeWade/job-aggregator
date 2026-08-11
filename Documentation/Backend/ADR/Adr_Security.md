# ADR - Sécurité : choix des contrôles et menaces adressées

**Date** : 2024  
**Statut** : Accepté  
**Contexte** : Choix des mécanismes de sécurité pour l'API REST, la gestion des identités et la protection des données.

---

## Contexte

Une plateforme d'agrégation d'offres d'emploi expose des données utilisateur (emails, mots de passe, favoris) et des routes d'administration. Le cahier des charges impose explicitement :

- Gestion des secrets
- Protection contre les injections (au moins un type démontré)
- Mitigation des attaques brute-force
- Sécurité des routes / sessions / tokens
- Flux d'authentification sécurisé
- Données protégées en transit et au repos

---

## Décisions et justifications

### ADR-005-A : Hachage des mots de passe - bcrypt via passlib

**Why** - Les mots de passe ne doivent jamais être stockés en clair ni avec un algorithme réversible (MD5, SHA1). En cas de fuite de la base, les utilisateurs doivent rester protégés.

**How** - `passlib.CryptContext(schemes=["bcrypt"])` génère un hash bcrypt avec sel automatique intégré. La vérification utilise une comparaison à **temps constant** pour éliminer les timing attacks.

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hash_password("MonMdp")    # → "$2b$12$..."
verify_password("MonMdp", hash)  # → True/False en temps constant
```

**Trade-off** - bcrypt est intentionnellement lent (coût de calcul ajustable). À ~100ms par vérification sur serveur modeste, c'est négligeable pour un utilisateur mais coûteux pour un attaquant qui teste en masse. Argon2id serait légèrement plus moderne, mais bcrypt reste la recommandation standard et est mieux supporté par passlib.

**Alternative rejetée : SHA-256 + sel manuel** - SHA-256 est trop rapide (~ns par hash) : un attaquant peut tester des milliards de combinaisons par seconde avec un GPU, même avec un sel. bcrypt est conçu spécifiquement pour résister à cela.

**Evidence** : `Apps/Backend/src/services/security.py` `hash_password()` et `verify_password()`.

---

### ADR-005-B : Authentification JWT - python-jose + HS256

**Why** - L'API doit être stateless : le serveur ne doit pas stocker les sessions. JWT permet de porter l'identité de l'utilisateur dans le token lui-même, signé et vérifiable sans base de données.

**How**
- Signature HMAC-SHA256 (HS256) avec `SECRET_KEY` chargée depuis les variables d'environnement.
- Payload minimal : `{ "sub": email, "user_id": id, "exp": timestamp }` - aucune donnée sensible dedans.
- Expiration configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (défaut : 7 jours).
- Décodage via `jwt.decode()` qui vérifie automatiquement la signature et l'expiration.

**Trade-off** - HS256 (symétrique) suffit pour une architecture à service unique où le même serveur signe et vérifie. RS256 (asymétrique) serait nécessaire si plusieurs services indépendants devaient vérifier les tokens. Pour ce projet monolithique, HS256 est approprié et plus simple.

**Limitation connue** - JWT stateless = impossible de révoquer un token avant expiration. Si un utilisateur change de mot de passe ou est banni, son token reste valide jusqu'à expiration. Une blacklist Redis corrigerait cela en production.

**Evidence** : `Apps/Backend/src/services/security.py` `create_access_token()` et `decode_access_token()`.

---

### ADR-005-C : Rate limiting - slowapi par IP

**Why** - Sans limitation de débit, un attaquant peut :
- Tester des millions de mots de passe sur `/login` (brute-force)
- Créer massivement de faux comptes via `/register` (spam)

**How** - `slowapi.Limiter` avec `key_func=get_remote_address` compte les requêtes par adresse IP :

| Route | Limite | Raison |
|---|---|---|
| `POST /api/auth/login` | 5 req/min | Protection brute-force mots de passe |
| `POST /api/auth/register` | 3 req/min | Protection création massive de comptes |

Dépassement → `429 Too Many Requests`.

**Trade-off** - Le rate limiting par IP peut pénaliser des utilisateurs légitimes derrière un NAT partagé (bureau, campus). Une limite par compte serait plus précise post-authentification, mais `/login` est justement la route pré-authentification. L'impact est acceptable pour un contexte Epitech.

**Alternative rejetée : fail2ban niveau infra** - Nécessiterait un accès à l'infrastructure hôte et une configuration réseau, incompatible avec l'approche Docker self-contained du projet.

**Evidence** : `Apps/Backend/src/services/auth.py` décorateurs `@limiter.limit` ; `Apps/Backend/tests/test_api_jobs_security.py` `TestRateLimiting` - tests automatisés vérifiant le 429.

---

### ADR-005-D : Protection injection SQL - SQLAlchemy ORM

**Why** - L'injection SQL est la vulnérabilité OWASP #3. Elle permet de lire ou altérer n'importe quelle table si les paramètres utilisateur sont interpolés directement dans une requête.

**How** - Migration complète de `text()` brut vers `select(Model).where(Model.champ == valeur)`. SQLAlchemy paramètre toutes les valeurs automatiquement via des placeholders préparés.

```python
# Sûr - paramètre bindé par l'ORM
select(User).where(User.email == body.email)

# Sûr - paramètre nommé dans text()
text("SELECT id FROM companies WHERE name = :name"), {"name": company["name"]}

# Dangereux - jamais fait dans ce projet
text(f"SELECT * FROM users WHERE email = '{email}'")
```

**Trade-off** - L'ORM génère parfois des requêtes légèrement moins optimales qu'un SQL natif finement ajusté. Pour les volumes de ce projet, la différence est imperceptible. La sécurité prime.

**Evidence** : `Apps/Backend/src/services/auth.py`, `users.py`, `models.py` - aucune concaténation de chaîne dans les requêtes SQL.

---

### ADR-005-E : Contrôle d'accès serveur (RBAC)

**Why** - Les routes d'administration ne doivent pas être accessibles aux utilisateurs standards, même avec un token valide. Le contrôle doit être vérifié côté serveur à chaque requête, pas uniquement stocké dans le token (qui pourrait être altéré ou réutilisé).

**How** - Chaque route admin vérifie `user.role_id == 1` en interrogeant la base de données en temps réel. Le token sert uniquement à identifier l'utilisateur (via son email) ; la vérification du rôle se fait toujours en base.

```python
user = db.execute(select(User).where(User.email == current_user)).scalar_one_or_none()
if user is None or user.role_id != 1:
    raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
```

Rôles valides : `1` (admin), `2` (user). Toute valeur hors de `{1, 2}` est rejetée avec `400`.

**Trade-off** - Une requête DB supplémentaire par appel admin. Acceptable pour la fréquence d'utilisation des routes admin ; une mise en cache (Redis) serait envisageable à l'échelle.

**Evidence** : `Apps/Backend/src/main.py` `PATCH /api/jobs/{id}/moderate` ; `Apps/Backend/src/services/users.py` `get_current_admin()` ; `test_api_jobs_security.py` `TestJobModeration::test_user_cannot_moderate`.

---

### ADR-005-F : Anti user-enumeration

**Why** - Si la route `/login` retourne "email inconnu" vs "mot de passe incorrect", un attaquant peut énumérer les comptes valides de la plateforme.

**How** - Message d'erreur identique dans les deux cas : `"Email ou mot de passe incorrect."` avec `401 Unauthorized`.

**Evidence** : `Apps/Backend/src/services/auth.py` commentaire explicite + logique de code.

---

### ADR-005-G : Headers de sécurité HTTP

**Why** - Les navigateurs supportent des directives HTTP qui réduisent la surface d'attaque côté client (clickjacking, MIME sniffing, XSS réfléchi).

**How** - Middleware FastAPI injecté sur **toutes** les réponses :

| Header | Valeur | Protection |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Anti-MIME sniffing |
| `X-Frame-Options` | `DENY` | Anti-clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Anti-XSS basique (navigateurs legacy) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limitation fuite d'URL |

**Trade-off** - `X-XSS-Protection` est déprécié dans les navigateurs modernes au profit de CSP (Content Security Policy). Une CSP complète est plus puissante mais nécessite une configuration fine selon les assets frontend. À ajouter en phase suivante.

**Evidence** : `Apps/Backend/src/main.py` middleware `add_security_headers`.

---

### ADR-005-H : Handler d'erreur global - pas de stack trace exposée

**Why** - Les stack traces en production révèlent la structure interne de l'application, les chemins de fichiers, les versions de bibliothèques - autant d'informations exploitables par un attaquant.

**How** - `@app.exception_handler(Exception)` capture toutes les exceptions non gérées et retourne un message générique :

```json
{ "detail": "Une erreur interne est survenue." }
```

Les erreurs sont loggées côté serveur (via `print`) pour le débogage interne sans être exposées au client.

**Evidence** : `Apps/Backend/src/main.py` `global_exception_handler`.

---

## Récapitulatif des menaces vs contrôles

| Menace (OWASP / générique) | Contrôle implémenté | ADR ref |
|---|---|---|
| Fuite de credentials | Variables d'environnement + guard démarrage | ADR-005 intro |
| Passwords en clair | bcrypt + sel automatique | ADR-005-A |
| Token forgeable | JWT signé HS256 + expiration | ADR-005-B |
| Brute-force login | Rate limit 5/min par IP | ADR-005-C |
| Création massive comptes | Rate limit 3/min par IP | ADR-005-C |
| Injection SQL | ORM SQLAlchemy + paramètres bindés | ADR-005-D |
| Escalade de privilèges | RBAC vérifié en base à chaque requête | ADR-005-E |
| User enumeration | Message d'erreur identique login | ADR-005-F |
| Clickjacking / MIME sniffing | Headers sécurité HTTP (middleware) | ADR-005-G |
| Stack trace exposée | Handler d'erreur global générique | ADR-005-H |
| Timing attack sur hash | `verify_password` à temps constant (passlib) | ADR-005-A |