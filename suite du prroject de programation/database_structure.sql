-- Structure de la base de données pour Sénégal Élevage
-- Créez cette base de données avec : CREATE DATABASE senegal_elevage;

-- Utilisation de la base de données
USE senegal_elevage;

-- Table des annonces
CREATE TABLE IF NOT EXISTS annonces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    categorie ENUM('volaille', 'bovins', 'ovins', 'materiaux', 'produits', 'services') NOT NULL,
    prix DECIMAL(10,2) NOT NULL,
    localisation VARCHAR(255) NOT NULL,
    region ENUM('dakar', 'thies', 'kaolack', 'saint-louis', 'tambacounda', 'louga', 'fatick', 'kolda', 'ziguinchor', 'sedhiou', 'kedougou', 'matam', 'diourbel') NOT NULL,
    nom VARCHAR(255) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    images JSON, -- Stocke les chemins des images en format JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('actif', 'inactif', 'vendu', 'supprime') DEFAULT 'actif',
    views INT DEFAULT 0,
    INDEX idx_categorie (categorie),
    INDEX idx_region (region),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_prix (prix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs (optionnel pour la gestion des comptes)
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'eleveur', 'acheteur') DEFAULT 'eleveur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('actif', 'inactif', 'banni') DEFAULT 'actif',
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des catégories (pour plus de flexibilité)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des catégories par défaut
INSERT INTO categories (nom, description, icone) VALUES
('volaille', 'Poules, canards, dindes, pintades', '🐔'),
('bovins', 'Vaches, taureaux, veaux, bœufs', '🐄'),
('ovins', 'Moutons, chèvres, béliers', '🐑'),
('materiaux', 'Matériel d\'élevage, abris, équipements', '🔧'),
('produits', 'Lait, viande, œufs, fromages, cuir', '🥛'),
('services', 'Services vétérinaires, transport, conseil', '🤝');

-- Table des messages (pour la communication entre utilisateurs)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annonce_id INT NOT NULL,
    expediteur_id INT,
    destinataire_id INT,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL,
    FOREIGN KEY (destinataire_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    INDEX idx_annonce (annonce_id),
    INDEX idx_expediteur (expediteur_id),
    INDEX idx_destinataire (destinataire_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des statistiques de visites
CREATE TABLE IF NOT EXISTS statistiques_visites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    annonce_id INT NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    date_visite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    INDEX idx_annonce (annonce_id),
    INDEX idx_date (date_visite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vue pour les annonces actives avec informations complètes
CREATE VIEW v_annonces_actives AS
SELECT 
    a.id,
    a.titre,
    a.description,
    a.categorie,
    a.prix,
    a.localisation,
    a.region,
    a.nom,
    a.telephone,
    a.email,
    a.images,
    a.created_at,
    a.updated_at,
    a.status,
    a.views,
    c.nom as nom_categorie,
    c.icone as icone_categorie
FROM annonces a
LEFT JOIN categories c ON a.categorie = c.nom
WHERE a.status = 'actif'
ORDER BY a.created_at DESC;

-- Procédure stockée pour incrémenter les vues
DELIMITER //
CREATE PROCEDURE incrementer_vues(IN annonce_id_param INT)
BEGIN
    UPDATE annonces 
    SET views = views + 1 
    WHERE id = annonce_id_param;
    
    -- Insérer dans les statistiques
    INSERT INTO statistiques_visites (annonce_id, ip, user_agent)
    VALUES (annonce_id_param, CONNECTION_ID(), USER());
END //
DELIMITER ;

-- Trigger pour mettre à jour le champ updated_at
DELIMITER //
CREATE TRIGGER before_annonces_update 
BEFORE UPDATE ON annonces
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Exemples de données de test
INSERT INTO annonces (titre, description, categorie, prix, localisation, region, nom, telephone, email, images) VALUES
('Poules pondeuses de race', 'Magnifiques poules pondeuses de 6 mois, très productives. Vaccinées et en parfaite santé. Prix par unité.', 'volaille', 5000.00, 'Dakar, Plateau', 'dakar', 'Mamadou Diallo', '+221 77 123 45 67', 'mamadou@email.com', '["uploads/poule1.jpg", "uploads/poule2.jpg"]'),
('Vaches laitières Holstein', 'Vaches laitières Holstein de 2 ans, excellentes productrices. Enregistrements sanitaires complets.', 'bovins', 350000.00, 'Thiès, Mbour', 'thies', 'Alioune Faye', '+221 76 987 65 43', 'alioune@email.com', '["uploads/vache1.jpg"]'),
('Moutons de race Djallonké', 'Béliers Djallonké de qualité supérieure, parfaits pour la reproduction. Robustes et adaptés au climat sénégalais.', 'ovins', 45000.00, 'Kaolack', 'kaolack', 'Oumar Sarr', '+221 78 234 56 78', 'oumar@email.com', '["uploads/mouton1.jpg", "uploads/mouton2.jpg", "uploads/mouton3.jpg"]');

-- Index pour optimiser les performances
CREATE INDEX idx_annonces_recherche ON annonces(titre, description, localisation);
CREATE INDEX idx_annonces_filtres ON annonces(categorie, region, status, prix);

-- Configuration des permissions (à adapter selon votre environnement)
-- GRANT ALL PRIVILEGES ON senegal_elevage.* TO 'votre_utilisateur'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
-- FLUSH PRIVILEGES;
