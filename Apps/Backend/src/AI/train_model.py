import os
import pandas as pd
import joblib

# ================================
#  OUTILS MACHINE LEARNING
# ================================
# TF-IDF : transforme du texte en vecteurs numériques
from sklearn.feature_extraction.text import TfidfVectorizer

# Naive Bayes : algorithme de classification simple et efficace
from sklearn.naive_bayes import MultinomialNB

# Pipeline : chaîne de traitement automatique
from sklearn.pipeline import Pipeline


# ================================
#  CHEMINS DU PROJET
# ================================
# Pourquoi ?
# → rendre le code indépendant du terminal

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# fichier dataset (entrées d'entraînement)
DATA_PATH = os.path.join(BASE_DIR, "jobs_dataset.csv")

# fichier du modèle entraîné (sortie)
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")


# ================================
#  CHARGEMENT DU DATASET
# ================================
# Le dataset contient :
# - text : description de l’offre
# - category : label (frontend, backend, etc.)

data = pd.read_csv(DATA_PATH)

# X = données d'entrée (texte des jobs)
X = data["text"]

# y = labels (catégories à prédire)
y = data["category"]


# ================================
#  CONSTRUCTION DU MODÈLE
# ================================
# Pipeline = enchaînement automatique de traitements :
#
# 1. TF-IDF → transforme texte en chiffres exploitables
# 2. Naive Bayes → apprend à classifier ces vecteurs

model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB())
])


# ================================
#  ENTRAÎNEMENT DU MODÈLE
# ================================
# Le modèle apprend la relation :
# texte → catégorie

model.fit(X, y)


# ================================
#  SAUVEGARDE DU MODÈLE
# ================================
# On enregistre le modèle entraîné dans un fichier
# pour pouvoir le réutiliser sans ré-entraîner

joblib.dump(model, MODEL_PATH)


# ================================
#  CONFIRMATION
# ================================
print("Modèle entraîné et sauvegardé avec succès")