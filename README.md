# Gateway — Job Aggregator

> Plateforme full-stack de recherche d'emploi et de stages intégrant un système de classification automatique des offres par intelligence artificielle.

## Présentation

**Gateway** est une plateforme de recherche d'emploi et de stages développée dans le cadre du **Bachelor Informatique à Epitech Nancy**.

L'objectif du projet est de centraliser et de standardiser des offres provenant de l'API **WeLoveDevs**, de les stocker dans une base de données PostgreSQL et de permettre leur consultation depuis une application web.

Le projet a été réalisé en **un mois par une équipe de quatre personnes : Ndiémé, Noémy, Matthias et Luke**.

Ce projet nous a permis de mettre en pratique des compétences en développement frontend et backend, API, bases de données, programmation orientée objet, intelligence artificielle, tests, Docker et intégration continue.

---

## Fonctionnalités

### Recherche et gestion des offres

- Récupération des offres depuis l'API WeLoveDevs
- Collecte paginée des données
- Normalisation des offres
- Stockage des données dans PostgreSQL
- Consultation des offres depuis l'application web

### Authentification

- Création de compte
- Connexion
- Authentification avec JWT
- Gestion des utilisateurs
- Gestion des accès aux ressources

### Classification intelligente

Gateway intègre un système de Machine Learning permettant d'analyser automatiquement le contenu d'une offre et de prédire sa catégorie.

| Offre | Catégorie prédite |
|---|---|
| React Developer | Frontend |
| Django API Developer | Backend |
| Machine Learning Engineer | Data |

---

# Architecture

```text
                         WeLoveDevs API
                               │
                               ▼
                      ┌─────────────────┐
                      │     FastAPI     │
                      │     Backend     │
                      └────────┬────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
        ┌────────────────┐          ┌────────────────┐
        │   PostgreSQL   │          │   Système IA   │
        │    Database    │          │    NLP / ML    │
        └────────────────┘          └───────┬────────┘
                                            │
                                            ▼
                                      Classification
                                            │
                                            ▼
                                  ┌─────────────────┐
                                  │    Frontend     │
                                  │ React + Vite +  │
                                  │    TypeScript   │
                                  └─────────────────┘
```

---

# Technologies utilisées

| Domaine | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| API externe | WeLoveDevs API |
| Base de données | PostgreSQL |
| Authentification | JWT |
| IA / NLP | Python, scikit-learn, spaCy |
| Machine Learning | TF-IDF, Multinomial Naive Bayes |
| Tests | pytest |
| Conteneurisation | Docker, Docker Compose |
| CI | GitHub Actions |
| Versionnement | Git, GitHub |

---

# Intelligence artificielle

Le projet intègre un système de classification automatique des offres basé sur le traitement du langage naturel et le Machine Learning.

## Pipeline

```text
Offre d'emploi
      │
      ▼
Prétraitement du texte
      │
      ▼
TF-IDF
      │
      ▼
Représentation numérique
      │
      ▼
Multinomial Naive Bayes
      │
      ▼
Catégorie prédite
```

### Dataset

Le modèle est entraîné à partir d'un dataset contenant des exemples d'offres associés à leurs catégories.

```csv
text,category
React developer,frontend
Vue.js frontend engineer,frontend
Django API developer,backend
FastAPI backend engineer,backend
Machine learning with pandas,data
Data scientist Python,data
```

### Modèle

Le pipeline utilise notamment :

- **spaCy** pour le traitement du texte
- **TF-IDF** pour transformer les textes en représentations numériques
- **Multinomial Naive Bayes** pour la classification

Le modèle entraîné est sauvegardé afin d'être réutilisé lors des prédictions sans devoir être entraîné à chaque utilisation.

```text
jobs_dataset.csv
       │
       ▼
train_model.py
       │
       ▼
model.joblib
       │
       ▼
classifier.py
       │
       ▼
Catégorie prédite
```

---

# Ma contribution

Le projet ayant été réalisé en équipe, cette section présente mes principales contributions personnelles.

## Intelligence artificielle & NLP

- Conception du système de classification automatique des offres
- Implémentation du pipeline TF-IDF + Multinomial Naive Bayes
- Prétraitement des données textuelles
- Intégration de spaCy
- Création et préparation du dataset d'entraînement
- Développement du système d'entraînement du modèle
- Développement du système de prédiction
- Mise en place de tests pour le système IA
- Documentation du fonctionnement du système de classification

## Backend

- Intégration de la récupération des offres depuis l'API WeLoveDevs
- Développement du composant de collecte des données
- Travail sur la programmation orientée objet dans le backend

## Base de données

- Participation à la conception de la structure de la base de données
- Participation à la modélisation des données
- Participation à l'organisation des données nécessaires au fonctionnement de la plateforme

---

# Structure du projet

```text
job-aggregator/
│
├── Apps/
│   │
│   ├── Backend/
│   │   ├── src/
│   │   │   ├── AI/
│   │   │   │   ├── classifier.py
│   │   │   │   ├── extractor.py
│   │   │   │   ├── preprocess.py
│   │   │   │   ├── skills_db.py
│   │   │   │   ├── train_model.py
│   │   │   │   └── test_ai.py
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── Collector.py
│   │   │   │   ├── Standardizer.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── database.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── security.py
│   │   │   │   └── users.py
│   │   │   │
│   │   │   └── main.py
│   │   │
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── pytest.ini
│   │   └── requirements.txt
│   │
│   ├── Frontend/
│   │   ├── src/
│   │   ├── public/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── Database/
│       └── init.sql
│
├── Documentation/
│   ├── Backend/
│   ├── database/
│   └── frontend/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Installation

## Prérequis

Avant de commencer, installer :

- **Git**
- **Docker**
- **Docker Compose**

## Cloner le projet

```bash
git clone https://github.com/NdiemeWade/job-aggregator.git
cd job-aggregator
```

## Variables d'environnement

Créer un fichier `.env` à la racine du projet.

```env
WELOVEDEVS_API_KEY="votre_cle_api"

POSTGRES_USER="admin"
POSTGRES_PASSWORD="votre_mot_de_passe"
POSTGRES_DB="jobboard"

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"

SECRET_KEY="votre_cle_secrete"

ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

> **Important :** le fichier `.env` contient des informations sensibles et ne doit jamais être publié sur GitHub.

---

# Lancement

Le projet est entièrement conteneurisé avec Docker Compose.

Une seule commande permet de lancer la base de données, le backend et le frontend :

```bash
docker compose up -d --build
```

## Accès aux services

| Service | Adresse |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Documentation Swagger | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

---

# Synchronisation des offres

Les offres peuvent être récupérées depuis WeLoveDevs via l'API backend.

La synchronisation est disponible depuis la documentation Swagger :

```text
http://localhost:8000/docs
```

Endpoint utilisé :

```text
POST /api/jobs/sync
```

Le backend récupère les offres, les normalise puis les enregistre dans PostgreSQL.

---

# Tests

Les tests backend utilisent **pytest**.

```bash
pytest
```

Les tests couvrent notamment :

- l'authentification
- les offres
- la sécurité
- la normalisation des données
- le système de classification

---

# CI

Le projet utilise **GitHub Actions** pour automatiser les vérifications du backend.

```text
Push / Pull Request
        │
        ▼
GitHub Actions
        │
        ▼
Tests backend
```

---

# Documentation

La documentation technique complète est disponible dans le dossier :

```text
Documentation/
```

Elle contient notamment :

- architecture backend
- architecture frontend
- schéma de la base de données
- sécurité
- tests
- choix techniques
- décisions d'architecture
- documentation du système IA

Les détails techniques et les procédures avancées sont volontairement séparés du README principal afin de garder celui-ci lisible.

---

# Perspectives

Le projet pourrait évoluer avec :

- Un dataset plus important et diversifié
- De nouvelles catégories d'offres
- La comparaison de plusieurs modèles de Machine Learning
- Des modèles NLP plus avancés
- L'intégration de nouvelles sources d'offres
- Un système de recommandation personnalisé
- Un moteur de recherche et de filtrage plus avancé
- Un déploiement cloud

---

# Contexte académique

Projet réalisé dans le cadre du **Bachelor Informatique à Epitech Nancy**.

**Équipe :** Ndiémé · Noémy · Matthias · Luke  
**Durée :** 1 mois  
**Type :** Projet de fin de première année de Bachelor
