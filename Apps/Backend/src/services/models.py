"""
models.py — Modèles ORM SQLAlchemy.

Pourquoi ce fichier ?
  - Remplace les requêtes text() brutes par des objets Python typés
  - SQLAlchemy génère des requêtes paramétrées automatiquement → 0 risque d'injection SQL
  - Donne accès à select(), insert via db.add(), etc.
"""

from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    favorites = relationship("UserFavorite", back_populates="user", cascade="all, delete")


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    logo_url = Column(Text, nullable=True)
    website_url = Column(Text, nullable=True)

    job_offers = relationship("JobOffer", back_populates="company", cascade="all, delete")


class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(255), unique=True, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    location = Column(String(255), nullable=False)
    contract_type = Column(String(100), nullable=True)
    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    currency = Column(String(10), default="EUR")
    posted_at = Column(DateTime, nullable=True)
    rythm = Column(String(255), default="Sur site")
    required_experience = Column(Integer, nullable=True)
    profession = Column(String(100), nullable=True)
    source = Column(String(50), default="welovedevs")
    is_moderated = Column(Boolean, default=False)
    ai_summary = Column(Text, nullable=True)
    relevance_score = Column(Float, nullable=True)
    normalized_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="job_offers")
    skills = relationship("JobOfferSkill", back_populates="job_offer", cascade="all, delete")
    favorited_by = relationship("UserFavorite", back_populates="job_offer", cascade="all, delete")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)

    job_offers = relationship("JobOfferSkill", back_populates="skill")


class JobOfferSkill(Base):
    __tablename__ = "job_offer_skills"

    job_offer_id = Column(Integer, ForeignKey("job_offers.id", ondelete="CASCADE"), primary_key=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
    relevance = Column(Float, nullable=True)

    job_offer = relationship("JobOffer", back_populates="skills")
    skill = relationship("Skill", back_populates="job_offers")


class UserFavorite(Base):
    __tablename__ = "user_favorite"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    job_offer_id = Column(Integer, ForeignKey("job_offers.id", ondelete="CASCADE"), primary_key=True)

    user = relationship("User", back_populates="favorites")
    job_offer = relationship("JobOffer", back_populates="favorited_by")
