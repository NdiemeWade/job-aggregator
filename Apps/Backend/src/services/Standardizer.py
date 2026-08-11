from datetime import datetime, timezone
import re


class JobStandardizer:

    def __init__(self):
        self.source_name = "WeLoveDevs"

    def _clean_salary(self, salary_str: str) -> int | None:
        """
        Nettoie les chaînes de salaire et retourne une valeur entière.
        Ex: "45k" -> 45000, "60 000" -> 60000
        """
        if not salary_str:
            return None

        clean_val = (
            str(salary_str)
            .lower()
            .replace("€", "")
            .replace("/an", "")
            .replace(" ", "")
        )

        try:
            if "k" in clean_val:
                number = float(clean_val.split("k")[0])
                return int(number * 1000)
            return int(float(clean_val))
        except (ValueError, IndexError):
            return None

    def _parse_salary_range(self, salary_raw: str) -> tuple[int | None, int | None]:
        """
        Parse une plage salariale "45k → 60k" ou "45k - 60k" en (min, max).
        Si valeur unique, retourne (val, val).
        """
        if not salary_raw:
            return None, None

        # Séparateurs possibles : →, ->, -, –
        parts = re.split(r"[→\-–>]+", str(salary_raw))
        parts = [p.strip() for p in parts if p.strip()]

        if len(parts) == 2:
            return self._clean_salary(parts[0]), self._clean_salary(parts[1])
        elif len(parts) == 1:
            val = self._clean_salary(parts[0])
            return val, val

        return None, None

    def _normalize_contract_type(self, contract_raw: str) -> str | None:
        """
        Normalise les types de contrat vers des valeurs cohérentes pour la DB.
        Ex: "CDI", "CDD", "Freelance", "Stage", "Alternance"
        """
        if not contract_raw:
            return None

        mapping = {
            "cdi": "CDI",
            "permanent": "CDI",             
            "cdd": "CDD",
            "fixed-term": "CDD",            
            "freelance": "Freelance",
            "contract": "Freelance",
            "stage": "Stage",
            "intern": "Stage",
            "internship": "Stage",          
            "alternance": "Alternance",
            "apprenticeship": "Alternance"  
        }

        return mapping.get(contract_raw.strip().lower(), contract_raw.strip())

    def _parse_location(self, location_raw: str) -> str:
        """
        Nettoie la localisation en retirant les infos remote redondantes.
        Ex: "Villeneuve-d'Ascq, FR - Télétravail" -> "Villeneuve-d'Ascq, FR"
        """
        if not location_raw:
            return "Non renseigné"

        # On coupe sur les séparateurs courants qui introduisent le mode remote
        for sep in [" - Télétravail", " - Remote", " - Teletravail"]:
            if sep.lower() in location_raw.lower():
                location_raw = location_raw[: location_raw.lower().index(sep.lower())]

        return location_raw.strip()

    def _normalize_rythm_from_policy(self, remote_policy: dict) -> str:
        """
        Utilise remotePolicy.frequency (champ réel de l'API) plutôt qu'une string texte.
        Valeurs observées : "hybrid", "fullTime", "onSite" (à confirmer)
        """
        frequency = remote_policy.get("frequency", "")

        mapping = {
            "fullTime": "Full remote",
            "hybrid":   "Télétravail hybride",
            "onSite":   "Sur site",
        }
        return mapping.get(frequency, "Sur site")

    def standardize(self, raw_data: dict) -> dict:
        """
        Mappe un job brut WeLoveDevs vers le schéma DB.

        Champs réels de l'API (observés) :
        - id / objectID           -> external_id
        - title                   -> title
        - descriptionPreview      -> description  (pas de champ 'description' complet)
        - smallCompany.*          -> company
        - formattedPlaces[0]      -> location
        - contractTypes[0]        -> contract_type  ("permanent" -> "CDI")
        - details.salary.{min,max}-> min_salary / max_salary
        - details.salary.currency -> currency
        - details.remotePolicy    -> rythm
        - publishDate             -> posted_at  (timestamp microsecondes)
        - skillsList[].name       -> ignoré ici, utile pour la feature IA/Data
        """
        if not raw_data:
            raise ValueError("raw_data est vide ou None")

        # --- Salaire (déjà en int dans l'API, ex: min=45 signifie 45k) ---
        salary = raw_data.get("details", {}).get("salary", {})
        min_salary = int(salary["min"] * 1000) if salary.get("min") is not None else None
        max_salary = int(salary["max"] * 1000) if salary.get("max") is not None else None
        currency = salary.get("currency", "€").replace("€", "EUR") or "EUR"

        # --- Entreprise ---
        company_raw = raw_data.get("smallCompany", {})
        company = {
            "name": company_raw.get("companyName") or "Inconnue",
            "logo_url": None,   # Pas exposé dans smallCompany, à enrichir si dispo
            "website_url": (
                f"https://welovedevs.com/app/company/{company_raw.get('seoAlias')}"
                if company_raw.get("seoAlias") else None
            ),
        }

        # --- Localisation ---
        formatted_places = raw_data.get("formattedPlaces", [])
        location = formatted_places[0] if formatted_places else "Non renseigné"

        # --- Rythme (remotePolicy) ---
        remote_policy = raw_data.get("details", {}).get("remotePolicy", {})
        rythm = self._normalize_rythm_from_policy(remote_policy)

        # --- Contrat ---
        contract_types = raw_data.get("contractTypes", [])
        contract_type = self._normalize_contract_type(contract_types[0]) if contract_types else None

        # --- Date de publication (microsecondes -> datetime) ---
        posted_at = None
        publish_ts = raw_data.get("publishDate")
        if publish_ts:
            try:
                # L'API retourne des timestamps en microsecondes
                posted_at = datetime.fromtimestamp(publish_ts / 1_000_000, tz=timezone.utc)
            except (OSError, ValueError):
                posted_at = None

        job_offer = {
            "external_id": raw_data.get("id") or raw_data.get("objectID"),
            "title": raw_data.get("title", "").strip(),
            "description": raw_data.get("descriptionPreview", "").strip(),
            "location": location,
            "contract_type": contract_type,
            "min_salary": min_salary,
            "max_salary": max_salary,
            "currency": currency,
            "posted_at": posted_at,
            "rythm": rythm,
            "source": self.source_name,
            "is_moderated": False,
            "ai_summary": None,
            "relevance_score": None,
            "normalized_at": datetime.now(timezone.utc),
            "required_experience": raw_data.get("details", {}).get("requiredExperience"),
            "profession": (
                raw_data.get("profession", {})
                .get("langContent", {})
                .get("fr", {})
                .get("name")
            ),
        }

        return {
            "company":   company,
            "job_offer": job_offer,
            "skills": [
                {"name": s["name"], "relevance": s.get("value")}
                for s in raw_data.get("skillsList", [])
            ],
        }
