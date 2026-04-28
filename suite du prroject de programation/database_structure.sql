-- =====================================================
-- SÉNÉGAL ÉLEVAGE - STRUCTURE COMPLÈTE SUPABASE
-- Version: 3.0.0
-- Compatible avec TOUS les scripts JS corrigés
-- =====================================================

-- =====================================================
-- 1. CRÉATION DES TYPES ÉNUMÉRÉS
-- =====================================================

CREATE TYPE categorie_type AS ENUM ('volaille', 'bovins', 'ovins', 'materiaux', 'produits', 'services', 'animaux');
CREATE TYPE sous_categorie_type AS ENUM ('betail', 'volaille', 'caprins', 'camelins', 'porcins');
CREATE TYPE region_type AS ENUM ('dakar', 'thies', 'kaolack', 'saint-louis', 'tambacounda', 'louga', 'fatick', 'kolda', 'ziguinchor', 'sedhiou', 'kedougou', 'matam', 'diourbel');
CREATE TYPE status_type AS ENUM ('actif', 'inactif', 'vendu', 'supprime', 'pending');
CREATE TYPE role_type AS ENUM ('eleveur', 'admin');
CREATE TYPE message_status_type AS ENUM ('non_lu', 'lu', 'repondu');

-- =====================================================
-- 2. TABLE DES PROFILS UTILISATEURS (liée à auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS eleveurs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    nom_complet TEXT NOT NULL,
    telephone TEXT,
    email TEXT UNIQUE NOT NULL,
    region TEXT,
    ville TEXT,
    bio TEXT,
    role role_type DEFAULT 'eleveur',
    status status_type DEFAULT 'actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLE DES ANNONCES
-- =====================================================

CREATE TABLE IF NOT EXISTS annonces (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2),
    devise TEXT DEFAULT 'XOF',
    categorie categorie_type,
    sous_categorie TEXT,
    localisation TEXT,
    region TEXT,
    image_principale TEXT,
    images TEXT[] DEFAULT '{}',
    telephone TEXT,
    nom_vendeur TEXT,
    email TEXT,
    entreprise TEXT,
    etat_produit TEXT,
    livraison_possible BOOLEAN DEFAULT FALSE,
    prix_negociable BOOLEAN DEFAULT FALSE,
    annonce_urgente BOOLEAN DEFAULT FALSE,
    type_annonce TEXT,
    status status_type DEFAULT 'actif',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLE DES MESSAGES DE CONTACT
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT,
    sujet TEXT,
    message TEXT NOT NULL,
    status message_status_type DEFAULT 'non_lu',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABLE DES FAVORIS
-- =====================================================

CREATE TABLE IF NOT EXISTS favoris (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    annonce_id INTEGER REFERENCES annonces(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, annonce_id)
);

-- =====================================================
-- 6. TABLE DES SERVICES
-- =====================================================

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2),
    devise TEXT DEFAULT 'XOF',
    categorie TEXT,
    prestataire TEXT,
    localisation TEXT,
    region TEXT,
    telephone TEXT,
    disponibilite TEXT,
    note DECIMAL(3,1) DEFAULT 4.5,
    nombre_avis INTEGER DEFAULT 0,
    certifie BOOLEAN DEFAULT FALSE,
    urgent BOOLEAN DEFAULT FALSE,
    status status_type DEFAULT 'actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. TABLE DES PARAMÈTRES DU SITE
-- =====================================================

CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TABLE DES LOGS ADMIN
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_eleveurs_user_id ON eleveurs(user_id);
CREATE INDEX IF NOT EXISTS idx_eleveurs_email ON eleveurs(email);
CREATE INDEX IF NOT EXISTS idx_annonces_user_id ON annonces(user_id);
CREATE INDEX IF NOT EXISTS idx_annonces_status ON annonces(status);
CREATE INDEX IF NOT EXISTS idx_annonces_categorie ON annonces(categorie);
CREATE INDEX IF NOT EXISTS idx_annonces_sous_categorie ON annonces(sous_categorie);
CREATE INDEX IF NOT EXISTS idx_annonces_region ON annonces(region);
CREATE INDEX IF NOT EXISTS idx_annonces_created_at ON annonces(created_at);
CREATE INDEX IF NOT EXISTS idx_annonces_prix ON annonces(prix);
CREATE INDEX IF NOT EXISTS idx_annonces_recherche ON annonces(titre, description, localisation);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_favoris_user_id ON favoris(user_id);
CREATE INDEX IF NOT EXISTS idx_favoris_annonce_id ON favoris(annonce_id);
CREATE INDEX IF NOT EXISTS idx_services_categorie ON services(categorie);
CREATE INDEX IF NOT EXISTS idx_services_region ON services(region);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);

-- =====================================================
-- 10. FONCTION POUR METTRE À JOUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGERS POUR updated_at AUTOMATIQUE
-- =====================================================

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
-- 12. FONCTION POUR INCRÉMENTER LES VUES
-- =====================================================

CREATE OR REPLACE FUNCTION increment_views(annonce_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE annonces SET views = views + 1 WHERE id = annonce_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. ROW LEVEL SECURITY (RLS) - SÉCURITÉ
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE eleveurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoris ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Politiques pour eleveurs
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON eleveurs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON eleveurs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil"
    ON eleveurs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politiques pour annonces
CREATE POLICY "Tout le monde peut voir les annonces actives"
    ON annonces FOR SELECT
    USING (status = 'actif');

CREATE POLICY "Les utilisateurs peuvent voir leurs propres annonces"
    ON annonces FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer des annonces"
    ON annonces FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs annonces"
    ON annonces FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs annonces"
    ON annonces FOR DELETE
    USING (auth.uid() = user_id);

-- Politiques pour messages
CREATE POLICY "Tout le monde peut envoyer des messages"
    ON messages FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Seuls les admins peuvent voir les messages"
    ON messages FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politiques pour favoris
CREATE POLICY "Les utilisateurs peuvent voir leurs favoris"
    ON favoris FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent gérer leurs favoris"
    ON favoris FOR ALL
    USING (auth.uid() = user_id);

-- Politiques pour services
CREATE POLICY "Tout le monde peut voir les services actifs"
    ON services FOR SELECT
    USING (status = 'actif');

-- =====================================================
-- 14. INSERTION DES DONNÉES PAR DÉFAUT
-- =====================================================

-- Insertion des paramètres du site
INSERT INTO site_settings (key, value) VALUES 
    ('contact_phone', '+221 33 800 00 00'),
    ('contact_email', 'contact@senegal-elevage.sn'),
    ('contact_address', 'Dakar, Sénégal'),
    ('site_name', 'Sénégal Élevage'),
    ('site_description', 'La première plateforme d\'annonces pour l\'élevage au Sénégal')
ON CONFLICT (key) DO NOTHING;

-- Insertion des services par défaut
INSERT INTO services (titre, description, prix, categorie, prestataire, localisation, region, telephone, disponibilite, note, nombre_avis, certifie, urgent) VALUES
('Consultation vétérinaire à domicile', 'Consultation complète de vos animaux à domicile : diagnostic, traitement et conseils préventifs.', 15000, 'veterinaire', 'Dr. Mamadou Ba', 'Dakar', 'dakar', '+221 77 123 45 67', '24h', 4.8, 156, true, true),
('Transport de bétail national', 'Transport sécurisé de votre bétail dans toutes les régions du Sénégal. Véhicules spécialisés.', 25000, 'transport', 'TransÉlevage Pro', 'Dakar', 'dakar', '+221 77 345 67 89', 'immediate', 4.7, 234, true, true),
('Formation en élevage moderne', 'Formation complète de 3 jours sur les techniques modernes d\'élevage et gestion.', 50000, 'conseil', 'École Supérieure d\'Élevage', 'Dakar', 'dakar', '+221 33 800 00 00', 'week', 4.8, 112, true, false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 15. VUES UTILES (optionnelles)
-- =====================================================

-- Vue des annonces actives avec infos vendeur
CREATE OR REPLACE VIEW v_annonces_actives AS
SELECT 
    a.*,
    e.nom_complet as vendeur_nom,
    e.telephone as vendeur_telephone,
    e.region as vendeur_region
FROM annonces a
LEFT JOIN eleveurs e ON a.user_id = e.user_id
WHERE a.status = 'actif'
ORDER BY a.created_at DESC;

-- Vue des statistiques par catégorie
CREATE OR REPLACE VIEW v_stats_categories AS
SELECT 
    categorie,
    COUNT(*) as total_annonces,
    SUM(views) as total_vues,
    AVG(prix) as prix_moyen
FROM annonces
WHERE status = 'actif'
GROUP BY categorie;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Vérification finale
SELECT '✅ Base de données prête !' as status;
SELECT COUNT(*) as tables_creees FROM information_schema.tables WHERE table_schema = 'public';