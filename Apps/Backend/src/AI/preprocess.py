# ================================
#  PREPROCESSING DU TEXTE
# ================================
# Objectif :
# Nettoyer le texte pour que l’IA travaille sur des données propres

import re  # bibliothèque pour manipuler les expressions régulières

# ================================
#  FONCTION DE NETTOYAGE
# ================================

def clean_text(text: str) -> str:
    """
    Cette fonction prend un texte brut et le nettoie.
    
    Étapes :
    1. Mettre en minuscules
    2. Supprimer la ponctuation
    3. Normaliser les espaces
    """

    #  convertir en minuscules
    text = text.lower()

    #  supprimer tout ce qui n'est pas lettre ou espace
    text = re.sub(r"[^\w\s]", " ", text)

    #  supprimer espaces multiples
    text = re.sub(r"\s+", " ", text).strip()

    return text