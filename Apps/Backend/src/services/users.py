"""
users.py — Router FastAPI pour la gestion des utilisateurs et des favoris.

Sécurité :
  - Toutes les requêtes text() remplacées par select() ORM
  - Paramètres bindés automatiquement → 0 risque d'injection SQL
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from services.auth import get_current_user
from services.database import get_db
from services.models import JobOffer, User, UserFavorite
from services.schemas import FavoriteJobOut, UserAdminOut, UserRoleUpdateRequest

router = APIRouter(prefix="/api/users", tags=["Utilisateurs"])


# ──────────────────────────────────────────────
# Dépendance admin
# ──────────────────────────────────────────────

def get_current_admin(
    current_user_email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.execute(
        select(User).where(User.email == current_user_email)
    ).scalar_one_or_none()

    if user is None or user.role_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )
    return current_user_email


# ──────────────────────────────────────────────
# Routes admin
# ──────────────────────────────────────────────

@router.get("", response_model=list[UserAdminOut])
def list_users(db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    users = db.execute(select(User).order_by(User.id.asc())).scalars().all()
    return [
        UserAdminOut(
            id=u.id,
            email=u.email,
            role_id=u.role_id,
            created_at=str(u.created_at) if u.created_at else None,
        )
        for u in users
    ]


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    target = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")

    admin = db.execute(select(User).where(User.email == _admin)).scalar_one_or_none()
    if admin and admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Vous ne pouvez pas supprimer votre propre compte.")

    db.delete(target)
    db.commit()


@router.patch("/{user_id}/role", response_model=UserAdminOut)
def update_user_role(
    user_id: int,
    body: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    _admin: str = Depends(get_current_admin),
):
    # Validation : role_id doit être 1 ou 2 — pas de valeur arbitraire
    if body.role_id not in (1, 2):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Le rôle id={body.role_id} n'existe pas.")

    target = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")

    target.role_id = body.role_id
    db.commit()
    db.refresh(target)

    return UserAdminOut(
        id=target.id,
        email=target.email,
        role_id=target.role_id,
        created_at=str(target.created_at) if target.created_at else None,
    )


# ──────────────────────────────────────────────
# Routes favoris
# ──────────────────────────────────────────────

@router.get("/me/favorites", response_model=list[FavoriteJobOut])
def list_favorites(current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == current_user_email)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")

    favs = db.execute(
        select(JobOffer)
        .join(UserFavorite, UserFavorite.job_offer_id == JobOffer.id)
        .where(UserFavorite.user_id == user.id)
        .order_by(JobOffer.posted_at.desc())
    ).scalars().all()

    return [
        FavoriteJobOut(
            id=j.id, title=j.title, location=j.location,
            contract_type=j.contract_type, min_salary=j.min_salary,
            max_salary=j.max_salary, currency=j.currency,
        )
        for j in favs
    ]


@router.post("/me/favorites/{job_id}", status_code=status.HTTP_201_CREATED)
def add_favorite(job_id: int, current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == current_user_email)).scalar_one_or_none()
    job = db.execute(select(JobOffer).where(JobOffer.id == job_id)).scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offre d'emploi introuvable.")

    existing = db.execute(
        select(UserFavorite).where(UserFavorite.user_id == user.id, UserFavorite.job_offer_id == job_id)
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Cette offre est déjà dans vos favoris.")

    db.add(UserFavorite(user_id=user.id, job_offer_id=job_id))
    db.commit()
    return {"message": "Offre ajoutée aux favoris."}


@router.delete("/me/favorites/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(job_id: int, current_user_email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == current_user_email)).scalar_one_or_none()

    fav = db.execute(
        select(UserFavorite).where(UserFavorite.user_id == user.id, UserFavorite.job_offer_id == job_id)
    ).scalar_one_or_none()

    if not fav:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ce favori n'existe pas.")

    db.delete(fav)
    db.commit()
