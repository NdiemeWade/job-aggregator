# Apps/Backend/src/services/Collector.py  
# Aller chercher les offres d'emploi sur WeLoveDevs API  
# Récupérer les données brutes (JSON)  
# Les préparer pour le reste du pipeline (Standardizer + DB)  
  
import requests  # Sert à faire des appels HTTP (GET / POST)  
import time  # Sert à faire des pauses entre les appels API  
import os  # Sert à accéder aux variables d'environnement  
from dotenv import load_dotenv  # Charge les variables d'environnement  
  
# 1. Charger .env pour accéder à la clé API de WeLoveDevs  
load_dotenv()  
  
  
class Collector:  
    def __init__(self):  
        self.api_key = os.getenv("WELOVEDEVS_API_KEY")  
        self.base_url = "https://epi-api.welovedevs.com/v1"  
        self.headers = {  
            "x-api-key": self.api_key  
        }  
  
    def _fetch_page(self, page: int):  
        """Récupère une page spécifique de jobs depuis l'API."""  
        params = {"page": page}  
        response = requests.get(self.base_url, headers=self.headers, params=params)  
          
        if response.status_code == 200:  
            return response.json()  
        elif response.status_code == 429:  
            print(f"[Collector] Erreur HTTP 429 sur la page {page} : rate limit atteint")  
            return None  
        else:  
            print(f"[Collector] Erreur HTTP {response.status_code} sur la page {page}")  
            return None  
  
    def collect_jobs(self, max_pages: int = 10):  
        """  
        Récupère toutes les offres via pagination.  
          
        Args:  
            max_pages: Nombre maximum de pages à récupérer (sécurité)  
          
        Returns:  
            Liste de tous les jobs récupérés  
        """  
        all_jobs = []  
        page = 0  
          
        print("[Collector] Début de la collecte...")  
          
        while page < max_pages:  
            print(f"[Collector] Récupération de la page {page}...")  
              
            data = self._fetch_page(page)  
              
            if data is None:  
                # Erreur ou rate limit, on arrête  
                break  
              
            jobs = data.get("values", [])  
              
            if not jobs:  
                # Plus de jobs, on arrête  
                print(f"[Collector] Page {page} vide, fin de la collecte.")  
                break  
              
            all_jobs.extend(jobs)  
            print(f"[Collector] Page {page}, {len(jobs)} jobs (total cumulé : {len(all_jobs)})")  
              
            # Pause pour éviter le rate limiting  
            time.sleep(1)  
              
            page += 1  
          
        print(f"[Collector] {len(all_jobs)} offres récupérées au total.")  
        return all_jobs  
  
  
if __name__ == "__main__":  
    collector = Collector()  
    jobs = collector.collect_jobs()