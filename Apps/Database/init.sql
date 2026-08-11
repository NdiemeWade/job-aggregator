CREATE TABLE roles ( 
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL, -- Doit supporter les @epitech.eu 
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT, -- Gestion des rôles
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    website_url TEXT
);


CREATE TABLE job_offers (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE, -- ID provenant de l'API WeLoveDevs
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100),
    min_salary INTEGER,
    max_salary INTEGER,
    currency VARCHAR(10) DEFAULT 'EUR',
    posted_at TIMESTAMP,
    rythm VARCHAR(255) DEFAULT 'Sur site',
    required_experience INTEGER,
    profession VARCHAR(100),

    -- Pour la gestion Data & IA
    source VARCHAR(50) DEFAULT 'welovedevs', -- Source obligatoire
    is_moderated BOOLEAN DEFAULT FALSE, -- Interface admin/modération
    ai_summary TEXT, -- Exemple de sortie pour la feature IA
    relevance_score FLOAT, -- Exemple pour la feature Data
    
    normalized_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Preuve de normalisation  
);


CREATE TABLE user_favorite (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    job_offer_id INTEGER REFERENCES job_offers(id) ON DELETE CASCADE
);


CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);


CREATE TABLE job_offer_skills (
    job_offer_id INTEGER REFERENCES job_offers(id) ON DELETE CASCADE,
    skill_id     INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    relevance    FLOAT,   -- la valeur "50.0" de l'API
    PRIMARY KEY (job_offer_id, skill_id)
);

-- ──────────────────────────────────────────────
-- Seed : rôles par défaut
-- ON CONFLICT DO NOTHING = idempotent au redémarrage
-- ──────────────────────────────────────────────

INSERT INTO roles (id, name) VALUES (1, 'admin') ON CONFLICT DO NOTHING;
INSERT INTO roles (id, name) VALUES (2, 'user')  ON CONFLICT DO NOTHING;