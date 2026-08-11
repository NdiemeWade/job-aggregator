# PROJET DE FIN D'ÉTUDE, PREMIÈRE ANNÉE BACHELOR — GATEWAY

Gateway est une plateforme de recherche d'emploi et de stages, conçue pour centraliser et de standardiser les offres reçues via l'API WeLoveDevs. 

Ce projet est entièrement conteneurisé via Docker. Une seule commande suffit pour lancer la base de données, le backend et le frontend simultanément.

### L'Équipe & Contexte
Ce projet a été réalisé en un mois par **Ndiémé**, **Noémy**, **Matthias** et **Luke**, l'objectif étant d'appliquer l'ensemble des compétences acquises durant l'année dans un projet concret de "Job Aggregator". Les technos utilisées ont été apprises en même temps que le projet avançait, tout comme l'écriture de sa documentation.

### À l'attention de la promotion Bachelor 2028 (Epitech Nancy)
Ce dépôt est accessible aux étudiants de la promotion. Assurez-vous d'avoir les accès requis sur le groupe de la promotion pour pouvoir cloner ce repository avec votre clé SSH.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine :
* **Docker** & Docker Compose
* **Git** *(Si la commande `git` est inconnue dans votre terminal, installez-le via votre gestionnaire : `sudo apt install git` sur Ubuntu/Debian, `brew install git` sur Mac, ou via le site officiel).*

---

## Installation & Démarrage

### 1. Cloner le projet
Ouvrez votre terminal et récupérez le code source via SSH :

```bash
git clone git@github.com:EpitechBachelorPromo2028/B-YEP-200-NCY-2-1-jobaggregator-1.git
cd B-YEP-200-NCY-2-1-jobaggregator-1
```

### 2. Configurer les variables d'environnement
À la racine du dossier (`B-YEP-200-NCY-2-1-jobaggregator-1`), créez un fichier `.env` contenant vos clés secrètes :

```env
# API Keys
WELOVEDEVS_API_KEY="insérer ici la clé api reçu de WeLoveDevs"
 
# Database Credentials
POSTGRES_USER="admin"
POSTGRES_PASSWORD="password123"
POSTGRES_DB="jobboard"
 
# Database URL pour SQLAlchemy (Backend)
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}"
 
SECRET_KEY="ceci_est_une_cle_secrète_tres_longue_et_pas_du_tout_aleatoire_ici"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### 3. Lancer l'infrastructure
Construisez et démarrez tous les conteneurs (Database, FastAPI, React via Vite) en tâche de fond :

```bash
sudo docker compose up -d --build
```

---

## Accéder à l'application

Une fois les conteneurs démarrés, l'écosystème est accessible instantanément :

* **🌐 Frontend (Application Web) :** [http://localhost:5173](http://localhost:5173) *(Hot-reload actif pour le dev !)*
* **⚙️ Backend (Documentation Swagger UI) :** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Alimenter la base de données (Collecte WeLoveDevs)

Par défaut, votre base de données locale est vide. Pour importer les offres :

1. Rendez-vous sur le Swagger de l'API : [http://localhost:8000/docs](http://localhost:8000/docs)
2. Créez un compte via l'endpoint `/api/auth/register` (ou connectez-vous).
3. Cliquez sur le cadenas **Authorize** en haut à droite pour coller votre token JWT.
4. Cherchez la route `POST /api/jobs/sync`.
5. Cliquez sur **Try it out** puis **Execute**. Le script paginé va collecter et nettoyer les données.

---

## Commandes utiles (Cheat Sheet)

Voici les commandes essentielles pour gérer le projet au quotidien dans votre terminal :

**Lire les logs en temps réel (Pratique en cas de bug côté Python) :**
```bash
sudo docker compose logs backend --tail 50 -f
```

**Redémarrer un service spécifique :**
```bash
sudo docker compose restart backend
sudo docker compose restart frontend
```

**Nettoyer la base de données (Vider uniquement le catalogue d'offres de façon dynamique) :**
```bash
sudo docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "TRUNCATE TABLE job_offers CASCADE;"'
```

**Arrêter le projet proprement :**
```bash
sudo docker compose down
```

**Réinitialisation totale (Supprime aussi les volumes de la DB) :**
```bash
sudo docker compose down -v
```