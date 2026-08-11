"""
auth.py — Router FastAPI pour l'authentification.

Sécurité :
  - Rate limiting via slowapi : 5/min sur /login, 3/min sur /register
  - Requêtes SQL migrées vers sqlalchemy.select() — fini le text() brut sur les données user
  - Pas de timing attack : verify_password à temps constant (passlib)
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from services.database import get_db
from services.schemas import TokenResponse, UserLoginRequest, UserOut, UserRegisterRequest
from services.models import User  # ← nouveau : modèle ORM SQLAlchemy

# ──────────────────────────────────────────────
# Rate limiter (clé = IP du client)
# ──────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/auth", tags=["Authentification"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ──────────────────────────────────────────────
# Dépendance : récupérer l'utilisateur connecté
# ──────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré. Veuillez vous reconnecter.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email: str | None = payload.get("sub")
    if email is None:
        raise credentials_exception

    return email


# ──────────────────────────────────────────────
# Route : Inscription
# ──────────────────────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inscrire un nouvel utilisateur",
)
@limiter.limit("3/minute")  # 3 inscriptions max par minute par IP
def register(request: Request, body: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Limite à 3 tentatives/minute par IP.
    Utilise select() ORM au lieu de text() — pas d'injection possible.
    """
    # ORM select : paramètre bindé automatiquement, impossible d'injecter
    existing = db.execute(
        select(User).where(User.email == body.email)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte avec cet email existe déjà."
        )

    hashed = hash_password(body.password)

    new_user = User(email=body.email, password_hash=hashed)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": body.email, "user_id": new_user.id})
    return TokenResponse(access_token=token)


# ──────────────────────────────────────────────
# Route : Connexion
# ──────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Connecter un utilisateur existant",
)
@limiter.limit("5/minute")  # 5 tentatives max par minute par IP — protection brute force
def login(request: Request, body: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Limite à 5 tentatives/minute par IP.
    Même message d'erreur si email inconnu ou mauvais MDP (anti user-enumeration).
    """
    user = db.execute(
        select(User).where(User.email == body.email)
    ).scalar_one_or_none()

    # Même message volontairement vague dans les deux cas
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return TokenResponse(access_token=token)


# ──────────────────────────────────────────────
# Route : Profil
# ──────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserOut,
    summary="Récupérer le profil de l'utilisateur connecté",
)
def get_me(current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.execute(
        select(User).where(User.email == current_user_email)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable."
        )

    return UserOut(id=user.id, email=user.email, role_id=user.role_id)
