"""
schemas.py — Modèles de validation des données (Pydantic).

Responsabilités :
  - Définir la structure exacte des corps de requêtes (Register, Login)
  - Définir la structure des réponses renvoyées au client (Token, UserOut)
  - Valider automatiquement les types et contraintes (email, longueur)

Ces schémas sont indépendants de la DB — ils décrivent uniquement
ce qui transite par l'API (entrée et sortie), pas le modèle de stockage.
"""

from pydantic import BaseModel, EmailStr, Field


# ──────────────────────────────────────────────
# Requêtes entrantes (corps des requêtes POST)
# ──────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    """
    Corps attendu pour la route POST /api/auth/register.

    Pydantic valide automatiquement :
      - que l'email est bien formé (via EmailStr)
      - que le mot de passe fait au moins 8 caractères
    """

    email: EmailStr = Field(
        ...,
        description="Adresse email de l'utilisateur (doit être unique).",
        examples=["jean.dupont@epitech.eu"]
    )
    password: str = Field(
        ...,
        min_length=8,
        description="Mot de passe en clair — sera haché côté serveur avant stockage.",
        examples=["MonMotDePasse123"]
    )


class UserLoginRequest(BaseModel):
    """
    Corps attendu pour la route POST /api/auth/login.

    On accepte les mêmes champs que pour l'inscription,
    mais ici on ne revalide pas la longueur du mot de passe
    (l'utilisateur peut avoir un ancien compte avec un MDP court).
    """

    email: EmailStr = Field(
        ...,
        description="Adresse email de l'utilisateur.",
        examples=["jean.dupont@epitech.eu"]
    )
    password: str = Field(
        ...,
        description="Mot de passe en clair à vérifier contre le hash en base.",
        examples=["MonMotDePasse123"]
    )


# ──────────────────────────────────────────────
# Réponses sortantes (corps des réponses JSON)
# ──────────────────────────────────────────────

class TokenResponse(BaseModel):
    """
    Réponse renvoyée après un login ou register réussi.

    Le client doit stocker ce token et l'envoyer dans chaque requête
    protégée via l'en-tête : Authorization: Bearer <access_token>
    """

    access_token: str = Field(
        ...,
        description="Token JWT signé, à envoyer dans l'en-tête Authorization."
    )
    token_type: str = Field(
        default="bearer",
        description="Type de token — toujours 'bearer' pour OAuth2/JWT."
    )


class UserOut(BaseModel):
    """
    Représentation publique d'un utilisateur (sans mot de passe ni hash).

    Utilisée pour la route GET /api/auth/me qui retourne le profil
    de l'utilisateur connecté.
    """

    id: int = Field(..., description="Identifiant unique en base de données.")
    email: EmailStr = Field(..., description="Adresse email de l'utilisateur.")
    role_id: int | None = Field(
        default=None,
        description="ID du rôle associé (ex: 1=admin, 2=user). Peut être null."
    )

# ──────────────────────────────────────────────
# Rôles
# ──────────────────────────────────────────────


class RoleOut(BaseModel):
    """Représentation d'un rôle."""
    id: int = Field(..., description="Identifiant du rôle.")
    name: str = Field(..., description="Nom du rôle (ex: admin, user).")


# ──────────────────────────────────────────────
# Gestion des utilisateurs (admin)
# ──────────────────────────────────────────────

class UserAdminOut(BaseModel):
    """
    Vue admin d'un utilisateur — inclut created_at.
    Utilisée pour la liste complète des users (GET /api/users).
    """
    id: int = Field(..., description="Identifiant unique.")
    email: EmailStr = Field(..., description="Adresse email.")
    role_id: int | None = Field(default=None, description="ID du rôle associé.")
    created_at: str | None = Field(default=None, description="Date de création du compte.")


class UserRoleUpdateRequest(BaseModel):
    """Corps attendu pour PATCH /api/users/{id}/role."""
    role_id: int = Field(..., description="Nouvel ID de rôle à assigner (1=admin, 2=user).")


# ──────────────────────────────────────────────
# Favoris
# ──────────────────────────────────────────────

class FavoriteJobOut(BaseModel):
    """
    Offre d'emploi dans la liste des favoris d'un utilisateur.
    Retourne les champs essentiels pour affichage dans le dashboard.
    """
    id: int = Field(..., description="ID de l'offre en base.")
    title: str = Field(..., description="Intitulé du poste.")
    location: str = Field(..., description="Localisation.")
    contract_type: str | None = Field(default=None, description="Type de contrat.")
    min_salary: int | None = Field(default=None, description="Salaire minimum.")
    max_salary: int | None = Field(default=None, description="Salaire maximum.")
    currency: str | None = Field(default=None, description="Devise.")
