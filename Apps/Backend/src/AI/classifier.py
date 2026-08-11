import os
import joblib

# ================================
#  LOCALISATION DU MODÈLE
# ================================
# Pourquoi ?
# → On ne veut PAS dépendre du dossier depuis lequel on exécute Python
# → On construit un chemin absolu basé sur ce fichier

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Chemin vers le modèle entraîné (fichier .joblib)
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")

# ================================
#  CHARGEMENT DU MODÈLE
# ================================
# joblib permet de charger un modèle ML sauvegardé sur disque
# Ici, on récupère le modèle entraîné (TF-IDF + Naive Bayes)

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Modèle introuvable : {MODEL_PATH}. Lancez `python3 AI/train_model.py` pour entraîner et sauvegarder le modèle."
    )

model = joblib.load(MODEL_PATH)


# ================================
#  FONCTION DE PRÉDICTION
# ================================
# Objectif :
# → Prendre un texte (offre d’emploi)
# → Retourner une catégorie (frontend, backend, etc.)

def predict_category(text: str):
    """
    Prédit la catégorie d'une offre d'emploi.

    Paramètre :
        text (str) : description de l'offre

    Retour :
        str : catégorie prédite
    """

    # sklearn attend une liste même pour un seul texte
    prediction = model.predict([text])

    # on retourne uniquement la première (et seule) prédiction
    return prediction[0]