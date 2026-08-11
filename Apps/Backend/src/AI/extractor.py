# ================================
#  EXTRACTION DE COMPÉTENCES
# ================================
# Objectif :
# Trouver les technologies dans un texte utilisateur

import spacy  # NLP
from AI.preprocess import clean_text  # <-- Ajout de AI.
from AI.skills_db import SKILLS       # <-- Ajout de AI.

# ================================
#  CHARGEMENT DU MODÈLE NLP
# ================================

# modèle léger spaCy
nlp = spacy.load("en_core_web_sm")

# ================================
#  FONCTION D’EXTRACTION
# ================================

def extract_skills(text: str):
    """
    Prend un texte et retourne les compétences détectées.
    """

    #  nettoyage du texte
    text = clean_text(text)

    #  analyse NLP (tokenisation)
    doc = nlp(text)

    #  reconstruction texte propre
    processed_text = " ".join([token.text for token in doc])

    #  détection des skills
    found_skills = set()

    for skill, variants in SKILLS.items():
        for variant in variants:
            if variant in processed_text:
                found_skills.add(skill)

    #  retour liste finale
    return list(found_skills)