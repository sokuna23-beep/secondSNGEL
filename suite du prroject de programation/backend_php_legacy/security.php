<?php
/**
 * ============================================================
 * SECURITY.PHP - Fonctions de Validation et Sécurité
 * ============================================================
 * 
 * Classe regroupant les meilleures pratiques de sécurité:
 * - Validation d'entrées
 * - Protection contre l'injection SQL
 * - Protection contre le XSS
 * - Hachage des mots de passe
 * - Token CSRF
 */

class SecurityValidator {
    
    /**
     * Valide une adresse email
     * @param string $email
     * @return bool
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Valide un numéro de téléphone sénégalais
     * @param string $phone
     * @return bool
     */
    public static function validatePhoneSenegal($phone) {
        // Format: 77 123 45 67 ou 221771234567 ou 771234567
        $phone = preg_replace('/\s+/', '', $phone);
        return preg_match('/^(\+221|221|0)?[6-9]\d{8}$/', $phone) === 1;
    }
    
    /**
     * Valide la force d'un mot de passe
     * @param string $password
     * @return array ['strength' => 'weak|medium|strong', 'score' => 0-100, 'feedback' => string]
     */
    public static function validatePasswordStrength($password) {
        $score = 0;
        $feedback = [];
        
        // Longueur
        if (strlen($password) >= 8) {
            $score += 20;
        } else {
            $feedback[] = 'Minimum 8 caractères requis';
        }
        
        if (strlen($password) >= 12) {
            $score += 10;
        }
        
        // Majuscules
        if (preg_match('/[A-Z]/', $password)) {
            $score += 20;
        } else {
            $feedback[] = 'Ajoutez des majuscules';
        }
        
        // Minuscules
        if (preg_match('/[a-z]/', $password)) {
            $score += 20;
        } else {
            $feedback[] = 'Ajoutez des minuscules';
        }
        
        // Chiffres
        if (preg_match('/[0-9]/', $password)) {
            $score += 15;
        } else {
            $feedback[] = 'Ajoutez des chiffres';
        }
        
        // Caractères spéciaux
        if (preg_match('/[!@#$%^&*()_+=\-[\]{};\':"\\|,.<>?\/]/', $password)) {
            $score += 15;
        } else {
            $feedback[] = 'Ajoutez des caractères spéciaux';
        }
        
        $strength = 'weak';
        if ($score >= 50 && $score < 75) $strength = 'medium';
        if ($score >= 75) $strength = 'strong';
        
        return [
            'strength' => $strength,
            'score' => min($score, 100),
            'feedback' => $feedback,
            'isValid' => $strength !== 'weak'
        ];
    }
    
    /**
     * Valide qu'un champ obligatoire est présent
     * @param mixed $value
     * @param int $minLength
     * @return bool
     */
    public static function validateRequired($value, $minLength = 1) {
        if (is_string($value)) {
            return strlen(trim($value)) >= $minLength;
        }
        return !empty($value);
    }
    
    /**
     * Valide qu'un entier est dans une plage
     * @param int $value
     * @param int $min
     * @param int $max
     * @return bool
     */
    public static function validateRange($value, $min, $max) {
        return filter_var($value, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => $min, 'max_range' => $max]
        ]) !== false;
    }
    
    /**
     * Valide une URL
     * @param string $url
     * @return bool
     */
    public static function validateURL($url) {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
    
    /**
     * Valide une date au format YYYY-MM-DD
     * @param string $date
     * @return bool
     */
    public static function validateDate($date) {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1;
    }
    
    /**
     * Valide un upload de fichier
     * @param array $file $_FILES['key']
     * @param array $allowedTypes
     * @param int $maxSize
     * @return array ['isValid' => bool, 'errors' => array]
     */
    public static function validateFileUpload($file, $allowedTypes = [], $maxSize = 5242880) {
        $errors = [];
        
        if (empty($file)) {
            $errors[] = 'Aucun fichier envoyé';
            return ['isValid' => false, 'errors' => $errors];
        }
        
        // Vérifier les erreurs d'upload
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $uploadErrors = [
                UPLOAD_ERR_INI_SIZE => 'Fichier trop volumineux (limite serveur)',
                UPLOAD_ERR_FORM_SIZE => 'Fichier trop volumineux',
                UPLOAD_ERR_PARTIAL => 'Upload incomplet',
                UPLOAD_ERR_NO_FILE => 'Aucun fichier',
                UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
                UPLOAD_ERR_CANT_WRITE => 'Impossible d\'écrire le fichier',
                UPLOAD_ERR_EXTENSION => 'Extension PHP interdite'
            ];
            $errors[] = isset($uploadErrors[$file['error']]) ? 
                $uploadErrors[$file['error']] : 'Erreur d\'upload inconnue';
        }
        
        // Vérifier la taille
        if ($file['size'] > $maxSize) {
            $errors[] = 'Fichier trop volumineux (max: ' . ($maxSize / 1048576) . 'MB)';
        }
        
        // Vérifier le type MIME réel (pas juste l'extension)
        if (!empty($allowedTypes)) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $allowedTypes)) {
                $errors[] = "Type de fichier non autorisé: $mimeType";
            }
        }
        
        return [
            'isValid' => empty($errors),
            'errors' => $errors,
            'mimeType' => $finfo ? $mimeType : null
        ];
    }
    
    /**
     * Échappe une chaîne pour éviter les injections XSS
     * @param string $data
     * @return string
     */
    public static function escapeHTML($data) {
        return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Echappe pour utilisation en attribut HTML
     * @param string $data
     * @return string
     */
    public static function escapeAttribute($data) {
        return htmlspecialchars($data, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    /**
     * Échappe pour utilisation en JavaScript
     * @param string $data
     * @return string
     */
    public static function escapeJS($data) {
        return json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APO | JSON_HEX_QUOT);
    }
    
    /**
     * Nettoie une chaîne (trim + espaces multiples)
     * @param string $data
     * @return string
     */
    public static function sanitizeString($data) {
        $data = trim($data);
        $data = preg_replace('/\s+/', ' ', $data); // Remplacer les espaces multiples
        return $data;
    }
    
    /**
     * Valide et nettoie une email
     * @param string $email
     * @return string|false Email nettoyée ou false
     */
    public static function sanitizeEmail($email) {
        $email = filter_var(trim($email), FILTER_SANITIZE_EMAIL);
        return self::validateEmail($email) ? $email : false;
    }
    
    /**
     * Hache un mot de passe avec bcrypt
     * @param string $password
     * @param int $cost
     * @return string
     */
    public static function hashPassword($password, $cost = 12) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => $cost]);
    }
    
    /**
     * Vérifie un mot de passe
     * @param string $password
     * @param string $hash
     * @return bool
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Génère un token CSRF sécurisé
     * @return string
     */
    public static function generateCSRFToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Valide un token CSRF
     * @param string $token
     * @return bool
     */
    public static function validateCSRFToken($token) {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Génère un token aléatoire sécurisé
     * @param int $length
     * @return string
     */
    public static function generateToken($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Valide un formulaire POST avec CSRF
     * @return bool
     */
    public static function validatePOSTRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return false;
        }
        
        $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        return self::validateCSRFToken($token);
    }
    
    /**
     * Récupère et valide un paramètre POST
     * @param string $key
     * @param string $type 'string', 'int', 'email', 'url'
     * @param mixed $default
     * @return mixed
     */
    public static function getPostParam($key, $type = 'string', $default = null) {
        if (!isset($_POST[$key])) {
            return $default;
        }
        
        $value = $_POST[$key];
        
        switch ($type) {
            case 'int':
                return filter_var($value, FILTER_VALIDATE_INT);
            case 'email':
                return filter_var($value, FILTER_VALIDATE_EMAIL);
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL);
            case 'bool':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'string':
            default:
                return self::sanitizeString($value);
        }
    }
    
    /**
     * Récupère et valide un paramètre GET
     * @param string $key
     * @param string $type
     * @param mixed $default
     * @return mixed
     */
    public static function getGetParam($key, $type = 'string', $default = null) {
        if (!isset($_GET[$key])) {
            return $default;
        }
        
        $value = $_GET[$key];
        
        switch ($type) {
            case 'int':
                return filter_var($value, FILTER_VALIDATE_INT);
            case 'email':
                return filter_var($value, FILTER_VALIDATE_EMAIL);
            case 'url':
                return filter_var($value, FILTER_VALIDATE_URL);
            default:
                return self::sanitizeString($value);
        }
    }
    
    /**
     * Crée une réponse JSON sécurisée
     * @param bool $success
     * @param string $message
     * @param array $data
     * @return string
     */
    public static function jsonResponse($success = true, $message = '', $data = []) {
        header('Content-Type: application/json; charset=utf-8');
        
        return json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    
    /**
     * Log une action de sécurité
     * @param string $action
     * @param string $details
     * @param string $level 'info', 'warning', 'critical'
     */
    public static function logSecurityEvent($action, $details = '', $level = 'info') {
        $logEntry = sprintf(
            "[%s] [%s] [%s] Action: %s | Details: %s | IP: %s | User: %s\n",
            date('Y-m-d H:i:s'),
            strtoupper($level),
            $_SERVER['REQUEST_METHOD'],
            $action,
            $details,
            $_SERVER['REMOTE_ADDR'],
            $_SESSION['user_id'] ?? 'anonymous'
        );
        
        error_log($logEntry);
    }
}

// Alias court pour utilisation facile
class Security extends SecurityValidator {}

?>
