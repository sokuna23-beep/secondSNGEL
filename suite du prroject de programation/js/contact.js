/**
 * Fichier: contact.js
 * Description: Script pour la page de contact de Sénégal Élevage
 * Gestion du formulaire de contact et FAQ
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */
 
// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion du formulaire
let contactForm = null;
let charCount = 0;
const MAX_CHAR_COUNT = 500;

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise la page de contact
 */
function initializeContactPage() {
    console.log('🚀 Initialisation de la page contact...');
    
    try {
        // 1. Configurer les événements du formulaire
        setupFormEvents();
        
        // 2. Configurer les événements de l'interface
        setupUIEvents();
        
        // 3. Charger les données si nécessaire
        loadContactData();
        
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
    // Les événements spécifiques seront ajoutés si nécessaire
    console.log('✅ Événements de l\'interface configurés');
}

/**
 * Charge les données de contact si nécessaire
 */
function loadContactData() {
    try {
        // Charger les informations de contact depuis localStorage ou config
        const contactInfo = JSON.parse(localStorage.getItem('contact_info') || '{}');
        
        // Mettre à jour les informations si disponibles
        if (contactInfo.phone) {
            const phoneElement = document.querySelector('.contact-info-card:nth-child(2) p:nth-child(2)');
            if (phoneElement) {
                phoneElement.textContent = contactInfo.phone;
            }
        }
        
        if (contactInfo.email) {
            const emailElement = document.querySelector('.contact-info-card:nth-child(3) p:nth-child(2)');
            if (emailElement) {
                emailElement.textContent = contactInfo.email;
            }
        }
        
        console.log('📊 Données de contact chargées');
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données de contact:', error);
    }
}

// ============================================================================
// FONCTIONS DE GESTION DU FORMULAIRE
// ============================================================================

/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - Événement de soumission
 */
function handleContactSubmit(e) {
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
            copyMe: document.getElementById('copy-me').checked,
            timestamp: new Date().toISOString()
        };
        
        // Valider les données
        if (!validateContactData(contactData)) {
            return;
        }
        
        // Afficher l'état de chargement
        setFormLoading(true);
        
        // Simuler l'envoi du message
        setTimeout(() => {
            sendContactMessage(contactData);
        }, 1500);
        
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
        showError('Veuillez entrer un numéro de téléphone valide');
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
    // Accepter les formats sénégalais et internationaux
    const phoneRegex = /^(\+221\s?)?(\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|\d{9,15})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Envoie le message de contact
 * @param {Object} contactData - Données de contact
 */
function sendContactMessage(contactData) {
    console.log('📧 Envoi du message de contact:', contactData);
    
    try {
        // 1. Sauvegarder localement
        saveContactMessage(contactData);
        
        // 2. Envoyer une copie si demandé
        if (contactData.copyMe) {
            sendCopyToUser(contactData);
        }
        
        // 3. Simuler l'envoi au support
        sendToSupport(contactData);
        
        // 4. Afficher un message de succès
        showSuccess('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
        
        // 5. Réinitialiser le formulaire
        contactForm.reset();
        updateCharCount();
        
        // 6. Réactiver le formulaire
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
    
    // En production, intégrer avec un service d'email
    // await sendEmail(contactData.email, 'Copie de votre message', generateCopyEmailContent(contactData));
    
    showInfo('Une copie du message a été envoyée à votre adresse email');
}

/**
 * Simule l'envoi au support
 * @param {Object} contactData - Données de contact
 */
function sendToSupport(contactData) {
    console.log('📧 Envoi au support:', contactData);
    
    // En production, intégrer avec un service d'email ou un système de tickets
    // await createSupportTicket(contactData);
    
    // Simuler la création d'un ticket
    const ticket = {
        id: `TKT-${Date.now()}`,
        subject: contactData.subject,
        status: 'open',
        created_at: new Date().toISOString()
    };
    
    console.log('🎫 Ticket de support créé:', ticket);
}

/**
 * Génère le contenu de l'email de copie
 * @param {Object} contactData - Données de contact
 * @returns {string} Contenu de l'email
 */
function generateCopyEmailContent(contactData) {
    return `
        Bonjour ${contactData.name},
        
        Voici une copie de votre message envoyé à Sénégal Élevage :
        
        Sujet : ${contactData.subject}
        Message : ${contactData.message}
        
        Date d'envoi : ${new Date().toLocaleDateString('fr-FR')}
        
        Nous traiterons votre demande dans les plus brefs délais.
        
        Cordialement,
        L'équipe Sénégal Élevage
    `;
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
        charCountElement.textContent = charCount;
        
        // Changer la couleur si on approche de la limite
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
            icon.style.transform = 'rotate(0deg)';
        } else {
            // Fermer les autres réponses
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.display = 'none';
                item.querySelector('.faq-question i').style.transform = 'rotate(0deg)';
            });
            
            // Ouvrir la réponse actuelle
            faqItem.classList.add('active');
            answer.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
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
    if (window.NavigationHelper) {
        window.NavigationHelper.showNotification(message, 'success');
    } else {
        alert('✅ ' + message);
    }
}

/**
 * Affiche un message d'information
 * @param {string} message - Message à afficher
 */
function showInfo(message) {
    if (window.NavigationHelper) {
        window.NavigationHelper.showNotification(message, 'info');
    } else {
        alert('ℹ️ ' + message);
    }
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(message) {
    if (window.NavigationHelper) {
        window.NavigationHelper.showError(message);
    } else {
        alert('❌ ' + message);
    }
}

/**
 * Formate une date
 * @param {string} dateString - Date à formater
 * @returns {string} Date formatée
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

// Exporter les fonctions pour usage global
window.ContactManager = {
    sendContactMessage,
    toggleFaq,
    validateContactData,
    MAX_CHAR_COUNT
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeContactPage);

console.log('✅ Script contact.js chargé - Prêt pour la page contact');
