/**
 * Fichier: navigation.js
 * Description: Script commun pour la navigation mobile et les fonctionnalités partagées
 * Version: 2.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Ajout de la configuration Supabase pour les fonctions partagées
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag';

// MODIFICATION 2: Variable globale pour le client Supabase
let supabaseClient = null;
let isUsingSupabase = false;

// MODIFICATION 3: Initialisation de Supabase (appelée depuis d'autres scripts)
async function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion Supabase établie pour navigation.js');
            
            // Tester la connexion
            const { error } = await supabaseClient
                .from('annonces')
                .select('count', { count: 'exact', head: true });
            
            if (!error) {
                isUsingSupabase = true;
                console.log('✅ Base de données accessible pour navigation');
            }
        } else {
            console.warn('⚠️ Client Supabase non trouvé pour navigation.js');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
    }
}

// Initialisation automatique
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
});

// ============================================================================
// FONCTIONS DE NAVIGATION MOBILE
// ============================================================================

/**
 * Initialise la navigation mobile avec support complet
 * Fonctionne sur téléphones, tablettes et écrans de bureau
 */
function initializeMobileNavigation() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileMenuBtn || !navLinks) {
        console.warn('⚠️ Éléments de navigation mobile non trouvés');
        return;
    }
    
    // Fonction pour basculer le menu
    const toggleMenu = () => {
        navLinks.classList.toggle('active');
        // Ajouter animation au bouton burger
        mobileMenuBtn.style.transition = 'transform 0.3s ease';
        if (navLinks.classList.contains('active')) {
            mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    };
    
    // Gérer le clic sur le bouton menu
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });
    
    // Fermer le menu en cliquant sur un lien
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        });
    });
    
    // Fermer le menu en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Fermer le menu avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });

    // Réinitialiser le menu lors du redimensionnement de la fenêtre
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                navLinks.classList.remove('active');
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }, 250);
    });
    
    console.log('✅ Navigation mobile initialisée avec support responsive complet');
}

// ============================================================================
// FONCTIONS DE NOTIFICATIONS
// ============================================================================

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, info)
 * @param {number} duration - Durée en millisecondes (optionnel)
 */
function showNotification(message, type = 'success', duration = 5000) {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Définir l'icône selon le type
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    if (type === 'info') icon = 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Styles pour la notification (si non définis ailleurs)
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        animation: slideIn 0.3s ease;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Disparition automatique
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
    
    console.log(`🔔 Notification affichée: ${message}`);
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(message) {
    showNotification(message, 'error', 6000);
}

/**
 * Affiche un message d'information
 * @param {string} message - Message d'information
 */
function showInfo(message) {
    showNotification(message, 'info', 4000);
}

// ============================================================================
// FONCTIONS UTILITAIRES PARTAGÉES
// ============================================================================

/**
 * Formate une date relative
 * @param {string} dateString - Date à formater
 * @returns {string} Date formatée
 */
function formatRelativeTime(dateString) {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR');
}

/**
 * Formate un prix avec devise
 * @param {number} price - Prix à formater
 * @param {string} currency - Devise
 * @returns {string} Prix formaté
 */
function formatPrice(price, currency = 'XOF') {
    if (!price && price !== 0) return 'Prix sur demande';
    return `${price.toLocaleString()} ${currency}`;
}

/**
 * Tronque un texte à une longueur spécifique
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

/**
 * Génère les étoiles de notation
 * @param {number} rating - Note
 * @returns {string} HTML des étoiles
 */
function generateStars(rating = 0) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star" style="color: #ffc107;"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star" style="color: #ffc107;"></i>';
    }
    
    return stars;
}

/**
 * Sauvegarde une demande de contact localement
 * @param {Object} requestData - Données de la demande
 */
function saveContactRequest(requestData) {
    try {
        const requests = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        requests.unshift({
            ...requestData,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            synced: isUsingSupabase
        });
        
        // Garder seulement les 100 dernières demandes
        if (requests.length > 100) {
            requests.splice(100);
        }
        
        localStorage.setItem('contact_requests', JSON.stringify(requests));
        console.log('💾 Demande de contact sauvegardée localement');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la demande:', error);
    }
}

/**
 * Partage une annonce sur les réseaux sociaux
 * @param {string} url - URL à partager
 * @param {string} title - Titre de l'annonce
 * @param {string} platform - Plateforme de partage
 */
function shareAnnouncement(url, title, platform) {
    const text = `Découvrez cette annonce: ${title} - ${url}`;
    
    let shareUrl = '';
    
    switch (platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                showNotification('📋 Lien copié dans le presse-papiers');
            }).catch(() => {
                showError('Impossible de copier le lien');
            });
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// MODIFICATION 4: Amélioration de la gestion des favoris avec Supabase
/**
 * Ajoute ou retire une annonce des favoris
 * @param {Object} announcement - Annonce à gérer
 */
async function toggleFavorite(announcement) {
    try {
        let favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        const existingIndex = favorites.findIndex(fav => fav.id === announcement.id);
        
        // Si Supabase est disponible, synchroniser avec la base de données
        if (isUsingSupabase && supabaseClient) {
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
            
            if (!userError && user) {
                if (existingIndex >= 0) {
                    // Supprimer des favoris dans Supabase
                    const { error } = await supabaseClient
                        .from('favoris')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('annonce_id', announcement.id);
                    
                    if (!error) console.log('✅ Favori supprimé de Supabase');
                } else {
                    // Ajouter aux favoris dans Supabase
                    const { error } = await supabaseClient
                        .from('favoris')
                        .insert({
                            user_id: user.id,
                            annonce_id: announcement.id
                        });
                    
                    if (!error) console.log('✅ Favori ajouté à Supabase');
                }
            }
        }
        
        // Mettre à jour localStorage
        if (existingIndex >= 0) {
            favorites.splice(existingIndex, 1);
            showNotification('💔 Retiré des favoris');
        } else {
            favorites.push({
                id: announcement.id,
                title: announcement.titre || announcement.title,
                price: announcement.prix || announcement.price,
                image: announcement.image_principale || announcement.main_image,
                location: announcement.localisation || announcement.location,
                category: announcement.categorie || announcement.category,
                added_at: new Date().toISOString()
            });
            showNotification('❤️ Ajouté aux favoris');
        }
        
        localStorage.setItem('user_favorites', JSON.stringify(favorites));
        
    } catch (error) {
        console.error('❌ Erreur lors de la gestion des favoris:', error);
        showError('Erreur lors de la gestion des favoris');
    }
}

/**
 * Vérifie si une annonce est dans les favoris
 * @param {number} announcementId - ID de l'annonce
 * @returns {boolean} True si dans les favoris
 */
function isFavorite(announcementId) {
    try {
        const favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        return favorites.some(fav => fav.id === announcementId);
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des favoris:', error);
        return false;
    }
}

/**
 * Met à jour le bouton des favoris
 * @param {number} announcementId - ID de l'annonce
 */
function updateFavoriteButton(announcementId) {
    const favoriteBtn = document.getElementById('add-favorite');
    if (!favoriteBtn) return;
    
    const isFav = isFavorite(announcementId);
    
    if (isFav) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Retirer des favoris';
        favoriteBtn.classList.add('favorited');
    } else {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Ajouter aux favoris';
        favoriteBtn.classList.remove('favorited');
    }
}

// MODIFICATION 5: Incrémentation des vues avec Supabase
/**
 * Incrémente le nombre de vues d'une annonce
 * @param {number} announcementId - ID de l'annonce
 */
async function incrementViews(announcementId) {
    try {
        // Mettre à jour dans Supabase si disponible
        if (isUsingSupabase && supabaseClient) {
            const { error } = await supabaseClient.rpc('increment_views', {
                annonce_id: announcementId
            });
            
            if (!error) {
                console.log(`✅ Vue incrémentée dans Supabase pour l'annonce ${announcementId}`);
                return;
            }
            
            // Alternative si la fonction RPC n'existe pas
            const { data: annonce, error: fetchError } = await supabaseClient
                .from('annonces')
                .select('views')
                .eq('id', announcementId)
                .single();
            
            if (!fetchError && annonce) {
                const newViews = (annonce.views || 0) + 1;
                await supabaseClient
                    .from('annonces')
                    .update({ views: newViews })
                    .eq('id', announcementId);
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'incrémentation des vues dans Supabase:', error);
    }
    
    // Fallback: Mettre à jour localStorage
    try {
        const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        const index = localAnnonces.findIndex(a => a.id == announcementId);
        
        if (index !== -1) {
            localAnnonces[index].views = (localAnnonces[index].views || 0) + 1;
            localStorage.setItem('local_annonces', JSON.stringify(localAnnonces));
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'incrémentation des vues:', error);
    }
}

/**
 * Gère le menu mobile pour les pages qui l'utilisent - Version améliorée
 * Compatible avec téléphone, tablette et bureau
 */
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        // Basculer le menu au clic
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            // Changer l'icône
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (navLinks.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Fermer en cliquant sur un lien
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
        
        // Fermer en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Réinitialiser lors du redimensionnement
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
            }, 250);
        });
    }
}

// MODIFICATION 6: Fonction pour obtenir l'utilisateur courant
/**
 * Récupère l'utilisateur courant depuis Supabase ou localStorage
 * @returns {Promise<Object|null>} Utilisateur courant ou null
 */
async function getCurrentUser() {
    // Essayer Supabase d'abord
    if (isUsingSupabase && supabaseClient) {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (!error && user) {
                return {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.nom_complet || user.email
                };
            }
        } catch (e) {
            console.warn('Erreur récupération utilisateur Supabase:', e);
        }
    }
    
    // Fallback localStorage
    try {
        const session = localStorage.getItem('user_session');
        if (session) {
            const sessionData = JSON.parse(session);
            const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
            if (sessionAge < 24 * 60 * 60 * 1000) {
                return sessionData.user;
            }
        }
    } catch (e) {
        console.warn('Erreur récupération utilisateur localStorage:', e);
    }
    
    return null;
}

// MODIFICATION 7: Fonction pour se déconnecter
/**
 * Déconnecte l'utilisateur
 */
async function logout() {
    if (isUsingSupabase && supabaseClient) {
        try {
            await supabaseClient.auth.signOut();
            console.log('✅ Déconnexion Supabase réussie');
        } catch (e) {
            console.warn('Erreur déconnexion Supabase:', e);
        }
    }
    
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_data');
    
    showNotification('👋 Vous avez été déconnecté', 'info');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// ============================================================================
// INITIALISATION AUTOMATIQUE
// ============================================================================

// Initialiser la navigation mobile quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    initializeMobileNavigation();
    setupMobileMenu();
});

// Ajouter les animations CSS si non présentes
if (!document.querySelector('#navigation-styles')) {
    const style = document.createElement('style');
    style.id = 'navigation-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .notification {
            font-family: inherit;
        }
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            margin-left: 10px;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .notification-close:hover {
            opacity: 1;
        }
        .favorited {
            background-color: #dc3545 !important;
            color: white !important;
        }
    `;
    document.head.appendChild(style);
}

// Exporter les fonctions pour usage global
window.NavigationHelper = {
    showNotification,
    showError,
    showInfo,
    formatRelativeTime,
    formatPrice,
    truncateText,
    generateStars,
    saveContactRequest,
    shareAnnouncement,
    toggleFavorite,
    isFavorite,
    updateFavoriteButton,
    incrementViews,
    setupMobileMenu,
    getCurrentUser,
    logout,
    isSupabaseAvailable: () => isUsingSupabase
};

console.log('✅ Script navigation.js chargé - Fonctions partagées disponibles');
console.log(`🔗 Connexion Supabase configurée avec l'URL: ${SUPABASE_URL}`);