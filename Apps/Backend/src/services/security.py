"""
security.py — Utilitaires de sécurité centralisés.

Responsabilités :
  - Hachage et vérification des mots de passe (bcrypt via passlib)
  - Génération et décodage des tokens JWT (python-jose)

Ce fichier ne contient aucune logique métier ni accès à la DB.
Il est importé par auth.py et main.py.
"""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

# Charge les variables d'environnement (.env) dès l'import du module
load_dotenv()

# ──────────────────────────────────────────────
# Configuration JWT (à définir dans .env)
# ──────────────────────────────────────────────

# Clé secrète utilisée pour signer les tokens — NE JAMAIS la hardcoder
SECRET_KEY: str = os.getenv("SECRET_KEY", "change_me_in_production")

# Algorithme de signature — HS256 est standard pour les JWT internes
ALGORITHM: str = "HS256"

# Durée de vie d'un token en minutes (ici 7 jours)
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7))

# ──────────────────────────────────────────────
# Contexte bcrypt pour le hachage des mots de passe
# ──────────────────────────────────────────────

# CryptContext configure passlib pour utiliser bcrypt.
# bcrypt est résistant aux attaques brute-force grâce à son coût de calcul ajustable.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Hache un mot de passe en clair avec bcrypt.

    Le sel (salt) est généré automatiquement et intégré dans le hash —
    il n'a pas besoin d'être stocké séparément.

    Args:
        plain_password: Le mot de passe en clair saisi par l'utilisateur.

    Returns:
        Une chaîne bcrypt hashée, prête à être stockée en base de données.
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare un mot de passe en clair avec son hash bcrypt stocké.

    Utilise une comparaison à temps constant pour éviter les timing attacks.

    Args:
        plain_password:  Le mot de passe saisi lors de la connexion.
        hashed_password: Le hash bcrypt récupéré depuis la base de données.

    Returns:
        True si le mot de passe correspond au hash, False sinon.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """
    Génère un token JWT signé avec les données fournies.

    Le token contient :
      - les données passées en argument (ex: {"sub": user_email})
      - une date d'expiration ("exp") calculée automatiquement

    Args:
        data: Dictionnaire des claims à encoder dans le token.
              Convention JWT : "sub" (subject) = identifiant de l'utilisateur.

    Returns:
        Une chaîne JWT encodée et signée avec SECRET_KEY.
    """
    # Copie pour ne pas muter le dict original
    to_encode = data.copy()

    # Calcul de la date d'expiration à partir de maintenant (UTC)
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire

    # Encodage et signature du token
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Décode et vérifie un token JWT.

    Vérifie automatiquement :
      - La signature (intégrité du token)
      - La date d'expiration ("exp")

    Args:
        token: La chaîne JWT reçue dans l'en-tête Authorization.

    Returns:
        Le dictionnaire des claims si le token est valide,
        None si le token est invalide ou expiré.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        # Token invalide, expiré, ou signature corrompue
        return None
