"""
database.py — Configuration et session SQLAlchemy.

Responsabilités :
  - Crée le moteur de connexion PostgreSQL (engine)
  - Expose SessionLocal (factory de sessions)
  - Fournit la dépendance get_db() injectable dans toutes les routes

Ce module est importé à la fois par main.py et auth.py,
évitant tout import circulaire entre les deux.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Charge les variables d'environnement (.env)
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Crée le moteur SQLAlchemy — point de connexion unique à PostgreSQL
engine = create_engine(DATABASE_URL)

# SessionLocal est une "factory" : chaque appel crée une nouvelle session DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """
    Dépendance FastAPI qui fournit une session DB à chaque requête.

    Utilise un générateur (yield) pour garantir que la session est
    toujours fermée après la requête, même en cas d'exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
