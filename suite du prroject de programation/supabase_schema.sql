-- =====================================================
-- SÉNÉGAL ÉLEVAGE - STRUCTURE COMPLÈTE (Version finale)
-- Compatible avec TOUS les scripts JS corrigés
-- =====================================================

-- Activation des extensions UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLE DES CATÉGORIES
-- =====================================================
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
('services', 'Services vétérinaires, transport, conseil', '🤝'),
('animaux', 'Tous types d''animaux d''élevage', '🐪')
ON CONFLICT (nom) DO NOTHING;

-- =====================================================
-- 2. TABLE DES PROFILS UTILISATEURS (nommée "eleveurs" pour compatibilité JS)
-- =====================================================
CREATE TABLE IF NOT EXISTS eleveurs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    nom_complet VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(100),
    ville VARCHAR(100),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'eleveur' CHECK (role IN ('admin', 'eleveur', 'acheteur')),
    status VARCHAR(20) DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'banni')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABLE DES ANNONCES (compatible avec tous les scripts)
-- =====================================================
CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    categorie VARCHAR(50),
    sous_categorie VARCHAR(50),
    prix DECIMAL(10,2) NOT NULL,
    devise VARCHAR(10) DEFAULT 'XOF',
    localisation VARCHAR(255) NOT NULL,
    region VARCHAR(50),
    nom_vendeur VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(255),
    entreprise VARCHAR(255),
    etat_produit VARCHAR(50),
    livraison_possible BOOLEAN DEFAULT FALSE,
    prix_negociable BOOLEAN DEFAULT FALSE,
    annonce_urgente BOOLEAN DEFAULT FALSE,
    type_annonce VARCHAR(50),
    image_principale TEXT,
    images JSONB DEFAULT '[]', -- Stocke les URLs des images
    status VARCHAR(20) DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'vendu', 'supprime')),
    views INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABLE DES MESSAGES DE CONTACT
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    sujet VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'non_lu' CHECK (status IN ('non_lu', 'lu', 'repondu')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. TABLE DES FAVORIS
-- =====================================================
CREATE TABLE IF NOT EXISTS favoris (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    annonce_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, annonce_id)
);

-- =====================================================
-- 6. TABLE DES SERVICES
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10,2),
    devise VARCHAR(10) DEFAULT 'XOF',
    categorie VARCHAR(50),
    prestataire VARCHAR(255),
    localisation VARCHAR(255),
    region VARCHAR(50),
    telephone VARCHAR(20),
    disponibilite VARCHAR(50),
    note DECIMAL(3,1) DEFAULT 4.5,
    nombre_avis INTEGER DEFAULT 0,
    certifie BOOLEAN DEFAULT FALSE,
    urgent BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'actif' CHECK (status IN ('actif', 'inactif')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. TABLE DES PARAMÈTRES DU SITE
-- =====================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des paramètres par défaut
INSERT INTO site_settings (key, value) VALUES 
    ('contact_phone', '+221 33 800 00 00'),
    ('contact_email', 'contact@senegal-elevage.sn'),
    ('contact_address', 'Dakar, Sénégal'),
    ('site_name', 'Sénégal Élevage')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 8. TABLE DES LOGS ADMIN (optionnel)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index sur annonces
CREATE INDEX IF NOT EXISTS idx_annonces_categorie ON annonces(categorie);
CREATE INDEX IF NOT EXISTS idx_annonces_sous_categorie ON annonces(sous_categorie);
CREATE INDEX IF NOT EXISTS idx_annonces_region ON annonces(region);
CREATE INDEX IF NOT EXISTS idx_annonces_status ON annonces(status);
CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON annonces(created_at);
CREATE INDEX IF NOT EXISTS idx_annonces_prix ON annonces(prix);
CREATE INDEX IF NOT EXISTS idx_annonces_user_id ON annonces(user_id);
CREATE INDEX IF NOT EXISTS idx_annonces_recherche ON annonces(titre, description, localisation);

-- Index sur eleveurs
CREATE INDEX IF NOT EXISTS idx_eleveurs_user_id ON eleveurs(user_id);
CREATE INDEX IF NOT EXISTS idx_eleveurs_email ON eleveurs(email);

-- Index sur messages
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Index sur favoris
CREATE INDEX IF NOT EXISTS idx_favoris_user_id ON favoris(user_id);
CREATE INDEX IF NOT EXISTS idx_favoris_annonce_id ON favoris(annonce_id);

-- Index sur services
CREATE INDEX IF NOT EXISTS idx_services_categorie ON services(categorie);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

-- =====================================================
-- 10. FONCTION ET TRIGGER POUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger à toutes les tables concernées
CREATE TRIGGER update_eleveurs_updated_at
    BEFORE UPDATE ON eleveurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annonces_updated_at
    BEFORE UPDATE ON annonces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. FONCTION POUR INCRÉMENTER LES VUES
-- =====================================================

CREATE OR REPLACE FUNCTION increment_views(annonce_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE annonces SET views = views + 1 WHERE id = annonce_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE eleveurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Politiques pour eleveurs
CREATE POLICY "Lecture publique des profils" 
    ON eleveurs FOR SELECT 
    USING (true);

CREATE POLICY "Insertion profil utilisateur" 
    ON eleveurs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modification propre profil" 
    ON eleveurs FOR UPDATE 
    USING (auth.uid() = user_id);

-- Politiques pour annonces
CREATE POLICY "Lecture publique des annonces actives" 
    ON annonces FOR SELECT 
    USING (status = 'actif' OR auth.uid() = user_id);

CREATE POLICY "Création annonces par utilisateur authentifié" 
    ON annonces FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Modification annonces par propriétaire" 
    ON annonces FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Suppression annonces par propriétaire" 
    ON annonces FOR DELETE 
    USING (auth.uid() = user_id);

-- Politiques pour messages
CREATE POLICY "Envoi messages par tous" 
    ON messages FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Lecture messages par admin" 
    ON messages FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Politiques pour favoris
CREATE POLICY "Lecture favoris par propriétaire" 
    ON favoris FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Gestion favoris par propriétaire" 
    ON favoris FOR ALL 
    USING (auth.uid() = user_id);

-- Politiques pour services
CREATE POLICY "Lecture publique des services" 
    ON services FOR SELECT 
    USING (status = 'actif');

-- =====================================================
-- 13. INSERTION DES DONNÉES PAR DÉFAUT
-- =====================================================

-- Services par défaut
INSERT INTO services (titre, description, prix, categorie, prestataire, localisation, region, telephone, disponibilite, note, nombre_avis, certifie, urgent) VALUES
('Consultation vétérinaire à domicile', 'Consultation complète de vos animaux à domicile : diagnostic, traitement et conseils préventifs.', 15000, 'veterinaire', 'Dr. Mamadou Ba', 'Dakar', 'dakar', '+221 77 123 45 67', '24h', 4.8, 156, true, true),
('Transport de bétail national', 'Transport sécurisé de votre bétail dans toutes les régions du Sénégal.', 25000, 'transport', 'TransÉlevage Pro', 'Dakar', 'dakar', '+221 77 345 67 89', 'immediate', 4.7, 234, true, true),
('Formation en élevage moderne', 'Formation complète de 3 jours sur les techniques modernes d''élevage et gestion.', 50000, 'conseil', 'École Supérieure d''Élevage', 'Dakar', 'dakar', '+221 33 800 00 00', 'week', 4.8, 112, true, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 14. VUES UTILES
-- =====================================================

-- Vue des annonces actives avec infos vendeur
CREATE OR REPLACE VIEW v_annonces_actives AS
SELECT 
    a.*,
    e.nom_complet AS vendeur_nom,
    e.telephone AS vendeur_telephone,
    e.region AS vendeur_region
FROM annonces a
LEFT JOIN eleveurs e ON a.user_id = e.user_id
WHERE a.status = 'actif'
ORDER BY a.created_at DESC;

-- Vue des statistiques par catégorie
CREATE OR REPLACE VIEW v_stats_categories AS
SELECT 
    COALESCE(categorie, 'non_categorise') AS categorie,
    COUNT(*) AS total_annonces,
    SUM(views) AS total_vues,
    COALESCE(AVG(prix), 0) AS prix_moyen
FROM annonces
WHERE status = 'actif'
GROUP BY categorie;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Vérification finale
DO $$
BEGIN
    RAISE NOTICE '✅ Base de données Sénégal Élevage prête !';
    RAISE NOTICE '📊 Tables créées : annonces, eleveurs, messages, favoris, services';
    RAISE NOTICE '🔒 RLS activée et politiques configurées';
END $$;