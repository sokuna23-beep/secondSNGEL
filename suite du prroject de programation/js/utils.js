/**
 * ============================================================
 * UTILS.JS - Fonctions Utilitaires Partagées
 * ============================================================
 * 
 * Fichier centralisé contenant les fonctions réutilisables
 * pour l'ensemble de l'application Sénégal Élevage.
 * 
 * Version: 2.0.0
 * 
 * Avantages:
 * - Évite la duplication de code
 * - Maintenance simplifiée
 * - Cohérence garantie dans l'application
 * - Extensibilité facilitée
 */

// ============================================================
// 0. CONFIGURATION SUPABASE (intégrée)
// ============================================================

// MODIFICATION 1: Ajout de la configuration Supabase centralisée
const UTILS_SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co';
const UTILS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag';

// Variables globales utilitaires
let utilsSupabaseClient = null;
let utilsIsSupabaseReady = false;

// Initialisation de Supabase pour les utilitaires
function initUtilsSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            utilsSupabaseClient = window.supabase.createClient(UTILS_SUPABASE_URL, UTILS_SUPABASE_ANON_KEY);
            utilsIsSupabaseReady = true;
            console.log('✅ Supabase initialisé depuis utils.js');
            return true;
        } else if (window.supabaseClient) {
            utilsSupabaseClient = window.supabaseClient;
            utilsIsSupabaseReady = true;
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Supabase non disponible dans utils.js');
    }
    return false;
}

// Initialisation automatique
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUtilsSupabase);
} else {
    initUtilsSupabase();
}

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
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        `;
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
    
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3'
    };
    
    notification.style.cssText = `
        background: ${colors[type]};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 14px;
    `;
    
    notification.innerHTML = `
        <div class="notification-content" style="display: flex; align-items: center; gap: 10px;">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="notification-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 14px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => notification.remove());
    
    container.appendChild(notification);
    
    // Auto-remove après la durée spécifiée
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// Ajouter les animations CSS si non présentes
if (!document.querySelector('#utils-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'utils-notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
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
    const clean = phone.replace(/\s/g, '');
    const regex = /^(?:\+221|0)?(77|76|70|78|33)\d{7}$/;
    return regex.test(clean);
}

// MODIFICATION 2: Ajout validation générique
/**
 * Valide un numéro de téléphone (format international)
 * @param {string} phone - Le numéro à valider
 * @returns {boolean} true si valide
 */
function validatePhone(phone) {
    const clean = phone.replace(/[\s\-\(\)\+]/g, '');
    const regex = /^[0-9]{9,15}$/;
    return regex.test(clean);
}

/**
 * Valide la force d'un mot de passe
 * @param {string} password - Le mot de passe à valider
 * @returns {object} {strength: 'weak'|'medium'|'strong', score: 0-100}
 */
function validatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 15;
    
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
        console.log(`💾 Sauvegardé: ${key}`);
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
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
}

/**
 * Supprime un paramètre de l'URL
 * @param {string} paramName - Le nom du paramètre
 */
function removeUrlParameter(paramName) {
    const params = new URLSearchParams(window.location.search);
    params.delete(paramName);
    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
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
    if (!date) return 'Date inconnue';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
    
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
    if (isNaN(num)) return '0';
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
    if (!amount && amount !== 0) return 'Prix sur demande';
    return formatNumber(amount, 0) + ' FCFA';
}

/**
 * Formate un prix avec devise
 * @param {number} price - Le prix
 * @param {string} currency - La devise (default: 'XOF')
 * @returns {string} Prix formaté
 */
function formatPrice(price, currency = 'XOF') {
    if (!price && price !== 0) return 'Prix sur demande';
    if (currency === 'XOF') return formatCFA(price);
    return `${formatNumber(price, 0)} ${currency}`;
}

/**
 * Tronque un texte et ajoute "..."
 * @param {string} text - Le texte à tronquer
 * @param {number} length - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, length = 100) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length).trim() + '...';
}

/**
 * Nettoie un texte (trim, normalize)
 * @param {string} text - Le texte à nettoyer
 * @returns {string} Texte nettoyé
 */
function cleanText(text) {
    if (!text) return '';
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
    if (!array || !Array.isArray(array)) return [];
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
    if (!array || !Array.isArray(array)) return [];
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
    if (!array || !Array.isArray(array)) return [];
    if (!key) return [...new Set(array)];
    return Array.from(new Map(array.map(item => [item[key], item])).values());
}

/**
 * Regroupe un tableau par clé
 * @param {array} array - Le tableau à regrouper
 * @param {string} key - La clé de regroupement
 * @returns {object} Objet regroupé
 */
function groupByKey(array, key) {
    if (!array || !Array.isArray(array)) return {};
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
 * Attend que le DOM soit chargé
 * @param {Function} callback - Fonction à exécuter
 */
function domReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

/**
 * Crée un élément avec des attributs
 * @param {string} tag - Tag HTML
 * @param {object} attributes - Attributs à ajouter
 * @param {string} innerHTML - Contenu HTML
 * @returns {HTMLElement}
 */
function createElement(tag, attributes = {}, innerHTML = '') {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

// ============================================================
// 8. UTILITAIRES RÉSEAU
// ============================================================

/**
 * Vérifie si l'utilisateur est en ligne
 * @returns {boolean}
 */
function isOnline() {
    return navigator.onLine;
}

/**
 * Vérifie si Supabase est disponible
 * @returns {boolean}
 */
function isSupabaseAvailable() {
    return utilsIsSupabaseReady && utilsSupabaseClient !== null;
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
    if (!text) return '';
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
// 10. GESTION DES FAVORIS (utilitaires)
// ============================================================

// MODIFICATION 3: Ajout des fonctions de gestion des favoris
/**
 * Récupère la liste des favoris de l'utilisateur
 * @returns {Array} Liste des favoris
 */
function getFavorites() {
    return getFromLocalStorage('user_favorites', []);
}

/**
 * Ajoute une annonce aux favoris
 * @param {Object} annonce - L'annonce à ajouter
 */
function addToFavorites(annonce) {
    const favorites = getFavorites();
    if (!favorites.some(fav => fav.id === annonce.id)) {
        favorites.push({
            id: annonce.id,
            title: annonce.titre || annonce.title,
            price: annonce.prix || annonce.price,
            image: annonce.image_principale || annonce.main_image,
            location: annonce.localisation || annonce.location,
            added_at: new Date().toISOString()
        });
        saveToLocalStorage('user_favorites', favorites);
        showNotification('❤️ Ajouté aux favoris', 'success');
    }
}

/**
 * Supprime une annonce des favoris
 * @param {number} annonceId - ID de l'annonce
 */
function removeFromFavorites(annonceId) {
    const favorites = getFavorites().filter(fav => fav.id !== annonceId);
    saveToLocalStorage('user_favorites', favorites);
    showNotification('💔 Retiré des favoris', 'info');
}

/**
 * Vérifie si une annonce est dans les favoris
 * @param {number} annonceId - ID de l'annonce
 * @returns {boolean}
 */
function isFavorite(annonceId) {
    return getFavorites().some(fav => fav.id === annonceId);
}

// ============================================================
// 11. GESTION DE LA SESSION UTILISATEUR
// ============================================================

// MODIFICATION 4: Ajout de la gestion de session
/**
 * Récupère l'utilisateur courant depuis la session
 * @returns {Object|null}
 */
function getCurrentSessionUser() {
    const session = getFromLocalStorage('user_session', null);
    if (session && session.user) {
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        if (sessionAge < 24 * 60 * 60 * 1000) {
            return session.user;
        }
    }
    return null;
}

/**
 * Sauvegarde la session utilisateur
 * @param {Object} user - L'utilisateur
 * @param {boolean} rememberMe - Rester connecté
 */
function saveUserSession(user, rememberMe = false) {
    const session = {
        user: user,
        created_at: new Date().toISOString(),
        remember_me: rememberMe
    };
    saveToLocalStorage('user_session', session);
}

/**
 * Déconnecte l'utilisateur
 */
function logoutUser() {
    removeFromLocalStorage('user_session');
    removeFromLocalStorage('user_data');
    showNotification('👋 Vous avez été déconnecté', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ============================================================
// 12. UTILITAIRES DE DEBUG
// ============================================================

/**
 * Log avec timestamp
 * @param {string} message - Le message
 * @param {any} data - Les données à logger
 */
function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    if (data !== null) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

/**
 * Log d'erreur avec contexte
 * @param {string} context - Le contexte
 * @param {Error} error - L'erreur
 */
function debugError(context, error) {
    console.error(`[ERREUR] ${context}:`, error.message || error);
}

// ============================================================
// 13. EXTENSIONS PROTOTYPES (utiliser avec prudence)
// ============================================================

/**
 * Capitalize une chaîne
 */
if (!String.prototype.capitalize) {
    String.prototype.capitalize = function() {
        if (!this.length) return this;
        return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    };
}

/**
 * Delay pour async/await
 * @param {number} ms - Millisecondes à attendre
 * @returns {Promise}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// 14. EXPORT GLOBAL (pour usage dans tous les scripts)
// ============================================================

// MODIFICATION 5: Export global des fonctions utilitaires
window.Utils = {
    // Notifications
    showNotification,
    
    // Validation
    validateEmail,
    validatePhone,
    validatePhoneSenegal,
    validatePasswordStrength,
    validateForm,
    
    // Storage
    saveToLocalStorage,
    getFromLocalStorage,
    removeFromLocalStorage,
    clearLocalStorage,
    
    // URL
    getUrlParameter,
    setUrlParameter,
    removeUrlParameter,
    
    // Formatage
    formatDate,
    formatNumber,
    formatCFA,
    formatPrice,
    truncateText,
    cleanText,
    
    // Tableaux
    filterByKey,
    sortByKey,
    removeDuplicates,
    groupByKey,
    
    // DOM
    domReady,
    createElement,
    
    // Réseau
    isOnline,
    isSupabaseAvailable,
    
    // Sécurité
    escapeHTML,
    validateURL,
    generateUUID,
    
    // Favoris
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    
    // Session
    getCurrentSessionUser,
    saveUserSession,
    logoutUser,
    
    // Debug
    debugLog,
    debugError,
    
    // Utilitaires
    delay,
    
    // Supabase
    supabaseClient: () => utilsSupabaseClient,
    supabaseReady: () => utilsIsSupabaseReady
};

console.log('✅ utils.js chargé - Fonctions utilitaires disponibles');
console.log(`📡 Supabase: ${utilsIsSupabaseReady ? 'Connecté' : 'Hors ligne'}`);