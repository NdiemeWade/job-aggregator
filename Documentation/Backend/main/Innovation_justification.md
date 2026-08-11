# Justification des innovations - Gateway

Le cahier des charges impose de justifier chaque feature avancée selon quatre axes :
1. **Problème utilisateur adressé**
2. **Hypothèse de feature**
3. **Pourquoi cette approche est pertinente**
4. **Comment le succès sera mesuré**

---

## Feature 1 - Classification IA des offres par domaine technique

### Problème utilisateur adressé

Les intitulés de poste dans la tech sont profondément hétérogènes. "Software Engineer", "Développeur Full-Stack", "Ingénieur logiciel" peuvent désigner des réalités très différentes. Un étudiant spécialisé React qui cherche un stage frontend doit lire 10 à 20 descriptions pour identifier 3 offres réellement pertinentes.

**Segment visé** : étudiants en 2e/3e année ayant une spécialisation technique émergente (frontend, data science, DevOps, etc.) et peu de temps à consacrer à la recherche.

### Hypothèse

> Si chaque offre affiche automatiquement sa catégorie technique (frontend / backend / fullstack / data / devops), les utilisateurs identifieront les offres pertinentes sans lire les descriptions, réduisant le temps de sélection.

### Pourquoi cette approche est pertinente

**Choix technique** : TF-IDF + Naive Bayes Multinomial (scikit-learn)

- **Légèreté** : modèle < 1 MB sur disque, inférence < 1 ms par offre - bien dans les contraintes (500 MB, 5 secondes).
- **Indépendance** : entièrement sous notre contrôle, aucune API externe, pas de coût d'usage.
- **Pertinence pour le cas d'usage** : la classification textuelle sur corpus technique court (titres + descriptions) est exactement le cas d'usage pour lequel Naive Bayes avec TF-IDF est reconnu comme efficace (baseline solide, souvent compétitif avec des modèles bien plus lourds sur des datasets limités).
- **Pas de fine-tuning au démarrage** : le modèle est pré-entraîné (`model.joblib`) et chargé en mémoire une seule fois.

**Pourquoi pas BERT ou GPT** : ces modèles font 400 MB+ et nécessitent GPU ou plusieurs secondes d'inférence CPU - hors contraintes du cahier des charges. Leur surcomplexité ne se justifie pas pour 5 catégories sur des descriptions courtes.

### Comment le succès sera mesuré

| Métrique | Cible | Méthode de mesure |
|---|---|---|
| Précision du classifieur | ≥ 80% sur dataset de validation | Split 80/20 sur `jobs_dataset.csv`, matrice de confusion |
| Latence d'inférence | < 1 seconde par offre | `time.time()` autour de `predict_category()` |
| Adoption du filtre par catégorie | > 30% des sessions utilisent le filtre domaine | Analytics frontend (à implémenter) |
| Taux de pertinence perçue | > 70% des offres classées jugées correctes | Feedback utilisateur (bouton "pertinent / non pertinent") |

**Evidence actuelle** : `AI/test_ai.py` - tests manuels de prédiction sur 3 exemples ; `AI/train_model.py` - pipeline d'entraînement documenté.

---

## Feature 2 - Filtrage avancé multi-critères côté serveur

### Problème utilisateur adressé

Les plateformes généralistes proposent des filtres séparés et peu combinables. Un étudiant cherchant un stage fullstack à Paris en télétravail hybride avec un minimum de 1200€/mois doit souvent appliquer les filtres en plusieurs étapes avec des résultats incohérents.

**Segment visé** : tous les utilisateurs authentifiés, particulièrement ceux avec des critères précis (localisation + rythme + rémunération).

### Hypothèse

> Des filtres combinables via query parameters (`location`, `contract_type`, `rythm`, `min_salary`, `profession`, `title`) appliqués côté serveur permettront aux utilisateurs de trouver leur offre cible en moins de 3 requêtes.

### Pourquoi cette approche est pertinente

**Filtres côté serveur** plutôt que côté client :
- **Scalabilité** : fonctionne quel que soit le volume d'offres en base (1 000 ou 100 000).
- **Testabilité** : les filtres sont des paramètres d'une route HTTP → testables automatiquement en CI (voir `TestJobSearch` dans `test_api_jobs_security.py`).
- **Combinabilité** : SQLAlchemy compose les `WHERE` dynamiquement selon les paramètres présents.

```python
# Composition dynamique des filtres
query = select(JobOffer).order_by(JobOffer.posted_at.desc())
if title:    query = query.where(JobOffer.title.ilike(f"%{title}%"))
if location: query = query.where(JobOffer.location.ilike(f"%{location}%"))
if min_salary: query = query.where(JobOffer.max_salary >= min_salary)
# ...
```

**Recherche insensible à la casse** (`ilike`) sur titre, localisation et profession - un utilisateur qui tape "paris" trouve les offres "Paris, FR".

### Comment le succès sera mesuré

| Métrique | Cible | Méthode de mesure |
|---|---|---|
| Taux d'utilisation des filtres | > 50% des sessions | Analytics (paramètres de requête loggés) |
| Offres retournées avec filtre vs sans | Réduction de 60% du volume | Comparaison `GET /api/jobs` vs `GET /api/jobs?...` |
| Couverture des tests | 100% des combinaisons de filtres couvertes | `TestJobSearch` - 7 cas de test |

**Evidence** : `Apps/Backend/src/main.py` `GET /api/jobs` ; `Apps/Backend/tests/test_api_jobs_security.py` `TestJobSearch` (7 tests : filtre titre, localisation, contrat, salaire, combiné, aucun résultat, non authentifié).

---

## Feature 3 - Pipeline d'ingestion normalisée WeLoveDevs

### Problème utilisateur adressé

Les données brutes de l'API WeLoveDevs ont des formats hétérogènes incompatibles avec un filtrage cohérent : salaires en multiples de 1000, timestamps en microsecondes, politique remote comme objet imbriqué. Sans normalisation, les filtres par salaire ou rythme seraient inopérants.

**Segment visé** : administrateurs et l'ensemble des utilisateurs (la qualité des données affecte tous les filtres).

### Hypothèse

> Une couche de normalisation systématique avant stockage garantira que 100% des offres ingérées sont filtrables sans post-traitement frontend, quelle que soit la variabilité du format source.

### Pourquoi cette approche est pertinente

Le `JobStandardizer` est une **couche de mapping explicite et testée** :
- Chaque transformation est documentée (voir `ADR_DATA.md`).
- 30+ tests unitaires couvrent tous les cas limites (valeurs nulles, formats inattendus, séparateurs de salaire variés).
- L'idempotence (`ON CONFLICT DO NOTHING` sur `external_id`) permet de re-synchroniser sans créer de doublons.

Cette approche est préférable à une normalisation à la volée dans les queries SQL car :
- Les erreurs de normalisation sont détectées à l'ingestion, pas à la lecture.
- Le schéma DB reste propre et ne stocke que des données cohérentes.
- Les tests du Standardizer constituent une documentation vivante du contrat de données.

### Comment le succès sera mesuré

| Métrique | Cible | Méthode de mesure |
|---|---|---|
| Offres avec `min_salary` non nul | > 60% (dépend de la source) | `SELECT COUNT(*) FROM job_offers WHERE min_salary IS NOT NULL` |
| Offres avec `contract_type` normalisé | 100% des offres ingérées | Vérification des valeurs distinctes en base |
| 0 doublon après re-sync | 0 offre dupliquée | `SELECT COUNT(*) FROM job_offers GROUP BY external_id HAVING COUNT(*) > 1` |
| Tests Standardizer au vert en CI | 100% | `pytest tests/test_standardizer.py` dans GitHub Actions |

**Evidence** : `Apps/Backend/src/services/Standardizer.py` ; `Apps/Backend/tests/test_standardizer.py` (30+ assertions) ; `Apps/Backend/src/main.py` route `POST /api/jobs/sync`.

---

## Récapitulatif

| Feature | Problème résolu | Mesure principale |
|---|---|---|
| Classification IA | Offres hors-domaine dans les résultats | Précision ≥ 80% sur validation |
| Filtrage multi-critères | Trop d'offres non pertinentes à trier | > 50% des sessions utilisent les filtres |
| Pipeline de normalisation | Données incomparables avant stockage | 100% des offres filtrables par contrat/salaire |