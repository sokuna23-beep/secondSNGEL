/**
 * Fichier: navigation.js
 * Description: Script commun pour la navigation mobile et les fonctionnalités partagées
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

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
    
    document.body.appendChild(notification);
    
    // Animation d'apparition
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Disparition automatique
    setTimeout(() => {
        notification.classList.remove('show');
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
    return `${price.toLocaleString()} ${currency}`;
}

/**
 * Tronque un texte à une longueur spécifique
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Génère les étoiles de notation
 * @param {number} rating - Note
 * @returns {string} HTML des étoiles
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Étoiles pleines
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Demi-étoile
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Étoiles vides
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
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
            timestamp: new Date().toISOString()
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
            });
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

/**
 * Ajoute ou retire une annonce des favoris
 * @param {Object} announcement - Annonce à gérer
 */
function toggleFavorite(announcement) {
    try {
        let favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        const existingIndex = favorites.findIndex(fav => fav.id === announcement.id);
        
        if (existingIndex >= 0) {
            // Retirer des favoris
            favorites.splice(existingIndex, 1);
            showNotification('💔 Retiré des favoris');
        } else {
            // Ajouter aux favoris
            favorites.push({
                id: announcement.id,
                title: announcement.titre,
                price: announcement.prix,
                image: announcement.image_principale,
                location: announcement.localisation,
                category: announcement.categorie,
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

/**
 * Incrémente le nombre de vues d'une annonce
 * @param {number} announcementId - ID de l'annonce
 */
function incrementViews(announcementId) {
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
        });
        
        // Fermer en cliquant sur un lien
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
        
        // Fermer en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });

        // Fermer avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                navLinks.classList.remove('active');
            }
        });

        // Réinitialiser lors du redimensionnement
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    navLinks.classList.remove('active');
                }
            }, 250);
        });
    }
}

// ============================================================================
// INITIALISATION AUTOMATIQUE
// ============================================================================

// Initialiser la navigation mobile quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    initializeMobileNavigation();
    setupMobileMenu();
});

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
    setupMobileMenu
};

console.log('✅ Script navigation.js chargé - Fonctions partagées disponibles');
