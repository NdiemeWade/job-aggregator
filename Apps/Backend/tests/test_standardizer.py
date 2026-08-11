"""
Tests unitaires pour le module de normalisation des données (Standardizer).

Couvre les fonctions de nettoyage et normalisation :
  - _clean_salary
  - _parse_salary_range
  - _normalize_contract_type
  - _parse_location
  - _normalize_rythm_from_policy
  - standardize (pipeline complet)
"""

import pytest
from datetime import datetime

from Apps.Backend.src.services.Standardizer import JobStandardizer


@pytest.fixture
def standardizer():
    return JobStandardizer()


# ──────────────────────────────────────────────
# _clean_salary
# ──────────────────────────────────────────────

class TestCleanSalary:
    def test_salary_with_k_suffix(self, standardizer):
        assert standardizer._clean_salary("45k") == 45000

    def test_salary_with_k_suffix_uppercase(self, standardizer):
        assert standardizer._clean_salary("45K") == 45000

    def test_salary_plain_number(self, standardizer):
        assert standardizer._clean_salary("60000") == 60000

    def test_salary_with_spaces(self, standardizer):
        assert standardizer._clean_salary("60 000") == 60000

    def test_salary_with_euro_symbol(self, standardizer):
        assert standardizer._clean_salary("45000€") == 45000

    def test_salary_with_per_year(self, standardizer):
        assert standardizer._clean_salary("45000/an") == 45000

    def test_salary_none(self, standardizer):
        assert standardizer._clean_salary(None) is None

    def test_salary_empty_string(self, standardizer):
        assert standardizer._clean_salary("") is None

    def test_salary_invalid_string(self, standardizer):
        assert standardizer._clean_salary("abc") is None

    def test_salary_float_k(self, standardizer):
        assert standardizer._clean_salary("45.5k") == 45500


# ──────────────────────────────────────────────
# _parse_salary_range
# ──────────────────────────────────────────────

class TestParseSalaryRange:
    def test_range_with_arrow(self, standardizer):
        min_s, max_s = standardizer._parse_salary_range("45k \u2192 60k")
        assert min_s == 45000
        assert max_s == 60000

    def test_range_with_dash(self, standardizer):
        min_s, max_s = standardizer._parse_salary_range("45k - 60k")
        assert min_s == 45000
        assert max_s == 60000

    def test_single_value(self, standardizer):
        min_s, max_s = standardizer._parse_salary_range("50k")
        assert min_s == 50000
        assert max_s == 50000

    def test_none_input(self, standardizer):
        min_s, max_s = standardizer._parse_salary_range(None)
        assert min_s is None
        assert max_s is None

    def test_empty_string(self, standardizer):
        min_s, max_s = standardizer._parse_salary_range("")
        assert min_s is None
        assert max_s is None


# ──────────────────────────────────────────────
# _normalize_contract_type
# ──────────────────────────────────────────────

class TestNormalizeContractType:
    def test_cdi(self, standardizer):
        assert standardizer._normalize_contract_type("cdi") == "CDI"

    def test_cdi_uppercase(self, standardizer):
        assert standardizer._normalize_contract_type("CDI") == "CDI"

    def test_cdd(self, standardizer):
        assert standardizer._normalize_contract_type("CDD") == "CDD"

    def test_freelance(self, standardizer):
        assert standardizer._normalize_contract_type("freelance") == "Freelance"

    def test_stage(self, standardizer):
        assert standardizer._normalize_contract_type("stage") == "Stage"

    def test_alternance(self, standardizer):
        assert standardizer._normalize_contract_type("alternance") == "Alternance"

    def test_intern_maps_to_stage(self, standardizer):
        assert standardizer._normalize_contract_type("intern") == "Stage"

    def test_contract_maps_to_freelance(self, standardizer):
        assert standardizer._normalize_contract_type("contract") == "Freelance"

    def test_none_input(self, standardizer):
        assert standardizer._normalize_contract_type(None) is None

    def test_unknown_type_preserved(self, standardizer):
        assert standardizer._normalize_contract_type("Interim") == "Interim"

    def test_whitespace_trimmed(self, standardizer):
        assert standardizer._normalize_contract_type("  cdi  ") == "CDI"


# ──────────────────────────────────────────────
# _parse_location
# ──────────────────────────────────────────────

class TestParseLocation:
    def test_simple_location(self, standardizer):
        assert standardizer._parse_location("Paris, FR") == "Paris, FR"

    def test_location_with_teletravail(self, standardizer):
        result = standardizer._parse_location("Villeneuve-d'Ascq, FR - T\u00e9l\u00e9travail")
        assert result == "Villeneuve-d'Ascq, FR"

    def test_location_with_remote(self, standardizer):
        result = standardizer._parse_location("Lyon, FR - Remote")
        assert result == "Lyon, FR"

    def test_none_input(self, standardizer):
        assert standardizer._parse_location(None) == "Non renseign\u00e9"

    def test_empty_string(self, standardizer):
        assert standardizer._parse_location("") == "Non renseign\u00e9"


# ──────────────────────────────────────────────
# _normalize_rythm_from_policy
# ──────────────────────────────────────────────

class TestNormalizeRythmFromPolicy:
    def test_full_remote(self, standardizer):
        policy = {"frequency": "fullTime"}
        assert standardizer._normalize_rythm_from_policy(policy) == "Full remote"

    def test_hybrid(self, standardizer):
        policy = {"frequency": "hybrid"}
        assert standardizer._normalize_rythm_from_policy(policy) == "T\u00e9l\u00e9travail hybride"

    def test_on_site(self, standardizer):
        policy = {"frequency": "onSite"}
        assert standardizer._normalize_rythm_from_policy(policy) == "Sur site"

    def test_unknown_frequency(self, standardizer):
        policy = {"frequency": "unknown"}
        assert standardizer._normalize_rythm_from_policy(policy) == "Sur site"

    def test_empty_policy(self, standardizer):
        assert standardizer._normalize_rythm_from_policy({}) == "Sur site"


# ──────────────────────────────────────────────
# standardize (pipeline complet)
# ──────────────────────────────────────────────

class TestStandardize:
    @pytest.fixture
    def raw_welovedevs_job(self):
        """Simule une offre brute de l'API WeLoveDevs."""
        return {
            "id": "wld-12345",
            "objectID": "wld-12345",
            "title": "  D\u00e9veloppeur Python Senior  ",
            "descriptionPreview": "  Rejoignez notre \u00e9quipe tech...  ",
            "smallCompany": {
                "companyName": "TechCorp",
                "seoAlias": "techcorp",
            },
            "formattedPlaces": ["Paris, FR"],
            "contractTypes": ["cdi"],
            "details": {
                "salary": {
                    "min": 45,
                    "max": 65,
                    "currency": "\u20ac",
                },
                "remotePolicy": {
                    "frequency": "hybrid",
                },
                "requiredExperience": 5,
            },
            "publishDate": 1700000000000000,
            "profession": {
                "langContent": {
                    "fr": {
                        "name": "D\u00e9veloppeur backend",
                    }
                }
            },
            "skillsList": [
                {"name": "Python", "value": 90.0},
                {"name": "FastAPI", "value": 70.0},
            ],
        }

    def test_standardize_returns_correct_structure(self, standardizer, raw_welovedevs_job):
        result = standardizer.standardize(raw_welovedevs_job)
        assert "company" in result
        assert "job_offer" in result
        assert "skills" in result

    def test_standardize_company_fields(self, standardizer, raw_welovedevs_job):
        result = standardizer.standardize(raw_welovedevs_job)
        company = result["company"]
        assert company["name"] == "TechCorp"
        assert "techcorp" in company["website_url"]

    def test_standardize_job_offer_fields(self, standardizer, raw_welovedevs_job):
        result = standardizer.standardize(raw_welovedevs_job)
        job = result["job_offer"]
        assert job["external_id"] == "wld-12345"
        assert job["title"] == "D\u00e9veloppeur Python Senior"
        assert job["description"] == "Rejoignez notre \u00e9quipe tech..."
        assert job["location"] == "Paris, FR"
        assert job["contract_type"] == "CDI"
        assert job["min_salary"] == 45000
        assert job["max_salary"] == 65000
        assert job["currency"] == "EUR"
        assert job["rythm"] == "T\u00e9l\u00e9travail hybride"
        assert job["source"] == "WeLoveDevs"
        assert job["required_experience"] == 5
        assert job["profession"] == "D\u00e9veloppeur backend"

    def test_standardize_skills(self, standardizer, raw_welovedevs_job):
        result = standardizer.standardize(raw_welovedevs_job)
        skills = result["skills"]
        assert len(skills) == 2
        assert skills[0]["name"] == "Python"
        assert skills[0]["relevance"] == 90.0
        assert skills[1]["name"] == "FastAPI"

    def test_standardize_posted_at_conversion(self, standardizer, raw_welovedevs_job):
        result = standardizer.standardize(raw_welovedevs_job)
        job = result["job_offer"]
        assert job["posted_at"] is not None
        assert isinstance(job["posted_at"], datetime)

    def test_standardize_empty_data_raises_error(self, standardizer):
        with pytest.raises(ValueError, match="raw_data est vide"):
            standardizer.standardize(None)

        with pytest.raises(ValueError, match="raw_data est vide"):
            standardizer.standardize({})

    def test_standardize_missing_optional_fields(self, standardizer):
        minimal_raw = {
            "id": "min-001",
            "title": "Dev Junior",
            "descriptionPreview": "Poste junior",
        }
        result = standardizer.standardize(minimal_raw)
        job = result["job_offer"]
        assert job["external_id"] == "min-001"
        assert job["title"] == "Dev Junior"
        assert job["min_salary"] is None
        assert job["max_salary"] is None
        assert job["contract_type"] is None
        assert job["location"] == "Non renseign\u00e9"
        assert job["rythm"] == "Sur site"

    def test_standardize_no_skills(self, standardizer):
        raw = {
            "id": "no-skills-001",
            "title": "Test Job",
            "descriptionPreview": "Desc",
        }
        result = standardizer.standardize(raw)
        assert result["skills"] == []

    def test_standardize_company_unknown_when_missing(self, standardizer):
        raw = {
            "id": "no-company-001",
            "title": "Test Job",
            "descriptionPreview": "Desc",
        }
        result = standardizer.standardize(raw)
        assert result["company"]["name"] == "Inconnue"
