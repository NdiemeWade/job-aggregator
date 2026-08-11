# Sécurité

Ce document recense les menaces identifiées, les contrôles implémentés et les choix effectués.  
Format : **Why / How / What** tel que demandé dans le cahier des charges.

---

## 1. Gestion des secrets

**Why** - Les credentials (clé API, secret JWT, URL base de données) ne doivent jamais être commités dans le dépôt. Une fuite expose la base de production et permet de forger des tokens.

**How** - Toutes les valeurs sensibles sont chargées depuis des variables d'environnement via `python-dotenv`. Le fichier `.env` est dans `.gitignore`.

**What**
- `SECRET_KEY` : clé de signature JWT - doit être une chaîne longue et aléatoire en production.
- `DATABASE_URL` : URL de connexion PostgreSQL.
- `WELOVEDEVS_API_KEY` : clé API WeLoveDevs.
- Au démarrage, `main.py` vérifie que `SECRET_KEY` est définie et lève une `RuntimeError` si elle est absente, empêchant le serveur de démarrer sans configuration correcte.

**Evidence** : `Apps/Backend/src/main.py` lignes guard SECRET_KEY ; `docker-compose.yml` section `env_file: .env` ; `.gitignore` entrée `.env`.

**Trade-off** - `.env` sur le disque local reste risqué si le poste est compromis. En production, un gestionnaire de secrets (Vault, AWS SSM) serait préférable, mais dépasse le scope de ce projet.

---

## 2. Protection contre les injections SQL

**Why** - Une injection SQL permet à un attaquant de lire, modifier ou supprimer des données en base en manipulant les inputs utilisateur.

**How** - L'ensemble des requêtes base utilise **SQLAlchemy ORM avec `select()`**. Les paramètres sont bindés automatiquement par SQLAlchemy, jamais interpolés dans une string SQL. Les quelques `text()` restants dans `main.py` (sync jobs) utilisent des paramètres nommés (`:name`, `:email`, etc.) et non de la concaténation.

**What**
```python
# Paramètre bindé automatiquement - 0 injection possible
user = db.execute(
    select(User).where(User.email == body.email)
).scalar_one_or_none()

# text() avec paramètre nommé - safe
db.execute(text("SELECT id FROM companies WHERE name = :name"), {"name": company["name"]})

# Ce qui aurait été dangereux (jamais fait)
db.execute(text(f"SELECT * FROM users WHERE email = '{email}'"))
```

**Evidence** : `Apps/Backend/src/services/auth.py`, `users.py`, `models.py` - aucune concaténation de string dans les requêtes SQL.

**Trade-off** - Légèrement plus verbeux que du SQL brut, mais la sécurité et la maintenabilité l'emportent largement.

---

## 3. Mitigation des attaques brute-force

**Why** - Sans limitation, un attaquant peut tester des milliers de combinaisons email/mot de passe ou créer massivement de faux comptes.

**How** - **slowapi** applique un rate limiting par adresse IP sur les routes sensibles :
- `POST /api/auth/login` : **5 requêtes/minute** - protection brute-force sur les mots de passe.
- `POST /api/auth/register` : **3 requêtes/minute** - protection contre la création massive de comptes.

Au-delà de la limite, le serveur répond `429 Too Many Requests`.

**What**
```python
@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, body: UserLoginRequest, ...):
    ...
```

**Evidence** : `Apps/Backend/src/services/auth.py` décorateurs `@limiter.limit` ; `Apps/Backend/tests/test_api_jobs_security.py` classe `TestRateLimiting` - tests automatisés qui vérifient le déclenchement du 429.

**Trade-off** - Le rate limiting par IP peut pénaliser des utilisateurs légitimes derrière un NAT. Une approche par compte (après authentification) serait plus précise mais plus complexe à implémenter.

---

## 4. Sécurité des tokens JWT

**Why** - Les tokens JWT doivent être impossibles à forger et avoir une durée de vie limitée pour réduire la fenêtre d'exposition en cas de vol.

**How**
- Signature avec algorithme **HS256** via `python-jose`.
- Durée de vie configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (défaut : 7 jours).
- Le payload contient `sub` (email) et `exp` (expiration) - aucune donnée sensible dans le token.
- `decode_access_token()` retourne `None` sur tout token invalide ou expiré (JWTError capturée).

**What**
```python
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
```

Les routes protégées utilisent `OAuth2PasswordBearer` comme dépendance FastAPI - le token est extrait et vérifié avant chaque appel de handler.

**Evidence** : `Apps/Backend/src/services/security.py` ; `Apps/Backend/tests/test_api_auth.py` `TestGetMe::test_get_me_invalid_token`.

**Trade-off** - JWT stateless = impossible de révoquer un token avant son expiration. Une blacklist en Redis serait nécessaire en production pour gérer la déconnexion forcée.

---

## 5. Hachage des mots de passe

**Why** - Stocker des mots de passe en clair expose tous les utilisateurs en cas de fuite de la base.

**How** - **bcrypt** via `passlib.CryptContext`. bcrypt est résistant aux attaques brute-force grâce à son facteur de coût ajustable. Le sel est généré automatiquement et intégré dans le hash.

**What**
```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)  # temps constant
```

`verify_password` utilise une comparaison à **temps constant** (passlib) pour éviter les timing attacks.

**Evidence** : `Apps/Backend/src/services/security.py` ; colonne `password_hash` dans `models.py` - jamais de champ `password` en clair.

---

## 6. Contrôle d'accès côté serveur (RBAC)

**Why** - Les opérations d'administration (modération, gestion utilisateurs) ne doivent pas être accessibles aux utilisateurs standards, même avec un token valide.

**How** - Chaque route admin vérifie le `role_id` de l'utilisateur directement en base, pas seulement dans le token. Cela rend le contrôle d'accès robuste même si le token serait altéré.

**What**
```python
# Vérification admin - toujours en base, jamais uniquement dans le token
user = db.execute(select(User).where(User.email == current_user)).scalar_one_or_none()
if user is None or user.role_id != 1:
    raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")
```

Rôles valides : `1` = admin, `2` = user. Toute tentative d'assigner un `role_id` hors de ces valeurs retourne `400`.

**Evidence** : `Apps/Backend/src/main.py` route `PATCH /api/jobs/{job_id}/moderate` ; `Apps/Backend/src/services/users.py` `get_current_admin()` ; `test_api_jobs_security.py` `TestJobModeration`.

---

## 7. Anti user-enumeration

**Why** - Retourner un message d'erreur différent selon que l'email existe ou non permet à un attaquant d'identifier les comptes valides.

**How** - La route `/api/auth/login` retourne systématiquement `401 "Email ou mot de passe incorrect."`, que l'email soit inconnu ou que le mot de passe soit faux.

**Evidence** : `Apps/Backend/src/services/auth.py` commentaire `# Même message volontairement vague dans les deux cas`.

---

## 8. Headers de sécurité HTTP

**Why** - Les headers HTTP permettent d'indiquer au navigateur des politiques de sécurité supplémentaires (anti-clickjacking, anti-MIME-sniffing, XSS basique).

**How** - Un middleware FastAPI injecte ces headers sur toutes les réponses :

```python
response.headers["X-Content-Type-Options"] = "nosniff"
response.headers["X-Frame-Options"] = "DENY"
response.headers["X-XSS-Protection"] = "1; mode=block"
response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
```

**Evidence** : `Apps/Backend/src/main.py` middleware `add_security_headers`.

---

## 9. Gestion centralisée des erreurs

**Why** - Les stack traces exposées en réponse d'erreur révèlent la structure interne de l'application à un attaquant.

**How** - Un handler global `@app.exception_handler(Exception)` capture toutes les erreurs non gérées et retourne un message générique sans détail technique.

```python
return JSONResponse(
    status_code=500,
    content={"detail": "Une erreur interne est survenue."},
)
```

**Evidence** : `Apps/Backend/src/main.py` `global_exception_handler`.

---

## Récapitulatif des menaces adressées

| Menace | Contrôle | Statut |
|---|---|---|
| Fuite de credentials | Variables d'environnement + guard au démarrage |
| Injection SQL | ORM SQLAlchemy + paramètres bindés |
| Brute-force mots de passe | Rate limiting slowapi (5/min) |
| Création massive de comptes | Rate limiting slowapi (3/min) |
| Vol de token | JWT signé HS256 + expiration |
| Mots de passe en clair | bcrypt + sel automatique |
| Escalade de privilèges | RBAC vérifié en base sur chaque route admin |
| User enumeration | Message d'erreur identique login/email inexistant |
| Clickjacking / XSS | Headers sécurité HTTP (middleware) |
| Stack trace exposée | Handler d'erreur global générique |