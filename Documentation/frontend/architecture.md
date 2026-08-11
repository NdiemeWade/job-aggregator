## DEFINITION
L’architecture organise les différentes parties de l’application afin d’assurer une structure claire, évolutive et cohérente.  
Elle sépare les responsabilités : logique métier, affichage, gestion du thème, données utilisateur et composants réutilisables.

## CONTEXTES & PROVIDERS

### ThemeContext.tsx
- Rôle : gestion du thème global (light / dark)
- Fonctionnalités :
  - stockage dans `localStorage`
  - application automatique de la classe `light` ou `dark` sur `<html>`
  - hook `useTheme()` pour accéder au thème
- Utilisation : dans toutes les pages (Profil, Dashboard, HeroSearch)

---

## PAGES PRINCIPALES

### HeroSearch.tsx
- Rôle : page d’accueil de recherche d’offres
- Fonctionnalités :
  - récupération des offres via API
  - pagination
  - affichage des `JobCard`
- Style : Tailwind CSS

### ProfilCandidat.tsx
- Rôle : gestion et affichage du profil utilisateur
- Contenu :
  - informations personnelles
  - compétences
  - liens externes
  - Gantt (périodes : stage, formation, projet…)
- Style : objets inline (`s.xxx`)
- Intègre le thème via `useTheme()`

---

## COMPOSANTS

### JobCard.tsx
- Rôle : affiche les offres d’emploi
- Utilisation : dans `JobsPage.tsx` et `Dashboard.tsx`.

### Navbar.tsx
- Rôle : barre de navigation du site web
- Fonctionnalités :
  - liens vers les pages principales (Accueil, Offres, Profil)
- Accessibilité :
  - navigation clavier

### ThemeContext.tsx
- Rôle : gestion du thème global (clair/sombre).
- Utilisation : via `useContext` dans les pages et composants.
- Avantage : améliore la cohérence visuelle et la personnalisation utilisateur.

---

## TYPES & DONNÉES

### Types TypeScript
- `ApiJobOffer` : structure d’une offre d’emploi
- `UserProfile` : structure du profil candidat
- `Period` : période du Gantt
- `LinkItem` : lien externe (GitHub, Portfolio…)

### Constantes
- `C` : palette de couleurs
- `s` : styles inline
- `MONTHS`, `COLORS`, `PERIOD_TYPES` : données métier
- `USER` : profil par défaut avant connexion à la DB

---

## API & LOGIQUE MÉTIER

### Récupération des offres
- Endpoint : `GET /api/jobs?page=X&size=Y`
- Gestion :
  - `jobs`
  - `page`
  - `totalPages`
- Sécurité :
  - token récupéré dans `localStorage`

---

## STYLE & THEME

### Tailwind CSS
- Utilisé dans HeroSearch et les pages modernes
- Mode sombre activé via `darkMode: "class"`

### Styles inline (TSK)
- Utilisés dans Profil Candidat
- Avantage : contrôle précis, typage TS
- Adaptation au thème :
  - variantes light/dark via `useTheme()`

---

## STRUCTURE GLOBALE

- **Contextes** : ThemeProvider
- **Pages** : HeroSearch, ProfilCandidat
- **Composants** : JobCard, Field, etc.
- **Styles** : Tailwind + inline
- **API** : récupération des offres
- **Données** : types TS + constantes métier
