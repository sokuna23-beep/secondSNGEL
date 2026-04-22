<?php
/**
 * =============================================================================
 * CONFIGURATION PHP IDÉALE - SÉNÉGAL ÉLEVAGE
 * =============================================================================
 * 
 * Configuration professionnelle et sécurisée pour l'application
 * Adaptée pour un environnement de production et développement
 * 
 * @author Sénégal Élevage Team
 * @version 2.0
 * @since 2025
 * 
 */

// =============================================================================
// DÉTECTION DE L'ENVIRONNEMENT
// =============================================================================

// Détection automatique de l'environnement
define('ENVIRONMENT', 
    $_SERVER['SERVER_NAME'] === 'localhost' || 
    $_SERVER['SERVER_NAME'] === '127.0.0.1' || 
    strpos($_SERVER['SERVER_NAME'], '.local') !== false ? 
    'development' : 'production'
);

// Mode debug selon l'environnement
define('DEBUG_MODE', ENVIRONMENT === 'development');
define('ERROR_REPORTING', ENVIRONMENT === 'development');

// Configuration des erreurs
if (ERROR_REPORTING) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// =============================================================================
// CONFIGURATION DE LA BASE DE DONNÉES
// =============================================================================

// Configuration selon l'environnement
if (ENVIRONMENT === 'development') {
    // Configuration locale (XAMPP, WAMP, MAMP)
    define('DB_HOST', 'localhost');
    define('DB_NAME', 'senegal_elevage_dev');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_PORT', '3306');
    define('DB_CHARSET', 'utf8mb4');
    define('DB_COLLATION', 'utf8mb4_unicode_ci');
} else {
    // Configuration production (à adapter)
    define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
    define('DB_NAME', $_ENV['DB_NAME'] ?? 'senegal_elevage_prod');
    define('DB_USER', $_ENV['DB_USER'] ?? 'db_user');
    define('DB_PASS', $_ENV['DB_PASS'] ?? 'db_password');
    define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
    define('DB_CHARSET', 'utf8mb4');
    define('DB_COLLATION', 'utf8mb4_unicode_ci');
}

// =============================================================================
// CONFIGURATION DE L'APPLICATION
// =============================================================================

// URLs de l'application
define('BASE_URL', ENVIRONMENT === 'development' ? 
    'http://localhost/suite-du-prroject-de-programation/' : 
    'https://senegal-elevage.com'
);

define('ASSETS_URL', BASE_URL . 'assets/');
define('UPLOADS_URL', BASE_URL . 'uploads/');

// Informations de l'application
define('APP_NAME', 'Sénégal Élevage');
define('APP_VERSION', '2.0.0');
define('APP_DESCRIPTION', 'Plateforme de digitalisation pour les éleveurs sénégalais');
define('APP_AUTHOR', 'Sénégal Élevage Team');

// Contact
define('CONTACT_EMAIL', 'contact@senegalelevage.sn');
define('CONTACT_PHONE', '+221 76 464 45 97');
define('CONTACT_ADDRESS', 'Dakar, Sénégal');

// =============================================================================
// CONFIGURATION DE LA SÉCURITÉ
// =============================================================================

// Clés de sécurité (à générer avec: openssl rand -base64 32)
define('APP_KEY', ENVIRONMENT === 'development' ? 
    'dev_key_change_in_production' : 
    ($_ENV['APP_KEY'] ?? 'generate_secure_key_here')
);

define('JWT_SECRET', ENVIRONMENT === 'development' ? 
    'dev_jwt_secret_change_in_production' : 
    ($_ENV['JWT_SECRET'] ?? 'generate_jwt_secret_here')
);

// Configuration des sessions
define('SESSION_LIFETIME', 86400); // 24 heures
define('SESSION_PATH', '/');
define('SESSION_DOMAIN', ENVIRONMENT === 'development' ? '' : '.senegal-elevage.com');
define('SESSION_SECURE', ENVIRONMENT === 'production');
define('SESSION_HTTP_ONLY', true);
define('SESSION_SAME_SITE', 'Lax');

// Configuration CSRF
define('CSRF_TOKEN_LIFETIME', 7200); // 2 heures
define('CSRF_TOKEN_LENGTH', 32);

// Configuration des mots de passe
define('PASSWORD_MIN_LENGTH', 8);
define('PASSWORD_REQUIRE_UPPERCASE', true);
define('PASSWORD_REQUIRE_LOWERCASE', true);
define('PASSWORD_REQUIRE_NUMBERS', true);
define('PASSWORD_REQUIRE_SYMBOLS', false);

// =============================================================================
// CONFIGURATION DES UPLOADS
// =============================================================================

// Répertoires
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('UPLOAD_DIR_IMAGES', UPLOAD_DIR . 'images/');
define('UPLOAD_DIR_DOCUMENTS', UPLOAD_DIR . 'documents/');
define('UPLOAD_DIR_TEMP', UPLOAD_DIR . 'temp/');

// Limites
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('MAX_IMAGE_SIZE', 10 * 1024 * 1024); // 10MB
define('MAX_IMAGES_PER_ANNONCE', 5);
define('MAX_FILES_PER_UPLOAD', 10);

// Types de fichiers autorisés
define('ALLOWED_IMAGE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
define('ALLOWED_DOCUMENT_TYPES', ['pdf', 'doc', 'docx', 'txt']);

// Qualité des images
define('IMAGE_QUALITY', 85);
define('THUMBNAIL_WIDTH', 300);
define('THUMBNAIL_HEIGHT', 200);

// =============================================================================
// CONFIGURATION DES EMAILS
// =============================================================================

// Configuration SMTP
define('MAIL_DRIVER', 'smtp');
define('MAIL_HOST', ENVIRONMENT === 'development' ? 'smtp.mailtrap.io' : 'smtp.gmail.com');
define('MAIL_PORT', ENVIRONMENT === 'development' ? 2525 : 587);
define('MAIL_USERNAME', ENVIRONMENT === 'development' ? 'your_mailtrap_user' : 'your_email@gmail.com');
define('MAIL_PASSWORD', ENVIRONMENT === 'development' ? 'your_mailtrap_pass' : 'your_app_password');
define('MAIL_ENCRYPTION', ENVIRONMENT === 'development' ? 'tls' : 'tls');
define('MAIL_FROM_ADDRESS', 'noreply@senegalelevage.sn');
define('MAIL_FROM_NAME', APP_NAME);

// =============================================================================
// CONFIGURATION DU CACHE
// =============================================================================

// Type de cache (file, redis, memcached)
define('CACHE_DRIVER', 'file');

// Configuration du cache fichier
define('CACHE_DIR', __DIR__ . '/cache/');
define('CACHE_DEFAULT_LIFETIME', 3600); // 1 heure

// Configuration Redis (si utilisé)
define('REDIS_HOST', '127.0.0.1');
define('REDIS_PORT', 6379);
define('REDIS_PASSWORD', '');
define('REDIS_DB', 0);

// =============================================================================
// CONFIGURATION DES LOGS
// =============================================================================

// Niveaux de log
define('LOG_LEVEL', ENVIRONMENT === 'development' ? 'debug' : 'error');
define('LOG_MAX_FILES', 30);
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// Répertoires de logs
define('LOG_DIR', __DIR__ . '/logs/');
define('LOG_FILE', LOG_DIR . 'app.log');
define('ERROR_LOG_FILE', LOG_DIR . 'error.log');
define('ACCESS_LOG_FILE', LOG_DIR . 'access.log');

// =============================================================================
// CONFIGURATION DE L'API
// =============================================================================

// Configuration REST API
define('API_VERSION', 'v1');
define('API_PREFIX', '/api/' . API_VERSION);
define('API_RATE_LIMIT', 100); // requêtes par heure
define('API_RATE_LIMIT_WINDOW', 3600); // 1 heure

// Clés API
define('API_PUBLIC_KEY', ENVIRONMENT === 'development' ? 
    'dev_public_key' : 
    ($_ENV['API_PUBLIC_KEY'] ?? 'generate_public_key')
);

define('API_PRIVATE_KEY', ENVIRONMENT === 'development' ? 
    'dev_private_key' : 
    ($_ENV['API_PRIVATE_KEY'] ?? 'generate_private_key')
);

// =============================================================================
// CONFIGURATION DES PAIEMENTS
// =============================================================================

// Configuration Orange Money (à adapter)
define('ORANGE_MONEY_API_URL', 'https://api.orange.com/orange-money/');
define('ORANGE_MONEY_API_KEY', ENVIRONMENT === 'development' ? 
    'dev_orange_key' : 
    ($_ENV['ORANGE_MONEY_API_KEY'] ?? 'production_orange_key')
);

define('ORANGE_MONEY_SECRET', ENVIRONMENT === 'development' ? 
    'dev_orange_secret' : 
    ($_ENV['ORANGE_MONEY_SECRET'] ?? 'production_orange_secret')
);

// =============================================================================
// CONFIGURATION DE LA PERFORMANCE
// =============================================================================

// Compression GZIP
define('ENABLE_GZIP', true);

// Minification des assets
define('MINIFY_CSS', ENVIRONMENT === 'production');
define('MINIFY_JS', ENVIRONMENT === 'production');

// Lazy loading
define('ENABLE_LAZY_LOADING', true);

// CDN
define('USE_CDN', ENVIRONMENT === 'production');
define('CDN_URL', 'https://cdn.senegal-elevage.com');

// =============================================================================
// CLASSES UTILITAIRES
// =============================================================================

/**
 * Gestionnaire de base de données avec PDO
 */
class Database {
    private static $instance = null;
    private $pdo;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET . " COLLATE " . DB_COLLATION
            ];
            
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            $this->handleError($e);
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->pdo;
    }
    
    private function handleError($exception) {
        if (DEBUG_MODE) {
            die('Erreur de base de données: ' . $exception->getMessage());
        } else {
            $this->logError($exception);
            die('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
        }
    }
    
    private function logError($exception) {
        $logFile = LOG_DIR . 'database_error.log';
        $logMessage = date('Y-m-d H:i:s') . ' - ' . $exception->getMessage() . PHP_EOL;
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}

/**
 * Gestionnaire de sécurité
 */
class Security {
    /**
     * Générer un token CSRF
     */
    public static function generateCsrfToken() {
        if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(CSRF_TOKEN_LENGTH));
            $_SESSION['csrf_token_time'] = time();
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Vérifier un token CSRF
     */
    public static function verifyCsrfToken($token) {
        if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
            return false;
        }
        
        if (time() - $_SESSION['csrf_token_time'] > CSRF_TOKEN_LIFETIME) {
            unset($_SESSION['csrf_token']);
            unset($_SESSION['csrf_token_time']);
            return false;
        }
        
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Hasher un mot de passe
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 1
        ]);
    }
    
    /**
     * Vérifier un mot de passe
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Nettoyer une entrée utilisateur
     */
    public static function sanitize($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Valider un email
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Générer une URL sécurisée
     */
    public static function secureUrl($url) {
        return filter_var($url, FILTER_SANITIZE_URL);
    }
}

/**
 * Gestionnaire d'uploads
 */
class UploadManager {
    /**
     * Uploader une image
     */
    public static function uploadImage($file, $subdir = 'images') {
        if (!isset($file['error']) || is_array($file['error'])) {
            throw new Exception('Paramètres de fichier invalides');
        }
        
        switch ($file['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                throw new Exception('Fichier trop volumineux');
            case UPLOAD_ERR_NO_FILE:
                throw new Exception('Aucun fichier uploadé');
            default:
                throw new Exception('Erreur inconnue lors de l\'upload');
        }
        
        // Validation du type MIME
        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp'
        ];
        
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!isset($allowedMimes[$mimeType])) {
            throw new Exception('Type de fichier non autorisé');
        }
        
        // Validation de la taille
        if ($file['size'] > MAX_IMAGE_SIZE) {
            throw new Exception('Fichier trop volumineux');
        }
        
        // Génération du nom de fichier
        $extension = $allowedMimes[$mimeType];
        $filename = uniqid('img_', true) . '.' . $extension;
        $targetDir = UPLOAD_DIR . $subdir . '/';
        
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }
        
        $targetFile = $targetDir . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
            throw new Exception('Erreur lors du déplacement du fichier');
        }
        
        return [
            'filename' => $filename,
            'path' => $targetFile,
            'url' => UPLOADS_URL . $subdir . '/' . $filename,
            'size' => $file['size'],
            'mime_type' => $mimeType
        ];
    }
    
    /**
     * Créer une miniature
     */
    public static function createThumbnail($sourcePath, $targetPath, $width = THUMBNAIL_WIDTH, $height = THUMBNAIL_HEIGHT) {
        $imageInfo = getimagesize($sourcePath);
        
        if (!$imageInfo) {
            throw new Exception('Impossible de lire l\'image');
        }
        
        $sourceWidth = $imageInfo[0];
        $sourceHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];
        
        // Création de l'image source
        switch ($mimeType) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $source = imagecreatefrompng($sourcePath);
                break;
            case 'image/gif':
                $source = imagecreatefromgif($sourcePath);
                break;
            case 'image/webp':
                $source = imagecreatefromwebp($sourcePath);
                break;
            default:
                throw new Exception('Type d\'image non supporté');
        }
        
        // Calcul des dimensions
        $ratio = $sourceWidth / $sourceHeight;
        
        if ($width / $height > $ratio) {
            $width = $height * $ratio;
        } else {
            $height = $width / $ratio;
        }
        
        // Création de la miniature
        $thumbnail = imagecreatetruecolor($width, $height);
        
        if ($mimeType == 'image/png' || $mimeType == 'image/gif') {
            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
        }
        
        imagecopyresampled($thumbnail, $source, 0, 0, 0, 0, $width, $height, $sourceWidth, $sourceHeight);
        
        // Sauvegarde
        switch ($mimeType) {
            case 'image/jpeg':
                imagejpeg($thumbnail, $targetPath, IMAGE_QUALITY);
                break;
            case 'image/png':
                imagepng($thumbnail, $targetPath, round(IMAGE_QUALITY / 10));
                break;
            case 'image/gif':
                imagegif($thumbnail, $targetPath);
                break;
            case 'image/webp':
                imagewebp($thumbnail, $targetPath, IMAGE_QUALITY);
                break;
        }
        
        imagedestroy($source);
        imagedestroy($thumbnail);
        
        return true;
    }
}

/**
 * Gestionnaire de cache
 */
class Cache {
    private static function getCachePath($key) {
        return CACHE_DIR . md5($key) . '.cache';
    }
    
    public static function set($key, $data, $lifetime = CACHE_DEFAULT_LIFETIME) {
        $cachePath = self::getCachePath($key);
        $cacheData = [
            'data' => $data,
            'expires' => time() + $lifetime
        ];
        
        file_put_contents($cachePath, serialize($cacheData));
    }
    
    public static function get($key) {
        $cachePath = self::getCachePath($key);
        
        if (!file_exists($cachePath)) {
            return null;
        }
        
        $cacheData = unserialize(file_get_contents($cachePath));
        
        if ($cacheData['expires'] < time()) {
            unlink($cachePath);
            return null;
        }
        
        return $cacheData['data'];
    }
    
    public static function clear($key = null) {
        if ($key === null) {
            array_map('unlink', glob(CACHE_DIR . '*.cache'));
        } else {
            $cachePath = self::getCachePath($key);
            if (file_exists($cachePath)) {
                unlink($cachePath);
            }
        }
    }
}

/**
 * Gestionnaire de logs
 */
class Logger {
    public static function log($message, $level = 'info') {
        $logFile = LOG_DIR . $level . '.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;
        
        file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
        
        // En production, envoyer les erreurs critiques par email
        if (ENVIRONMENT === 'production' && $level === 'critical') {
            error_log($message, 1, CONTACT_EMAIL);
        }
    }
    
    public static function debug($message) {
        if (DEBUG_MODE) {
            self::log($message, 'debug');
        }
    }
    
    public static function info($message) {
        self::log($message, 'info');
    }
    
    public static function warning($message) {
        self::log($message, 'warning');
    }
    
    public static function error($message) {
        self::log($message, 'error');
    }
    
    public static function critical($message) {
        self::log($message, 'critical');
    }
}

// =============================================================================
// INITIALISATION
// =============================================================================

// Démarrage de la session
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_lifetime' => SESSION_LIFETIME,
        'cookie_path' => SESSION_PATH,
        'cookie_domain' => SESSION_DOMAIN,
        'cookie_secure' => SESSION_SECURE,
        'cookie_httponly' => SESSION_HTTP_ONLY,
        'cookie_samesite' => SESSION_SAME_SITE,
        'use_strict_mode' => true,
        'use_cookies' => true,
        'use_only_cookies' => true,
    ]);
}

// Création des répertoires nécessaires
$directories = [
    UPLOAD_DIR,
    UPLOAD_DIR_IMAGES,
    UPLOAD_DIR_DOCUMENTS,
    UPLOAD_DIR_TEMP,
    CACHE_DIR,
    LOG_DIR
];

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Protection contre les attaques
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

if (ENVIRONMENT === 'production') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// =============================================================================
// FONCTIONS GLOBALES UTILITAIRES
// =============================================================================

/**
 * Redirection sécurisée
 */
function redirect($url, $statusCode = 302) {
    header('Location: ' . $url, true, $statusCode);
    exit();
}

/**
 * Formatage de prix
 */
function formatPrice($price, $currency = 'FCFA') {
    return number_format($price, 0, ',', ' ') . ' ' . $currency;
}

/**
 * Tronquer un texte
 */
function truncateText($text, $length = 100, $suffix = '...') {
    if (strlen($text) <= $length) {
        return $text;
    }
    return substr($text, 0, $length) . $suffix;
}

/**
 * Générer une slug
 */
function generateSlug($text) {
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}

/**
 * Valider un numéro de téléphone sénégalais
 */
function validateSenegalPhone($phone) {
    $phone = preg_replace('/[^0-9]/', '', $phone);
    return preg_match('/^221[76733][0-9]{7}$/', $phone);
}

// =============================================================================
// AUTOLOAD DES CLASSES
// =============================================================================

spl_autoload_register(function ($className) {
    $directories = ['classes/', 'models/', 'controllers/', 'services/'];
    
    foreach ($directories as $dir) {
        $file = __DIR__ . '/' . $dir . $className . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// =============================================================================
// GESTION DES ERREURS
// =============================================================================

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    
    $message = "Erreur [{$errno}]: {$errstr} dans {$errfile} à la ligne {$errline}";
    Logger::error($message);
    
    if (DEBUG_MODE) {
        throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
    
    return true;
});

set_exception_handler(function ($exception) {
    Logger::critical($exception->getMessage());
    
    if (DEBUG_MODE) {
        echo '<h1>Erreur critique</h1>';
        echo '<p>' . htmlspecialchars($exception->getMessage()) . '</p>';
        echo '<pre>' . htmlspecialchars($exception->getTraceAsString()) . '</pre>';
    } else {
        echo '<h1>Erreur serveur</h1>';
        echo '<p>Une erreur est survenue. Veuillez réessayer plus tard.</p>';
    }
});

// =============================================================================
// FIN DE LA CONFIGURATION
// =============================================================================

if (DEBUG_MODE) {
    Logger::debug('Configuration chargée - Environnement: ' . ENVIRONMENT);
}
?>
