-- Structure de la base de données pour Sénégal Élevage (PostgreSQL pour Supabase)

-- Activation des extensions UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des catégories (pour plus de flexibilité)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des catégories par défaut
INSERT INTO categories (nom, description, icone) VALUES
('volaille', 'Poules, canards, dindes, pintades', '🐔'),
('bovins', 'Vaches, taureaux, veaux, bœufs', '🐄'),
('ovins', 'Moutons, chèvres, béliers', '🐑'),
('materiaux', 'Matériel d''élevage, abris, équipements', '🔧'),
('produits', 'Lait, viande, œufs, fromages, cuir', '🥛'),
('services', 'Services vétérinaires, transport, conseil', '🤝')
ON CONFLICT (nom) DO NOTHING;

-- Table des annonces
CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    categorie VARCHAR(50) NOT NULL REFERENCES categories(nom), -- Foreign key to categories name if desired, or keep as string
    prix DECIMAL(10,2) NOT NULL,
    localisation VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL, -- Enum handled as check constraint or string in simple setup
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    images JSONB, -- Stocke les chemins des images en format JSONB
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'vendu', 'supprime')),
    views INT DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) -- Optional linking to Supabase Auth
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_annonces_categorie ON annonces(categorie);
CREATE INDEX IF NOT EXISTS idx_annonces_region ON annonces(region);
CREATE INDEX IF NOT EXISTS idx_annonces_status ON annonces(status);
CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON annonces(created_at);
CREATE INDEX IF NOT EXISTS idx_annonces_prix ON annonces(prix);

-- Table des utilisateurs (Profils publics liés à auth.users)
CREATE TABLE IF NOT EXISTS profils (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nom VARCHAR(255),
    telephone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'eleveur' CHECK (role IN ('admin', 'eleveur', 'acheteur')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_annonces_modtime
    BEFORE UPDATE ON annonces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profils ENABLE ROW LEVEL SECURITY;                             

-- Lecture publique pour tous
CREATE POLICY "Les annonces sont publiques" 
ON annonces FOR SELECT 
USING (status = 'actif');

-- Création pour utilisateurs authentifiés uniquement
CREATE POLICY "Les utilisateurs peuvent créer des annonces" 
ON annonces FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Mise à jour pour le propriétaire uniquement
CREATE POLICY "Les utilisateurs peuvent modifier leurs annonces" 
ON annonces FOR UPDATE 
USING (auth.uid() = user_id);

-- Suppression pour le propriétaire uniquement
CREATE POLICY "Les utilisateurs peuvent supprimer leurs annonces" 
ON annonces FOR DELETE 
USING (auth.uid() = user_id);

-- Profils: lecture publique, modification owner
CREATE POLICY "Profils publics" ON profils FOR SELECT USING (true);
CREATE POLICY "Utilisateur modifie son profil" ON profils FOR UPDATE USING (auth.uid() = id);

        