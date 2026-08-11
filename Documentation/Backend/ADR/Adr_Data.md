# ADR - Données : intégration WeLoveDevs et pipeline d'ingestion

**Date** : 2024  
**Statut** : Accepté  
**Contexte** : Stratégie d'intégration de l'API WeLoveDevs, pipeline de normalisation, gestion du rate limit.

---

## Contexte

WeLoveDevs expose une API paginée de vraies offres d'emploi tech. Le cahier des charges impose :
- WeLoveDevs comme source obligatoire
- Normalisation avant stockage
- Déclenchement manuel possible
- Respect du rate limit : 1 requête/seconde/étudiant

---

## Décision

### Architecture du pipeline

```
API WeLoveDevs
      │
      ▼
┌─────────────┐
│  Collector  │  Collecte paginée, gestion des erreurs HTTP,
│  .py        │  pause de 1s entre pages
└──────┬──────┘
       │ raw_jobs[]
       ▼
┌──────────────────┐
│  Standardizer    │  Normalisation : salaires, contrats,
│  .py             │  localisation, remote policy, timestamps
└──────┬───────────┘
       │ { company, job_offer, skills }
       ▼
┌──────────────────┐
│  PostgreSQL      │  INSERT ON CONFLICT DO NOTHING
│  (via main.py)   │  sur external_id → idempotence
└──────────────────┘
```

### Collector (`Apps/Backend/src/services/Collector.py`)

**Why** - L'API WeLoveDevs renvoie les offres par pages. Sans pagination, on ne récupère qu'une fraction des offres disponibles.

**How**
- Boucle sur les pages jusqu'à réponse vide ou `max_pages` atteint.
- `time.sleep(1)` entre chaque page → respect strict du rate limit.
- Gestion explicite des codes HTTP : `429` (rate limit dépassé) arrête la collecte proprement, les autres erreurs sont loggées.

```python
def collect_jobs(self, max_pages: int = 10) -> list:
    while page < max_pages:
        data = self._fetch_page(page)
        if data is None:
            break  # erreur ou rate limit
        jobs = data.get("values", [])
        if not jobs:
            break  # fin des résultats
        all_jobs.extend(jobs)
        time.sleep(1)  # rate limit 1 req/s
        page += 1
    return all_jobs
```

**Trade-off** - `time.sleep(1)` est bloquant dans le thread principal. Pour une sync en tâche de fond (Celery, APScheduler), cette approche devrait utiliser `asyncio.sleep`. Dans le cadre d'un déclenchement manuel via endpoint HTTP, le client attend simplement la fin de la sync.

### Standardizer (`Apps/Backend/src/services/Standardizer.py`)

**Why** - Les données brutes de l'API WeLoveDevs ont des formats hétérogènes (salaires en multiples de 1000, timestamps en microsecondes, remote policy comme objet nested, etc.). Stocker les données brutes rendrait les filtres et comparaisons impossibles.

**How** - La classe `JobStandardizer.standardize()` mappe chaque champ brut vers le schéma DB :

| Champ brut | Transformation | Champ DB |
|---|---|---|
| `details.salary.min` (ex: `45`) | `× 1000` | `min_salary` (ex: `45000`) |
| `details.salary.currency` (`€`) | Remplacement → `EUR` | `currency` |
| `publishDate` (µsecondes) | `÷ 1_000_000` → `datetime` | `posted_at` |
| `details.remotePolicy.frequency` | Mapping enum | `rythm` |
| `contractTypes[0]` | Mapping lowercase | `contract_type` |
| `formattedPlaces[0]` | Suppression info remote | `location` |
| `title` | `.strip()` | `title` |

**Trade-off** - Le Standardizer est couplé au format de l'API WeLoveDevs v1. En cas de changement de schéma API, ce fichier doit être mis à jour. Des tests unitaires exhaustifs (`test_standardizer.py`) documentent et protègent ce comportement.

### Idempotence de l'ingestion

**Why** - La sync peut être déclenchée plusieurs fois. Re-insérer les mêmes offres créerait des doublons.

**How** - `external_id` (l'`objectID` de WeLoveDevs) est `UNIQUE` en base. Les insertions utilisent `ON CONFLICT (external_id) DO NOTHING` - une offre déjà présente est simplement ignorée, sans erreur.

**Evidence** : `Apps/Database/init.sql` contrainte `UNIQUE` sur `external_id` ; `Apps/Backend/src/main.py` route `POST /api/jobs/sync`.

---

## Champs collectés vs requis

Le cahier des charges impose : titre, description, entreprise, localisation, date, salaire.

| Requis | Champ DB | Source API |
|---|---|---|
| Titre | `title` | `title` |
| Description | `description` | `descriptionPreview` |
| Entreprise | `companies.name` | `smallCompany.companyName` |
| Localisation | `location` | `formattedPlaces[0]` |
| Date | `posted_at` | `publishDate` (µs) |
| Salaire | `min_salary`, `max_salary` | `details.salary.{min,max}` |

Champs enrichis supplémentaires : `contract_type`, `rythm`, `profession`, `required_experience`, `skillsList`.

---

## Alternative rejetée : scraping

**Pourquoi rejeté** - Le web scraping (BeautifulSoup, Scrapy) est fragile aux changements de DOM, viole souvent les CGU, et impose une maintenance continue. L'API officielle WeLoveDevs est plus fiable, documentée et légalement autorisée pour ce projet.

---

## Evidence

- `Apps/Backend/src/services/Collector.py`
- `Apps/Backend/src/services/Standardizer.py`
- `Apps/Backend/tests/test_standardizer.py` - 30+ tests unitaires
- `Apps/Backend/src/main.py` route `POST /api/jobs/sync`
- `Apps/Database/init.sql` contrainte `UNIQUE (external_id)`