## DEFINITION
La maquette du projet **GATEWAY** a été réalisée sur le logiciel **Figma** :  
[Lien du projet](https://www.figma.com/design/Kswh8ClGamGFMIt34chhpm/GATEWAY?node-id=0-1&t=CAeVWKNqL0oiGlrs-1)  
Elle sert de base visuelle pour le développement du site, en définissant la structure, les composants et la hiérarchie des pages.

---

## STRUCTURE GÉNÉRALE
La maquette est organisée en **quatre pages principales**, chacune correspondant à une section du site :

### PAGE RECHERCHE
- **Rôle** : interface de recherche des offres de stage.
- **Éléments** :
  - Barre de navigation : `GATEWAY`, `Recherche`, `Profil`, `Se connecter`.
  - Zone de recherche : champs “Intitulé du poste” et “Localisation”.
  - Résultats : liste d’offres affichées sous forme de cartes.
- **Objectif** : permettre une recherche rapide et intuitive.

---

### PAGE CANDIDAT
- **Rôle** : affichage et édition du profil utilisateur.
- **Sections** :
  - **Profil** : nom complet, localisation, formation actuelle, recherche.
  - **CV** : formats image et vidéo.
  - **Chronologie** : diagramme de Gantt des expériences.
  - **Liens** : portfolio, GitHub, LinkedIn, etc.
- **Style** : cartes arrondies, fond clair, typographie lisible.

---

### PAGE ENTREPRISE
- **Rôle** : profil d’entreprise et gestion des offres.
- **Sections** :
  - Siège, chiffre d’affaires, année de création.
  - Description, nombre de salariés, offres publiées.
  - Liens externes (site web, réseaux).
- **Objectif** : présenter les informations clés de l’entreprise de manière synthétique.

---

### PAGE PARAMÈTRE
- **Rôle** : configuration du compte et des préférences.
- **Éléments** :
  - Ajout de médias (CV, image, vidéo).
  - Informations personnelles : nom, prénom, date de naissance, email, mot de passe.
  - Localisation, type de contrat recherché, durée, missions, secteur d’activité.
  - Langues, formations, expériences.
- **Objectif** : permettre à l’utilisateur de personnaliser son profil complet.

---

## OBJECTIF DE LA MAQUETTE
- Définir la **structure fonctionnelle** du site avant développement.
- Garantir la **cohérence visuelle** entre les pages.
- Servir de **référence** pour le design system et les composants React.

---

## OUTIL UTILISÉ
- **Logiciel** : Figma  
- **Mode** : Wireframe & Maquette
- **Avantage** : collaboration en temps réel, prototypage rapide, export facile vers le frontend.

---

## CONCLUSION
- Nous avons directement incrusté les fonctionnalités de modification dans la page candidat 
- Nous n'avons pas fait de page paramètres 
- Nous avons revue l'esthétique du home.tsx 