"""
main.py — Point d'entrée de l'API FastAPI.

Responsabilités :
  - Initialise l'application et ses middlewares (CORS)
  - Déclare la connexion à la base de données (SQLAlchemy)
  - Branche les routers (jobs, auth, users)
  - Expose les routes publiques (/health) et protégées (/api/jobs)
"""

import os
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import select, text, func
from sqlalchemy.orm import Session, joinedload
from typing import Optional

# Import de la configuration DB centralisée
from services.database import get_db

# Import des services métiers
from services.Collector import Collector
from services.Standardizer import JobStandardizer

# Import du router d'authentification
from services.auth import router as auth_router

# Import du router utilisateurs/admin/favoris
from services.users import router as users_router

# Import de la dépendance de protection des routes
from services.auth import get_current_user

# Import des modèles ORM
from services.models import JobOffer, JobOfferSkill


# ──────────────────────────────────────────────
# Guard SECRET_KEY — refuse de démarrer si absente
# ──────────────────────────────────────────────

if not os.getenv("SECRET_KEY"):
    raise RuntimeError(
        "SECRET_KEY est absent des variables d'environnement. "
    )

# ──────────────────────────────────────────────
# Initialisation de l'application FastAPI
# ──────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Job Aggregator API")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware CORS — autorise les requêtes depuis le frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Branchement du router d'authentification préfixées par /api/auth
app.include_router(auth_router)

# Branchement du router utilisateurs/admin/favoris préfixées par /api/users
app.include_router(users_router)

# ──────────────────────────────────────────────
# Middleware — headers de sécurité HTTP
# ──────────────────────────────────────────────

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Injecte les headers de sécurité sur toutes les réponses.
    Protège contre clickjacking, MIME sniffing, XSS basique.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ──────────────────────────────────────────────
# Handler global d'erreurs 500
# ──────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Attrape toutes les erreurs non gérées.
    Retourne un message générique — pas de stack trace exposée en prod.
    """
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur interne est survenue."},
    )

# ──────────────────────────────────────────────
# Routes publiques
# ──────────────────────────────────────────────

@app.get("/")
def root():
    """Point de santé minimal — vérifie que l'API répond."""
    return {"message": "API is running. Go to /docs for Swagger UI"}

# ──────────────────────────────────────────────
# Routes protégées (nécessitent un token JWT)
# ──────────────────────────────────────────────

@app.get("/api/jobs")
def read_jobs(
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user),
    # ── Paramètres de pagination et filtrage ──
    page: int = 1,
    size: int = 12,
    title: Optional[str] = None,
    location: Optional[str] = None,
    contract_type: Optional[str] = None,
    rythm: Optional[str] = None,
    min_salary: Optional[int] = None,
    profession: Optional[str] = None,
):
    """
    Retourne les offres d'emploi avec filtres optionnels et pagination.

    Query params disponibles :
      - page          : numéro de la page (défaut: 1)
      - size          : nombre d'éléments par page (défaut: 12)
      - title         : recherche partielle sur le titre (insensible à la casse)
      - location      : recherche partielle sur la localisation
      - contract_type : CDI, CDD, Stage, Alternance, Freelance
      - rythm         : Sur site, Full remote, Télétravail hybride
      - min_salary    : salaire minimum souhaité
      - profession    : recherche partielle sur la profession

    Route protégée : token JWT requis.
    """
    # OPTIMISATION : On charge l'entreprise et les skills directement dans la requête
    query = select(JobOffer).options(
        joinedload(JobOffer.company),
        joinedload(JobOffer.skills).joinedload(JobOfferSkill.skill)
    ).order_by(JobOffer.posted_at.desc())

    if title:
        query = query.where(JobOffer.title.ilike(f"%{title}%"))
    if location:
        query = query.where(JobOffer.location.ilike(f"%{location}%"))
    if contract_type:
        query = query.where(JobOffer.contract_type == contract_type)
    if rythm:
        query = query.where(JobOffer.rythm == rythm)
    if min_salary is not None:
        query = query.where(JobOffer.max_salary >= min_salary)
    if profession:
        query = query.where(JobOffer.profession.ilike(f"%{profession}%"))

    # Compter le total AVANT de paginer pour informer le frontend
    total_query = select(func.count()).select_from(query.subquery())
    total_jobs = db.execute(total_query).scalar()

    # Appliquer la pagination (offset et limit)
    query = query.offset((page - 1) * size).limit(size)
    jobs = db.execute(query).unique().scalars().all()

    # Retourner la structure paginée
    return {
        "total": total_jobs,
        "items": [
            {
                "id": j.id,
                "external_id": j.external_id,
                "title": j.title,
                "description": j.description,
                "company_name": j.company.name if j.company else "Inconnue",
                "company_logo_url": j.company.logo_url if j.company else None,
                "skills": [{"name": link.skill.name, "relevance": link.relevance} for link in j.skills] if j.skills else [],
                "location": j.location,
                "contract_type": j.contract_type,
                "min_salary": j.min_salary,
                "max_salary": j.max_salary,
                "currency": j.currency,
                "posted_at": j.posted_at,
                "rythm": j.rythm,
                "required_experience": j.required_experience,
                "profession": j.profession,
                "source": j.source,
                "is_moderated": j.is_moderated,
            }
            for j in jobs
        ]
    }

# ──────────────────────────────────────────────
# Route admin — modération des offres
# ──────────────────────────────────────────────

@app.patch("/api/jobs/{job_id}/moderate")
def moderate_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    """
    Bascule is_moderated sur une offre (True/False).
    Route protégée : réservée aux admins (role_id = 1).
    Utilisée par l'interface admin pour valider ou masquer une offre.
    """
    from services.models import User

    # Vérification que l'utilisateur est admin
    user = db.execute(
        select(User).where(User.email == current_user)
    ).scalar_one_or_none()

    if user is None or user.role_id != 1:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs.")

    job = db.execute(
        select(JobOffer).where(JobOffer.id == job_id)
    ).scalar_one_or_none()

    if job is None:
        raise HTTPException(status_code=404, detail="Offre introuvable.")

    job.is_moderated = not job.is_moderated
    db.commit()
    db.refresh(job)

    return {
        "id": job.id,
        "title": job.title,
        "is_moderated": job.is_moderated,
    }

@app.post("/api/jobs/sync")
def sync_welovedevs_jobs(
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user)  # Protection JWT — seul un user connecté peut lancer la sync
):
    """
    Déclenche manuellement la collecte et la standardisation des offres WeLoveDevs.
    Route protégée : réservée aux utilisateurs authentifiés.
    """
    collector = Collector()
    standardizer = JobStandardizer()

    # Collecte des données brutes depuis l'API WeLoveDevs
    raw_jobs = collector.collect_jobs()
    if not raw_jobs:
        raise HTTPException(status_code=500, detail="Échec de la récupération depuis l'API")

    inserted_count = 0

    # Boucle sur chaque job : standardise puis insère en db
    for raw_job in raw_jobs:
        try:
            standardized_data = standardizer.standardize(raw_job)
            job = standardized_data["job_offer"]
            company = standardized_data["company"]
            skills = standardized_data.get("skills", [])

            # Insertion de l'entreprise (ignore le doublon si elle existe déjà)
            insert_company_query = text("""
                INSERT INTO companies (name, website_url)
                VALUES (:name, :website_url)
                ON CONFLICT (name) DO NOTHING RETURNING id
            """)
            result = db.execute(insert_company_query, {"name": company["name"], "website_url": company["website_url"]})
            company_record = result.fetchone()
            company_id = company_record[0] if company_record else db.execute(
                text("SELECT id FROM companies WHERE name = :name"),
                {"name": company["name"]}
            ).scalar()

            # Insertion de l'offre d'emploi (ignore le doublon via external_id)
            job_query = text("""
                INSERT INTO job_offers (
                    external_id, title, description, company_id, location, contract_type,
                    source, min_salary, max_salary, currency, posted_at, rythm,
                    required_experience, profession
                )
                VALUES (
                    :ext_id, :title, :desc, :comp_id, :loc, :contract,
                    :source, :min_sal, :max_sal, :currency, :posted_at, :rythm,
                    :req_exp, :profession
                )
                ON CONFLICT (external_id) DO NOTHING
            """)
            db.execute(job_query, {
                "ext_id": job["external_id"], "title": job["title"], "desc": job["description"],
                "comp_id": company_id, "loc": job["location"], "contract": job["contract_type"],
                "source": job["source"], "min_sal": job["min_salary"], "max_sal": job["max_salary"],
                "currency": job["currency"], "posted_at": job["posted_at"], "rythm": job["rythm"],
                "req_exp": job["required_experience"], "profession": job["profession"]
            })

            # Récupération de l'ID du job pour lier les compétences
            job_id = db.execute(
                text("SELECT id FROM job_offers WHERE external_id = :ext_id"),
                {"ext_id": job["external_id"]}
            ).scalar()

            # Insertion des compétences et liaison avec le job
            if job_id and skills:
                for skill in skills:
                    # Insère la compétence si elle n'existe pas encore
                    skill_query = text("""
                        INSERT INTO skills (name) VALUES (:name)
                        ON CONFLICT (name) DO NOTHING RETURNING id
                    """)
                    s_result = db.execute(skill_query, {"name": skill["name"]})
                    s_record = s_result.fetchone()
                    skill_id = s_record[0] if s_record else db.execute(
                        text("SELECT id FROM skills WHERE name = :name"),
                        {"name": skill["name"]}
                    ).scalar()

                    # Lie la compétence au job avec son score de pertinence
                    link_query = text("""
                        INSERT INTO job_offer_skills (job_offer_id, skill_id, relevance)
                        VALUES (:j_id, :s_id, :rel)
                        ON CONFLICT (job_offer_id, skill_id) DO NOTHING
                    """)
                    db.execute(link_query, {"j_id": job_id, "s_id": skill_id, "rel": skill["relevance"]})

            db.commit()
            inserted_count += 1

        except Exception as e:
            db.rollback()
            print(f"Erreur sur le job {raw_job.get('id', 'inconnu')} : {e}")
            continue

    return {
        "status": "success",
        "message": "Synchronisation terminée",
        "jobs_traites": inserted_count
    }