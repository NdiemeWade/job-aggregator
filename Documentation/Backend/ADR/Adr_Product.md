# ADR - Produit : utilisateurs cibles, problèmes, valeur et dashboard

**Date** : 2024  
**Statut** : Accepté  
**Contexte** : Définition du périmètre produit, des utilisateurs visés, de la proposition de valeur et des choix de dashboard.

---

## 1. Utilisateurs cibles

### Profil principal : l'étudiant tech en recherche de stage ou alternance

**Qui** - Étudiants Epitech (et écoles similaires) en 2e/3e année, cherchant un stage obligatoire de 6 mois ou une alternance. Profil technique, à l'aise avec les outils numériques, mais dont le temps de recherche est limité par les cours et les projets.

**Douleurs identifiées**

| Problème | Impact |
|---|---|
| Dispersion des offres sur plusieurs plateformes (LinkedIn, WeLoveDevs, Indeed...) | Perte de temps à naviguer entre les sites |
| Intitulés de poste hétérogènes | Difficile de comparer des offres similaires |
| Absence de vue agrégée salaires/technologies | Impossible de calibrer ses prétentions salariales |
| Pas de filtrage par technologie ou rythme de travail | Trop d'offres non pertinentes à trier manuellement |

### Profil secondaire : l'administrateur de la plateforme

**Qui** - Un membre de l'équipe ou un responsable pédagogique qui s'assure que les offres affichées sont pertinentes et modérées (suppression de spam, validation des offres).

---

## 2. Proposition de valeur

> **Gateway** centralise les offres tech en un seul endroit, normalisées et filtrables, avec une classification IA par domaine et des indicateurs de marché, pour que les étudiants passent moins de temps à chercher et plus de temps à postuler.

**Ce que Gateway fait mieux que la navigation directe sur WeLoveDevs**

| Feature | WeLoveDevs natif | Gateway |
|---|---|---|
| Filtrage multi-critères (lieu + contrat + salaire) | oui | oui |
| Classification automatique par domaine (frontend/backend/data...) | non | oui (IA) |
| Vue comparée salaires par contrat/domaine | Partielle | oui (data feature) |
| Favoris personnels | oui | oui |
| Interface admin de modération | non | oui |
| Accès via API standardisée | oui (API) | oui (notre API REST) |

---

## 3. Fonctionnalités prioritaires

Classement par valeur utilisateur × faisabilité technique :

| Priorité | Feature | Justification |
|---|---|---|
| P0 | Recherche et filtrage d'offres | Core du produit, sans ça rien ne fonctionne |
| P0 | Authentification (register/login) | Requis pour les favoris et l'admin |
| P1 | Synchronisation WeLoveDevs | Source de données obligatoire |
| P1 | Classification IA par domaine | Différenciateur clé, filtrage amélioré |
| P1 | Favoris utilisateur | Rétention et personnalisation |
| P2 | Interface d'administration | Modération des offres, gestion utilisateurs |
| P2 | Dashboard analytique (salaires, distribution) | Feature data requise par le CDC |
| P3 | Profil candidat avec CV | Valeur ajoutée future |
| P3 | Profil entreprise | Valeur ajoutée future |

---

## 4. Choix du dashboard - justification feature par feature

Le PDF impose de justifier chaque widget/feature du dashboard : quel problème utilisateur il résout, et quelle décision il supporte.

### Widget 1 : Carte de résultats filtrés (liste d'offres)

**Problème** - L'utilisateur ne sait pas quelles offres correspondent à son profil sans tout lire.

**Hypothèse** - Des filtres multi-critères combinables (lieu + type de contrat + rythme + salaire minimum) réduisent le temps de sélection d'une offre pertinente de >5 minutes à <1 minute.

**Décision supportée** - "Est-ce que cette offre vaut la peine d'être lue ?"

**Mesure de succès** - Taux de clic sur "Voir l'offre" après application d'au moins un filtre vs sans filtre.

**Evidence** : `Apps/Backend/src/main.py` `GET /api/jobs` avec query params `title`, `location`, `contract_type`, `rythm`, `min_salary`, `profession`.

---

### Widget 2 : Badge de classification IA (domaine technique)

**Problème** - L'intitulé "Software Engineer" peut désigner un développeur frontend React ou un ingénieur DevOps. L'utilisateur perd du temps à lire des offres hors de son domaine.

**Hypothèse** - Afficher la catégorie prédite (frontend / backend / data / devops / fullstack) sur chaque carte permet de filtrer visuellement sans lire la description.

**Décision supportée** - "Cette offre est-elle dans mon domaine ?"

**Mesure de succès** - Réduction du nombre d'offres ouvertes avant de trouver une offre pertinente.

**Evidence** : `AI/classifier.py` `predict_category()` ; `AI/jobs_dataset.csv`.

---

### Widget 3 : Indicateurs salariaux (data feature)

**Problème** - Les étudiants ne savent pas si une gratification de stage ou un salaire d'alternance est dans la norme du marché tech.

**Hypothèse** - Afficher la distribution des salaires/gratifications par type de contrat (Stage, Alternance, CDI) et par domaine donne un référentiel de marché accessible directement dans la plateforme.

**Décision supportée** - "Est-ce que la rémunération proposée est raisonnable ?"

**Mesure de succès** - Les utilisateurs filtrent moins souvent avec `min_salary=0` (sans indication salariale) après avoir consulté les indicateurs.

**Evidence** : Champs `min_salary`, `max_salary`, `contract_type`, `profession` dans `Apps/Backend/src/services/models.py` JobOffer - tous disponibles via `GET /api/jobs`.

---

### Widget 4 : Interface de modération (admin)

**Problème** - Sans modération, des offres obsolètes, du spam ou des doublons dégradent l'expérience utilisateur.

**Hypothèse** - Un accès admin direct avec toggle `is_moderated` permet de valider ou masquer une offre en un clic, sans passer par la base de données.

**Décision supportée** - "Cette offre doit-elle être visible par les utilisateurs ?"

**Evidence** : `Apps/Backend/src/main.py` `PATCH /api/jobs/{id}/moderate` ; `Apps/Backend/src/services/users.py` admin routes.

---

## 5. Scan de marché et alternatives

| Plateforme | Forces | Faiblesses vs Gateway |
|---|---|---|
| WeLoveDevs | Données qualitatives, focus tech | Pas d'agrégation multi-source, pas de classification IA personnalisée |
| LinkedIn | Volume élevé | Algorithme opaque, pas de filtre tech précis |
| Indeed | Large couverture | Offres souvent non pertinentes pour profils tech |
| Welcome to the Jungle | Design soigné, culture entreprise | Pas d'API ouverte, focus CDI |
| Otta | Classement par pertinence | Uniquement en anglais, focus international |

**Position de Gateway** - Agrégateur centré sur l'écosystème WeLoveDevs, enrichi par IA et analytics, pensé pour les étudiants tech francophones.

---

## 6. Wireframes et maquettes

Les wireframes des vues principales ont été produits pendant la phase de conception :
- Page d'accueil avec recherche rapide (`Apps/Frontend/src/pages/Home.tsx`)
- Page de connexion / inscription (`Login.tsx`, `Register.tsx`)
- Composant carte offre (`JobCard.tsx`)
- Profil candidat (`ProfilCandidat.jsx`)
- Profil entreprise (`ProfilEntreprise.jsx`)

> Les maquettes haute fidélité sont disponibles dans l'outil de design de l'équipe (à compléter avec le lien Figma/Excalidraw si applicable).

---

## Trade-offs produit assumés

| Choix | Alternative | Raison du choix |
|---|---|---|
| Une seule source de données (WeLoveDevs) | Multi-sources (LinkedIn scraping, Indeed API) | API WeLoveDevs officielle et autorisée, scraping fragile et risqué légalement |
| Interface en français | Bilingue FR/EN | Cible principale = étudiants francophones Epitech |
| Filtres côté serveur (API query params) | Filtres côté client (JS) | Scalable, performant sur grands volumes, testable |
| Classification 5 catégories | Taxonomie plus fine (React dev vs Vue dev) | Dataset limité, 5 catégories couvrent 90% des cas d'usage |