<?php
/**
 * ============================================================
 * CONFIG_SECURE.PHP - Configuration Sécurisée
 * ============================================================
 * 
 * Version améliorée de la configuration avec :
 * - Variables d'environnement via .env
 * - Gestion des erreurs appropriée
 * - Validation de l'environnement
 * - Headers de sécurité
 * 
 * IMPORTANT: Copier .env.example en .env et le configurer
 * Ne JAMAIS commiter .env en production
 */

// ============================================================
// 1. DÉFINIR LE NIVEAU D'ERREUR
// ============================================================

// En développement
if ($_ENV['APP_ENV'] === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/logs/php-errors.log');
}

// ============================================================
// 2. CHARGER LES VARIABLES D'ENVIRONNEMENT
// ============================================================

/**
 * Charge les variables d'environnement depuis .env
 */
function loadEnv($path = __DIR__) {
    $envFile = $path . '/.env';
    
    if (!file_exists($envFile)) {
        die('ERREUR: Fichier .env manquant. Copier .env.example en .env');
    }
    
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue; // Ignorer les commentaires
        if (strpos($line, '=') === false) continue;
        
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        
        // Retirer les guillemets si présents
        if (substr($value, 0, 1) === '"' && substr($value, -1) === '"') {
            $value = substr($value, 1, -1);
        }
        
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

// Charger les variables d'environnement
loadEnv();

// ============================================================
// 3. CONFIGURATION DE LA BASE DE DONNÉES - MYSQL
// ============================================================

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: 3306);
define('DB_NAME', getenv('DB_NAME') ?: 'senegal_elevage');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('DB_PASSWORD') ?: '');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// DSN pour PDO
define('DB_DSN', sprintf(
    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_CHARSET
));

// ============================================================
// 4. CONFIGURATION SUPABASE (PostgreSQL)
// ============================================================

define('SUPABASE_URL', getenv('SUPABASE_URL') ?: '');
define('SUPABASE_ANON_KEY', getenv('SUPABASE_ANON_KEY') ?: '');
define('SUPABASE_SERVICE_ROLE_KEY', getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '');

// ============================================================
// 5. SÉCURITÉ - AUTHENTIFICATION
// ============================================================

define('JWT_SECRET', getenv('JWT_SECRET') ?: 'votre-secret-jwt-defaut');
define('JWT_EXPIRATION', getenv('JWT_EXPIRATION') ?: '7d');
define('SESSION_TIMEOUT', getenv('SESSION_TIMEOUT') ?: 3600);

// ============================================================
// 6. CONFIGURATION APPLICATION
// ============================================================

define('APP_NAME', getenv('APP_NAME') ?: 'Sénégal Élevage');
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_DEBUG', getenv('APP_DEBUG') === 'true');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost');
define('TIMEZONE', getenv('TIMEZONE') ?: 'Africa/Dakar');
define('LOCALE', getenv('LOCALE') ?: 'fr_SN');
define('COUNTRY_CODE', getenv('COUNTRY_CODE') ?: 'SN');

// Définir le fuseau horaire
date_default_timezone_set(TIMEZONE);

// ============================================================
// 7. STOCKAGE DE FICHIERS
// ============================================================

define('UPLOAD_DIR', getenv('UPLOAD_DIR') ?: './uploads/');
define('UPLOAD_MAX_SIZE', (int)getenv('UPLOAD_MAX_SIZE') ?: 5242880); // 5MB
define('UPLOAD_ALLOWED_TYPES', getenv('UPLOAD_ALLOWED_TYPES') ?: 'jpg,jpeg,png,gif,pdf');

// Créer les dossiers d'upload s'ils n'existent pas
$uploadDirs = [
    UPLOAD_DIR,
    UPLOAD_DIR . 'images/',
    UPLOAD_DIR . 'documents/',
    UPLOAD_DIR . 'temp/'
];

foreach ($uploadDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// ============================================================
// 8. LOGGING
// ============================================================

define('LOG_LEVEL', getenv('LOG_LEVEL') ?: 'info');
define('LOG_FILE', getenv('LOG_FILE') ?: './logs/app.log');

// Créer le dossier logs s'il n'existe pas
if (!is_dir('./logs')) {
    mkdir('./logs', 0755, true);
}

// ============================================================
// 9. HEADERS DE SÉCURITÉ
// ============================================================

/**
 * Ajoute les headers de sécurité essentiels
 */
function setSecurityHeaders() {
    // CORS configuration en production
    if (APP_ENV === 'production') {
        header('Access-Control-Allow-Origin: ' . APP_URL);
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
    }
    
    // Sécurité
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'');
    
    // Type de contenu
    header('Content-Type: application/json; charset=utf-8');
}

// Appliquer les headers au démarrage
setSecurityHeaders();

// ============================================================
// 10. FONCTIONS DE GESTION DE LA BASE DE DONNÉES
// ============================================================

/**
 * Crée une connexion PDO sécurisée
 * @return PDO|null
 */
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo !== null) {
        return $pdo;
    }
    
    try {
        $pdo = new PDO(
            DB_DSN,
            DB_USER,
            DB_PASSWORD,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        
        return $pdo;
    } catch (PDOException $e) {
        error_log('Erreur connexion BD: ' . $e->getMessage());
        
        // Ne pas exposer les détails en production
        if (APP_ENV !== 'development') {
            die(json_encode(['error' => 'Erreur de base de données']));
        } else {
            die('Erreur BD: ' . $e->getMessage());
        }
    }
}

/**
 * Exécute une requête préparée (sécurisée contre les injections SQL)
 * @param string $query
 * @param array $params
 * @return array|false
 */
function executeQuery($query, $params = []) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        error_log('Erreur requête: ' . $e->getMessage());
        return false;
    }
}

/**
 * Récupère une seule ligne
 * @param string $query
 * @param array $params
 * @return array|false
 */
function fetchOne($query, $params = []) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log('Erreur requête: ' . $e->getMessage());
        return false;
    }
}

/**
 * Exécute une requête d'insertion/mise à jour/suppression
 * @param string $query
 * @param array $params
 * @return int Nombre de lignes affectées
 */
function executeUpdate($query, $params = []) {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->rowCount();
    } catch (PDOException $e) {
        error_log('Erreur requête: ' . $e->getMessage());
        return false;
    }
}

/**
 * Récupère l'ID de la dernière insertion
 * @return string
 */
function getLastInsertId() {
    $pdo = getDBConnection();
    return $pdo->lastInsertId();
}

// ============================================================
// 11. GESTION DES ERREURS ET EXCEPTIONS
// ============================================================

/**
 * Gestionnaire d'erreurs personnalisé
 */
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $errorType = [
        E_ERROR => 'Fatal Error',
        E_WARNING => 'Warning',
        E_PARSE => 'Parse Error',
        E_NOTICE => 'Notice',
        E_CORE_ERROR => 'Core Error',
        E_CORE_WARNING => 'Core Warning',
        E_COMPILE_ERROR => 'Compile Error',
        E_COMPILE_WARNING => 'Compile Warning',
        E_USER_ERROR => 'User Error',
        E_USER_WARNING => 'User Warning',
        E_USER_NOTICE => 'User Notice',
        E_STRICT => 'Strict',
        E_RECOVERABLE_ERROR => 'Recoverable Error',
        E_DEPRECATED => 'Deprecated',
        E_USER_DEPRECATED => 'User Deprecated',
    ];
    
    $type = isset($errorType[$errno]) ? $errorType[$errno] : 'Unknown Error';
    
    $log = sprintf(
        "[%s] %s: %s in %s on line %d",
        date('Y-m-d H:i:s'),
        $type,
        $errstr,
        $errfile,
        $errline
    );
    
    error_log($log);
    
    // Ne pas exécuter le gestionnaire PHP standard
    return true;
});

/**
 * Gestionnaire d'exceptions non capturées
 */
set_exception_handler(function($exception) {
    error_log('Exception: ' . $exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());
    
    http_response_code(500);
    echo json_encode([
        'error' => APP_DEBUG ? $exception->getMessage() : 'Une erreur est survenue'
    ]);
    exit;
});

// ============================================================
// 12. FONCTION DE LOGGING
// ============================================================

/**
 * Log un message dans le fichier de log
 * @param string $message
 * @param string $level
 */
function logMessage($message, $level = 'info') {
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[$timestamp] [$level] $message\n";
    
    file_put_contents(LOG_FILE, $logEntry, FILE_APPEND);
}

// ============================================================
// VÉRIFICATION DE LA CONFIGURATION
// ============================================================

if (empty(DB_NAME)) {
    die('ERREUR: DB_NAME non défini dans .env');
}

if (APP_DEBUG && APP_ENV === 'production') {
    die('ERREUR: APP_DEBUG ne doit pas être true en production');
}

// Fin du fichier config_secure.php
?>
