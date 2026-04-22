/**
 * ============================================================
 * UTILS.JS - Fonctions Utilitaires Partagées
 * ============================================================
 * 
 * Fichier centralisé contenant les fonctions réutilisables
 * pour l'ensemble de l'application Sénégal Élevage.
 * 
 * Avantages:
 * - Évite la duplication de code
 * - Maintenance simplifiée
 * - Cohérence garantie dans l'application
 * - Extensibilité facilitée
 */

// ============================================================
// 1. GESTION DES NOTIFICATIONS
// ============================================================

/**
 * Affiche une notification temporaire à l'écran
 * @param {string} message - Le message à afficher
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée d'affichage en ms (default: 3000)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Récupérer ou créer le conteneur
    let container = document.getElementById('messageContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        document.body.appendChild(container);
    }

    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto-remove après la durée spécifiée
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ============================================================
// 2. VALIDATION DE FORMULAIRES
// ============================================================

/**
 * Valide une adresse email
 * @param {string} email - L'adresse email à valider
 * @returns {boolean} true si valide, false sinon
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valide un numéro de téléphone sénégalais
 * @param {string} phone - Le numéro à valider
 * @returns {boolean} true si valide
 */
function validatePhoneSenegal(phone) {
    // Format: 77 123 45 67 ou 221771234567
    const regex = /^(\+221|0|221)?[6-9]\d{8}$/;
    return regex.test(phone.replace(/\s/g, ''));
}

/**
 * Valide la force d'un mot de passe
 * @param {string} password - Le mot de passe à valider
 * @returns {object} {strength: 'weak'|'medium'|'strong', score: 0-100}
 */
function validatePasswordStrength(password) {
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    
    // Majuscules
    if (/[A-Z]/.test(password)) score += 20;
    
    // Minuscules
    if (/[a-z]/.test(password)) score += 20;
    
    // Nombres
    if (/[0-9]/.test(password)) score += 15;
    
    // Caractères spéciaux
    if (/[!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]/.test(password)) score += 15;
    
    let strength = 'weak';
    if (score >= 50 && score < 75) strength = 'medium';
    if (score >= 75) strength = 'strong';
    
    return { strength, score: Math.min(score, 100) };
}

/**
 * Valide un formulaire complet
 * @param {HTMLFormElement} form - Le formulaire à valider
 * @returns {boolean} true si tous les champs requis sont remplis
 */
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('field-error');
            isValid = false;
        } else {
            field.classList.remove('field-error');
        }
    });
    
    return isValid;
}

// ============================================================
// 3. GESTION DU STOCKAGE LOCAL
// ============================================================

/**
 * Sauvegarde un objet dans le localStorage
 * @param {string} key - La clé de stockage
 * @param {any} value - La valeur à stocker (sera sérialisée)
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Erreur lors de la sauvegarde:', e);
    }
}

/**
 * Récupère un objet du localStorage
 * @param {string} key - La clé de stockage
 * @param {any} defaultValue - Valeur par défaut si clé non trouvée
 * @returns {any} L'objet récupéré ou la valeur par défaut
 */
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Erreur lors de la récupération:', e);
        return defaultValue;
    }
}

/**
 * Supprime un élément du localStorage
 * @param {string} key - La clé à supprimer
 */
function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Erreur lors de la suppression:', e);
    }
}

/**
 * Efface complètement le localStorage
 */
function clearLocalStorage() {
    try {
        localStorage.clear();
    } catch (e) {
        console.error('Erreur lors de l\'effacement:', e);
    }
}

// ============================================================
// 4. MANIPULATION D'URLs ET PARAMÈTRES
// ============================================================

/**
 * Récupère un paramètre de l'URL
 * @param {string} paramName - Le nom du paramètre
 * @returns {string|null} La valeur du paramètre ou null
 */
function getUrlParameter(paramName) {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
}

/**
 * Ajoute ou met à jour un paramètre dans l'URL
 * @param {string} paramName - Le nom du paramètre
 * @param {string} paramValue - La valeur du paramètre
 */
function setUrlParameter(paramName, paramValue) {
    const params = new URLSearchParams(window.location.search);
    params.set(paramName, paramValue);
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
}

/**
 * Supprime un paramètre de l'URL
 * @param {string} paramName - Le nom du paramètre
 */
function removeUrlParameter(paramName) {
    const params = new URLSearchParams(window.location.search);
    params.delete(paramName);
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
}

// ============================================================
// 5. MANIPULATION DE TEXTE ET FORMATAGE
// ============================================================

/**
 * Formate une date au format français
 * @param {Date|string} date - La date à formater
 * @param {boolean} withTime - Inclure l'heure (default: false)
 * @returns {string} Date formatée
 */
function formatDate(date, withTime = false) {
    const d = new Date(date);
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    if (withTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('fr-FR', options);
}

/**
 * Formate un nombre avec séparateur des milliers
 * @param {number} num - Le nombre à formater
 * @param {number} decimals - Nombre de décimales (default: 0)
 * @returns {string} Nombre formaté
 */
function formatNumber(num, decimals = 0) {
    return parseFloat(num).toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Formate une devise en CFA
 * @param {number} amount - Le montant à formater
 * @returns {string} Montant formaté (ex: "25 000 FCFA")
 */
function formatCFA(amount) {
    return formatNumber(amount, 0) + ' FCFA';
}

/**
 * Tronque un texte et ajoute "..."
 * @param {string} text - Le texte à tronquer
 * @param {number} length - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
}

/**
 * Nettoie un texte (trim, normalize)
 * @param {string} text - Le texte à nettoyer
 * @returns {string} Texte nettoyé
 */
function cleanText(text) {
    return text.trim().replace(/\s+/g, ' ');
}

// ============================================================
// 6. GESTION DES TABLEAUX ET OBJETS
// ============================================================

/**
 * Filtre un tableau d'objets par critère
 * @param {array} array - Le tableau à filtrer
 * @param {string} key - La clé à filtrer
 * @param {any} value - La valeur à chercher
 * @returns {array} Tableau filtré
 */
function filterByKey(array, key, value) {
    return array.filter(item => item[key] === value);
}

/**
 * Trie un tableau d'objets
 * @param {array} array - Le tableau à trier
 * @param {string} key - La clé de tri
 * @param {string} order - 'asc' ou 'desc' (default: 'asc')
 * @returns {array} Tableau trié
 */
function sortByKey(array, key, order = 'asc') {
    return array.slice().sort((a, b) => {
        if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Supprime les doublons d'un tableau
 * @param {array} array - Le tableau
 * @param {string} key - La clé pour comparer (optionnel)
 * @returns {array} Tableau sans doublons
 */
function removeDuplicates(array, key = null) {
    if (!key) {
        return [...new Set(array)];
    }
    return Array.from(new Map(array.map(item => [item[key], item])).values());
}

/**
 * Regroupe un tableau par clé
 * @param {array} array - Le tableau à regrouper
 * @param {string} key - La clé de regroupement
 * @returns {object} Objet regroupé
 */
function groupByKey(array, key) {
    return array.reduce((acc, item) => {
        const group = item[key];
        if (!acc[group]) acc[group] = [];
        acc[group].push(item);
        return acc;
    }, {});
}

// ============================================================
// 7. UTILITAIRES DOM
// ============================================================

/**
 * Ajoute une classe à un élément avec animation
 * @param {HTMLElement} element - L'élément
 * @param {string} className - La classe CSS
 */
function addClassAnimated(element, className) {
    element.classList.add(className);
}

/**
 * Supprime une classe d'un élément
 * @param {HTMLElement} element - L'élément
 * @param {string} className - La classe CSS
 */
function removeClassAnimated(element, className) {
    element.classList.remove(className);
}

/**
 * Affiche/cache un élément avec transition
 * @param {HTMLElement} element - L'élément
 * @param {boolean} show - Afficher ou cacher
 * @param {number} duration - Durée en ms
 */
function toggleVisibility(element, show = true, duration = 300) {
    if (show) {
        element.style.display = 'block';
        setTimeout(() => element.classList.add('visible'), 10);
    } else {
        element.classList.remove('visible');
        setTimeout(() => element.style.display = 'none', duration);
    }
}

/**
 * Clone un élément DOM
 * @param {HTMLElement} element - L'élément à cloner
 * @param {boolean} deep - Clone profond (default: true)
 * @returns {HTMLElement} Clone de l'élément
 */
function cloneElement(element, deep = true) {
    return element.cloneNode(deep);
}

// ============================================================
// 8. UTILITAIRES RÉSEAU
// ============================================================

/**
 * Effectue une requête fetch avec gestion d'erreur
 * @param {string} url - L'URL de la requête
 * @param {object} options - Options fetch
 * @returns {Promise} Response ou erreur
 */
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response;
    } catch (error) {
        console.error('Erreur fetch:', error);
        showNotification('Erreur de connexion. Veuillez réessayer.', 'error');
        throw error;
    }
}

/**
 * Récupère les données JSON avec gestion d'erreur
 * @param {string} url - L'URL
 * @returns {Promise<object>} Les données JSON
 */
async function fetchJSON(url) {
    const response = await safeFetch(url);
    return response.json();
}

/**
 * Envoie des données POST
 * @param {string} url - L'URL
 * @param {object} data - Les données à envoyer
 * @returns {Promise<object>} La réponse
 */
async function postJSON(url, data) {
    const response = await safeFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// ============================================================
// 9. UTILITAIRES DE SÉCURITÉ
// ============================================================

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * @param {string} text - Le texte à échapper
 * @returns {string} Texte échappé
 */
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Valide une URL
 * @param {string} url - L'URL à valider
 * @returns {boolean} true si valide
 */
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Génère un UUID v4
 * @returns {string} UUID généré
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================================
// 10. UTILITAIRES DE DEBUG
// ============================================================

/**
 * Log avec timestamp
 * @param {string} message - Le message
 * @param {any} data - Les données à logger
 */
function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    console.log(`[${timestamp}] ${message}`, data || '');
}

/**
 * Log d'erreur avec contexte
 * @param {string} context - Le contexte
 * @param {Error} error - L'erreur
 */
function debugError(context, error) {
    console.error(`[ERREUR] ${context}:`, error);
}

// ============================================================
// 11. EXTENSIONS PROTOTYPES (utiliser avec prudence)
// ============================================================

/**
 * Capitalize une chaîne
 * String.prototype.capitalize()
 */
if (!String.prototype.capitalize) {
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
}

/**
 * Delay pour async/await
 * await delay(1000)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// EXPORT (pour modules si nécessaire)
// ============================================================

// Utilisation: 
// import { showNotification, validateEmail } from './utils.js'
// En HTML: <script src="utils.js"></script> puis utiliser directement

// Fin du fichier utils.js
