FROM python:3.11-slim

WORKDIR /app

# Copie et installation des dépendances globales du projet
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

# Copie du reste des sources du backend
COPY . .

# Configuration du chemin d'exécution Python
ENV PYTHONPATH=/app/src

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]