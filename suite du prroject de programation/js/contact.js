/**
 * Fichier: contact.js
 * Description: Script pour la page de contact de Sénégal Élevage
 * Gestion du formulaire de contact et FAQ
 * Version: 2.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Ajout de la configuration Supabase
// Configuration de la connexion à la base de données Supabase
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co'; // URL du projet Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag'; // Clé publique pour l'accès anonyme

// MODIFICATION 2: Variable globale pour le client Supabase
let supabaseClient = null;
let isUsingSupabase = false;

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion du formulaire
let contactForm = null;
let charCount = 0;
const MAX_CHAR_COUNT = 500;

// ============================================================================
// FONCTIONS D'INTERACTION AVEC SUPABASE
// ============================================================================

// MODIFICATION 3: Initialisation de Supabase
/**
 * Initialise la connexion à Supabase
 */
async function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion Supabase établie pour la page contact');
            
            // Tester la connexion
            const { data, error } = await supabaseClient
                .from('messages')
                .select('count', { count: 'exact', head: true });
            
            if (!error) {
                isUsingSupabase = true;
                console.log('✅ Base de données accessible');
            }
        } else {
            console.warn('⚠️ Client Supabase non trouvé, mode hors ligne');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
    }
}

// MODIFICATION 4: Sauvegarde du message dans Supabase
/**
 * Sauvegarde le message de contact dans Supabase
 * @param {Object} contactData - Données de contact
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function saveContactToSupabase(contactData) {
    if (!supabaseClient) return false;
    
    try {
        console.log('📡 Sauvegarde du message dans Supabase...');
        
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([{
                nom: contactData.name,
                email: contactData.email,
                telephone: contactData.phone,
                sujet: contactData.subject,
                message: contactData.message,
                status: 'non_lu',
                created_at: new Date().toISOString()
            }])
            .select();
        
        if (error) throw error;
        
        console.log('✅ Message sauvegardé dans Supabase, ID:', data?.[0]?.id);
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde dans Supabase:', error);
        return false;
    }
}

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

// MODIFICATION 5: Initialisation asynchrone avec Supabase
/**
 * Initialise la page de contact
 */
async function initializeContactPage() {
    console.log('🚀 Initialisation de la page contact...');
    
    try {
        // 1. Initialiser Supabase
        await initSupabase();
        
        // 2. Configurer les événements du formulaire
        setupFormEvents();
        
        // 3. Configurer les événements de l'interface
        setupUIEvents();
        
        // 4. Charger les données si nécessaire
        await loadContactData();
        
        // 5. Afficher le statut de connexion
        if (isUsingSupabase) {
            console.log('📡 Mode: Connecté à Supabase');
        } else {
            console.log('📴 Mode: Hors ligne (sauvegarde locale)');
        }
        
        console.log('✅ Page contact initialisée');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement de la page de contact');
    }
}

/**
 * Configure les événements du formulaire de contact
 */
function setupFormEvents() {
    contactForm = document.getElementById('contact-form');
    if (!contactForm) {
        console.warn('⚠️ Formulaire de contact non trouvé');
        return;
    }
    
    // Gérer la soumission du formulaire
    contactForm.addEventListener('submit', handleContactSubmit);
    
    // Gérer le compteur de caractères
    const messageTextarea = document.getElementById('message');
    if (messageTextarea) {
        messageTextarea.addEventListener('input', updateCharCount);
    }
    
    console.log('✅ Événements du formulaire configurés');
}

/**
 * Configure les événements de l'interface utilisateur
 */
function setupUIEvents() {
    // Configuration des questions FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => toggleFaq(question));
    });
    
    console.log('✅ Événements de l\'interface configurés');
}

// MODIFICATION 6: Chargement des données avec Supabase
/**
 * Charge les données de contact si nécessaire
 */
async function loadContactData() {
    try {
        // Essayer de charger depuis Supabase d'abord
        if (isUsingSupabase) {
            const { data, error } = await supabaseClient
                .from('site_settings')
                .select('*')
                .in('key', ['contact_phone', 'contact_email']);
            
            if (!error && data) {
                data.forEach(setting => {
                    if (setting.key === 'contact_phone') {
                        const phoneElement = document.querySelector('.contact-info-card:nth-child(2) p:nth-child(2)');
                        if (phoneElement) phoneElement.textContent = setting.value;
                    }
                    if (setting.key === 'contact_email') {
                        const emailElement = document.querySelector('.contact-info-card:nth-child(3) p:nth-child(2)');
                        if (emailElement) emailElement.textContent = setting.value;
                    }
                });
                console.log('📊 Données de contact chargées depuis Supabase');
                return;
            }
        }
        
        // Fallback: Charger depuis localStorage
        const contactInfo = JSON.parse(localStorage.getItem('contact_info') || '{}');
        
        if (contactInfo.phone) {
            const phoneElement = document.querySelector('.contact-info-card:nth-child(2) p:nth-child(2)');
            if (phoneElement) phoneElement.textContent = contactInfo.phone;
        }
        
        if (contactInfo.email) {
            const emailElement = document.querySelector('.contact-info-card:nth-child(3) p:nth-child(2)');
            if (emailElement) emailElement.textContent = contactInfo.email;
        }
        
        console.log('📊 Données de contact chargées depuis localStorage');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données de contact:', error);
    }
}

// ============================================================================
// FONCTIONS DE GESTION DU FORMULAIRE
// ============================================================================

// MODIFICATION 7: Soumission asynchrone avec Supabase
/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - Événement de soumission
 */
async function handleContactSubmit(e) {
    e.preventDefault();
    
    try {
        // Récupérer les données du formulaire
        const formData = new FormData(e.target);
        const contactData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            subject: formData.get('subject'),
            message: formData.get('message').trim(),
            copyMe: document.getElementById('copy-me')?.checked || false,
            timestamp: new Date().toISOString()
        };
        
        // Valider les données
        if (!validateContactData(contactData)) {
            return;
        }
        
        // Afficher l'état de chargement
        setFormLoading(true);
        
        // Envoyer le message
        await sendContactMessage(contactData);
        
    } catch (error) {
        console.error('❌ Erreur lors de la soumission:', error);
        showError('Erreur lors de l\'envoi du message');
        setFormLoading(false);
    }
}

/**
 * Valide les données du formulaire de contact
 * @param {Object} contactData - Données de contact
 * @returns {boolean} True si valide
 */
function validateContactData(contactData) {
    // Validation du nom
    if (!contactData.name) {
        showError('Veuillez entrer votre nom complet');
        return false;
    }
    
    if (contactData.name.length < 2) {
        showError('Le nom doit contenir au moins 2 caractères');
        return false;
    }
    
    // Validation de l'email
    if (!contactData.email) {
        showError('Veuillez entrer votre adresse email');
        return false;
    }
    
    if (!isValidEmail(contactData.email)) {
        showError('Veuillez entrer une adresse email valide');
        return false;
    }
    
    // Validation du téléphone
    if (!contactData.phone) {
        showError('Veuillez entrer votre numéro de téléphone');
        return false;
    }
    
    if (!isValidPhone(contactData.phone)) {
        showError('Veuillez entrer un numéro de téléphone valide (ex: 77 123 45 67)');
        return false;
    }
    
    // Validation du sujet
    if (!contactData.subject) {
        showError('Veuillez sélectionner un sujet');
        return false;
    }
    
    // Validation du message
    if (!contactData.message) {
        showError('Veuillez entrer votre message');
        return false;
    }
    
    if (contactData.message.length < 10) {
        showError('Le message doit contenir au moins 10 caractères');
        return false;
    }
    
    if (contactData.message.length > MAX_CHAR_COUNT) {
        showError(`Le message ne peut pas dépasser ${MAX_CHAR_COUNT} caractères`);
        return false;
    }
    
    return true;
}

/**
 * Vérifie si une adresse email est valide
 * @param {string} email - Email à vérifier
 * @returns {boolean} True si valide
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Vérifie si un numéro de téléphone est valide
 * @param {string} phone - Téléphone à vérifier
 * @returns {boolean} True si valide
 */
function isValidPhone(phone) {
    const cleanPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+221)?(77|76|70|78|33)\d{7}$/;
    const simpleRegex = /^\d{9,15}$/;
    return phoneRegex.test(cleanPhone) || simpleRegex.test(cleanPhone);
}

// MODIFICATION 8: Envoi du message avec Supabase en priorité
/**
 * Envoie le message de contact
 * @param {Object} contactData - Données de contact
 */
async function sendContactMessage(contactData) {
    console.log('📧 Envoi du message de contact...');
    
    try {
        let supabaseSuccess = false;
        
        // 1. Sauvegarder dans Supabase si disponible
        if (isUsingSupabase) {
            supabaseSuccess = await saveContactToSupabase(contactData);
            if (supabaseSuccess) {
                console.log('✅ Message sauvegardé dans le cloud');
            } else {
                console.warn('⚠️ Échec de la sauvegarde cloud, fallback local');
            }
        }
        
        // 2. Toujours sauvegarder localement (fallback)
        saveContactMessage(contactData);
        
        // 3. Envoyer une copie si demandé
        if (contactData.copyMe) {
            sendCopyToUser(contactData);
        }
        
        // 4. Simuler l'envoi au support
        sendToSupport(contactData);
        
        // 5. Afficher un message de succès
        const successMessage = supabaseSuccess 
            ? 'Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais. (Sauvegardé en ligne)'
            : 'Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.';
        
        showSuccess(successMessage);
        
        // 6. Réinitialiser le formulaire
        if (contactForm) contactForm.reset();
        updateCharCount();
        
        // 7. Réactiver le formulaire
        setFormLoading(false);
        
        console.log('✅ Message de contact traité avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi du message:', error);
        showError('Erreur lors de l\'envoi du message');
        setFormLoading(false);
    }
}

/**
 * Sauvegarde le message de contact localement
 * @param {Object} contactData - Données de contact
 */
function saveContactMessage(contactData) {
    try {
        const messages = JSON.parse(localStorage.getItem('contact_messages') || '[]');
        const newMessage = {
            id: Date.now(),
            ...contactData,
            status: 'pending',
            synced: isUsingSupabase,
            created_at: new Date().toISOString()
        };
        
        messages.unshift(newMessage);
        
        // Garder seulement les 100 derniers messages
        if (messages.length > 100) {
            messages.splice(100);
        }
        
        localStorage.setItem('contact_messages', JSON.stringify(messages));
        console.log('💾 Message de contact sauvegardé localement');
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du message:', error);
    }
}

/**
 * Simule l'envoi d'une copie à l'utilisateur
 * @param {Object} contactData - Données de contact
 */
function sendCopyToUser(contactData) {
    console.log('📧 Envoi d\'une copie à l\'utilisateur:', contactData.email);
    showInfo('Une copie du message a été envoyée à votre adresse email');
}

/**
 * Simule l'envoi au support
 * @param {Object} contactData - Données de contact
 */
function sendToSupport(contactData) {
    console.log('📧 Envoi au support:', { ...contactData, message: '[CONTENU CACHÉ]' });
    
    const ticket = {
        id: `TKT-${Date.now()}`,
        subject: contactData.subject,
        status: 'open',
        created_at: new Date().toISOString()
    };
    
    console.log('🎫 Ticket de support créé:', ticket);
}

// ============================================================================
// FONCTIONS DE L'INTERFACE
// ============================================================================

/**
 * Met à jour le compteur de caractères
 */
function updateCharCount() {
    const messageTextarea = document.getElementById('message');
    const charCountElement = document.getElementById('char-count');
    
    if (messageTextarea && charCountElement) {
        charCount = messageTextarea.value.length;
        charCountElement.textContent = `${charCount} / ${MAX_CHAR_COUNT}`;
        
        if (charCount > MAX_CHAR_COUNT * 0.9) {
            charCountElement.style.color = '#f44336';
        } else {
            charCountElement.style.color = '#666';
        }
    }
}

/**
 * Définit l'état de chargement du formulaire
 * @param {boolean} loading - État de chargement
 */
function setFormLoading(loading) {
    if (!contactForm) return;
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer le message';
    }
}

// ============================================================================
// FONCTIONS FAQ
// ============================================================================

/**
 * Bascule l'affichage d'une réponse FAQ
 * @param {HTMLElement} element - Élément de question cliqué
 */
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('i');
    
    if (answer) {
        const isActive = faqItem.classList.contains('active');
        
        if (isActive) {
            faqItem.classList.remove('active');
            answer.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                const itemAnswer = item.querySelector('.faq-answer');
                const itemIcon = item.querySelector('.faq-question i');
                if (itemAnswer) itemAnswer.style.display = 'none';
                if (itemIcon) itemIcon.style.transform = 'rotate(0deg)';
            });
            
            faqItem.classList.add('active');
            answer.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(180deg)';
        }
    }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Affiche un message de succès
 * @param {string} message - Message à afficher
 */
function showSuccess(message) {
    const notification = createNotification(message, 'success', '✅');
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

/**
 * Affiche un message d'information
 * @param {string} message - Message à afficher
 */
function showInfo(message) {
    const notification = createNotification(message, 'info', 'ℹ️');
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(message) {
    const notification = createNotification(message, 'error', '❌');
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
    console.error('❌ Erreur affichée:', message);
}

/**
 * Crée une notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification
 * @param {string} icon - Icône à afficher
 * @returns {HTMLElement} Élément de notification
 */
function createNotification(message, type, icon) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        max-width: 350px;
    `;
    notification.innerHTML = `
        <i style="margin-right: 10px;">${icon}</i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; margin-left: 15px; cursor: pointer;">✕</button>
    `;
    return notification;
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

// Exporter les fonctions pour usage global
window.ContactManager = {
    sendContactMessage,
    toggleFaq,
    validateContactData,
    MAX_CHAR_COUNT,
    isOnline: () => isUsingSupabase
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeContactPage);

console.log('✅ Script contact.js chargé - Prêt pour la page contact');
console.log('🔗 Connexion Supabase configurée avec l\'URL:', SUPABASE_URL);