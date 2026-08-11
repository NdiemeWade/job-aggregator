# ADR - Intelligence Artificielle : classification des offres

**Date** : 2024  
**Statut** : Accepté  
**Contexte** : Choix d'une feature IA légère, conforme aux contraintes du cahier des charges (< 500 MB, < 5s/offre, pas de fine-tuning au démarrage).

---

## Problème utilisateur adressé

Les candidats tech cherchent des offres dans leur domaine spécifique (frontend, backend, data, DevOps) mais les intitulés de poste sont hétérogènes : "Développeur Full-Stack", "Ingénieur logiciel", "Software Engineer" peuvent désigner des réalités très différentes.

**Hypothèse** : une classification automatique des offres par domaine technique améliore la pertinence des résultats de recherche et permet d'afficher des filtres par catégorie sans que l'utilisateur ait à deviner les bons mots-clés.

---

## Décision

### Méthode choisie : classification TF-IDF + Naive Bayes (Multinomial)

**Why**
- Répond exactement au besoin (classification multi-classes)
- Modèle entraîné < 1 MB sur disque (vs 500 MB autorisés)
- Prédiction en < 1 ms (vs 5 secondes autorisées)
- Aucun fine-tuning au démarrage du conteneur : le modèle est pré-entraîné et sauvegardé en `.joblib`
- Entièrement sous notre contrôle : pas d'API externe

**How**

Pipeline scikit-learn en deux étapes :

```
Texte brut
    │
    ▼
TfidfVectorizer        → transforme le texte en vecteur numérique
    │                    (fréquence des termes pondérée par rareté)
    ▼
MultinomialNB          → classifie le vecteur en catégorie
    │
    ▼
Catégorie prédite : frontend | backend | fullstack | devops | data
```

```python
model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB())
])
model.fit(X_train, y_categories)
joblib.dump(model, "model.joblib")
```

**Dataset d'entraînement** : `AI/jobs_dataset.csv` - 24 exemples étiquetés manuellement couvrant 5 catégories. Dataset volontairement petit pour correspondre à la phase de prototype.

**Extraction de compétences complémentaire** : `AI/extractor.py` utilise spaCy (`en_core_web_sm`) pour identifier les technologies mentionnées dans une offre en les comparant à une base de compétences connues (`AI/skills_db.py`).

---

## Catégories supportées

| Catégorie | Exemples d'offres |
|---|---|
| `frontend` | React developer, Vue.js engineer, Angular UI |
| `backend` | Node.js API developer, Django REST, FastAPI |
| `fullstack` | React + Node.js developer, Django + React |
| `devops` | Docker/Kubernetes engineer, AWS CI/CD |
| `data` | Data scientist, ML engineer, Data analyst |

---

## Limitations connues

**Why documenter les limitations** - Le cahier des charges demande une évaluation honnête du modèle.

| Limitation | Impact | Mitigation |
|---|---|---|
| Dataset de 24 exemples | Faible généralisation sur offres atypiques | Augmenter le dataset progressivement |
| Texte uniquement en anglais dans le dataset | Moins précis sur offres en français | Ajouter des exemples FR |
| Pas de gestion des offres ambiguës | Fullstack souvent mal classé | Seuil de confiance + "non classé" |
| Modèle non mis à jour dynamiquement | Dérive sur de nouveaux types de postes | Re-entraînement périodique |

**Métriques d'évaluation** : sur le dataset d'entraînement (split 80/20), accuracy ≈ 90%. À interpréter avec prudence vu la taille du dataset.

---

## Alternative rejetée : modèle de langage pré-entraîné (BERT, sentence-transformers)

**Pourquoi rejeté** - BERT-base pèse environ 440 MB et nécessite plusieurs secondes d'inférence par offre sur CPU, sans accélérateur GPU. Les contraintes du cahier des charges (< 500 MB, < 5s) seraient à la limite, et surtout, les modèles transformer nécessitent généralement un téléchargement au premier lancement du conteneur - ce qui est interdit par le cahier des charges.

**Pourquoi rejeté également : API externe (OpenAI, Anthropic)** - Explicitement interdit par le cahier des charges : "You are not allowed to outsource the AI feature to a model API you do not control."

---

## Conformité aux contraintes du cahier des charges

| Contrainte | Requis | Réalisé |
|---|---|---|
| Taille sur disque | < 500 MB | < 1 MB (`.joblib`) |
| Latence par offre | < 5 secondes | < 1 ms |
| Fine-tuning au démarrage | Interdit | Aucun - modèle pré-entraîné |
| API externe | Interdit | Aucune - tout local |

---

## Evidence

- `AI/train_model.py` - script d'entraînement
- `AI/classifier.py` - module de prédiction
- `AI/extractor.py` - extraction de compétences (spaCy)
- `AI/jobs_dataset.csv` - dataset d'entraînement
- `AI/skills_db.py` - base de compétences reconnues
- `AI/preprocess.py` - nettoyage du texte
- `AI/test_ai.py` - tests manuels de prédiction