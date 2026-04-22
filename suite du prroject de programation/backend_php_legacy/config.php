<?php
// =============================================================================
// FICHIER DE CONFIGURATION - BASE DE DONNÉES SÉNÉGAL ÉLEVAGE
// =============================================================================
// 
// Ce fichier contient tous les paramètres de configuration pour votre application
// Modifiez ces valeurs selon votre environnement
//
// =============================================================================

// =============================================================================
// CONFIGURATION DE LA BASE DE DONNÉES
// =============================================================================

// Type de base de données (mysql, pgsql, sqlite)
define('DB_TYPE', 'mysql');

// Informations de connexion à la base de données
define('DB_HOST', 'localhost');        // Hôte de la base de données
define('DB_NAME', 'senegal_elevage'); // Nom de la base de données
define('DB_USER', 'root');            // Nom d'utilisateur
define('DB_PASS', '');                 // Mot de passe (laisser vide pour XAMPP/WAMP)

// Port de la base de données (optionnel)
define('DB_PORT', '3306');

// Charset pour la connexion
define('DB_CHARSET', 'utf8mb4');

// =============================================================================
// CONFIGURATION DES UPLOADS
// =============================================================================

// Répertoire où les images seront stockées
define('UPLOAD_DIR', 'uploads/');

// URL de base pour accéder aux images uploadées
define('UPLOAD_URL', 'uploads/');

// Taille maximale des fichiers (en octets)
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB

// Types de fichiers autorisés
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Nombre maximum d'images par annonce
define('MAX_IMAGES_PER_ANNONCE', 5);

// =============================================================================
// CONFIGURATION DE L'APPLICATION
// =============================================================================

// URL de base de votre application
define('BASE_URL', 'http://localhost/suite-du-prroject-de-programation/');

// Nom de l'application
define('APP_NAME', 'Sénégal Élevage');

// Email de contact
define('CONTACT_EMAIL', 'contact@senegalelevage.sn');

// Téléphone de contact
define('CONTACT_PHONE', '+221 76 464 45 97');

// =============================================================================
// CONFIGURATION DE LA SÉCURITÉ
// =============================================================================

// Clé secrète pour les sessions (changez-la pour plus de sécurité)
define('SECRET_KEY', 'votre_cle_secrete_ici_changez_la');

// Durée de vie des sessions (en secondes)
define('SESSION_LIFETIME', 86400); // 24 heures

// Activer/désactiver le mode debug
define('DEBUG_MODE', true);

// =============================================================================
// CONFIGURATION DES EMAILS
// =============================================================================

// Configuration SMTP pour l'envoi d'emails
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', 'votre_email@gmail.com');
define('SMTP_PASSWORD', 'votre_mot_de_passe_app');
define('SMTP_ENCRYPTION', 'tls');

// Email expéditeur par défaut
define('FROM_EMAIL', 'noreply@senegalelevage.sn');
define('FROM_NAME', 'Sénégal Élevage');

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Connexion à la base de données avec PDO
 * @return PDO
 */
function getDatabaseConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = DB_TYPE . ':host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            
            if (DB_TYPE === 'mysql') {
                $dsn .= ';port=' . DB_PORT;
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            if (DEBUG_MODE) {
                die('Erreur de connexion à la base de données: ' . $e->getMessage());
            } else {
                die('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
            }
        }
    }
    
    return $pdo;
}

/**
 * Fonction de débogage
 * @param mixed $data
 * @param string $label
 */
function debug($data, $label = '') {
    if (DEBUG_MODE) {
        echo '<pre style="background: #f0f0f0; padding: 10px; margin: 10px; border: 1px solid #ccc;">';
        if ($label) {
            echo '<strong>' . htmlspecialchars($label) . ':</strong><br>';
        }
        if (is_array($data) || is_object($data)) {
            print_r($data);
        } else {
            var_dump($data);
        }
        echo '</pre>';
    }
}

/**
 * Nettoyer une chaîne de caractères
 * @param string $string
 * @return string
 */
function cleanString($string) {
    return htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');
}

/**
 * Valider un email
 * @param string $email
 * @return bool
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Formater un prix en FCFA
 * @param float $prix
 * @return string
 */
function formatPrix($prix) {
    return number_format($prix, 0, ',', ' ') . ' FCFA';
}

/**
 * Générer une URL unique pour une image
 * @param string $originalName
 * @return string
 */
function generateUniqueFileName($originalName) {
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    return uniqid('annonce_', true) . '.' . $extension;
}

/**
 * Rediriger vers une URL
 * @param string $url
 * @return void
 */
function redirect($url) {
    header('Location: ' . $url);
    exit();
}

/**
 * Afficher un message flash
 * @param string $message
 * @param string $type (success, error, warning, info)
 * @return void
 */
function setFlashMessage($message, $type = 'info') {
    if (!isset($_SESSION['flash_messages'])) {
        $_SESSION['flash_messages'] = [];
    }
    $_SESSION['flash_messages'][] = ['message' => $message, 'type' => $type];
}

/**
 * Récupérer et effacer les messages flash
 * @return array
 */
function getFlashMessages() {
    $messages = $_SESSION['flash_messages'] ?? [];
    unset($_SESSION['flash_messages']);
    return $messages;
}

// Démarrer la session
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_lifetime' => SESSION_LIFETIME,
        'cookie_httponly' => true,
        'cookie_secure' => false, // Mettre à true en HTTPS
        'use_strict_mode' => true,
    ]);
}

// Créer le répertoire d'upload s'il n'existe pas
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Protection contre les attaques CSRF
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

/**
 * Générer un token CSRF
 * @return string
 */
function generateCsrfToken() {
    return $_SESSION['csrf_token'];
}

/**
 * Vérifier un token CSRF
 * @param string $token
 * @return bool
 */
function verifyCsrfToken($token) {
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

// =============================================================================
// FIN DU FICHIER DE CONFIGURATION
// =============================================================================
?>
