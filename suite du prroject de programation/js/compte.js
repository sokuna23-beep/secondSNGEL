/**
 * Fichier: compte.js
 * Description: Script pour la page "Mon Compte" de Sénégal Élevage
 * Gestion du profil utilisateur, des annonces, des favoris et des messages
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion des données utilisateur
let currentUser = null;
let userAnnonces = [];
let userFavorites = [];
let userMessages = [];
let currentSection = 'dashboard';

// Configuration des sections du compte
const SECTIONS = {
    dashboard: 'Tableau de bord',
    profile: 'Mon profil',
    'my-ads': 'Mes annonces',
    favorites: 'Favoris',
    messages: 'Messages',
    settings: 'Paramètres'
};

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise la page du compte utilisateur
 */
function initializeAccountPage() {
    console.log('🚀 Initialisation de la page Mon Compte...');
    
    try {
        // 1. Charger les données utilisateur
        loadUserData();
        
        // 2. Configurer les événements de navigation
        setupNavigationEvents();
        
        // 3. Configurer les formulaires
        setupFormEvents();
        
        // 4. Charger les données des sections
        loadSectionData();
        
        // 5. Afficher la section par défaut
        showSection('dashboard');
        
        console.log('✅ Page Mon Compte initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement de votre compte');
    }
}

/**
 * Charge les données utilisateur depuis localStorage
 */
function loadUserData() {
    try {
        // Récupérer les données utilisateur
        const userData = localStorage.getItem('user_data');
        if (userData) {
            currentUser = JSON.parse(userData);
        } else {
            // Données de démonstration si aucun utilisateur trouvé
            currentUser = {
                id: 'demo_user',
                name: 'Mamadou Diop',
                email: 'mamadou.diop@example.com',
                phone: '+221 77 123 45 67',
                region: 'Dakar',
                bio: 'Éleveur professionnel spécialisé dans l\'élevage bovin depuis 10 ans.',
                createdAt: new Date().toISOString()
            };
            // Sauvegarder pour la session
            localStorage.setItem('user_data', JSON.stringify(currentUser));
        }
        
        // Mettre à jour l'affichage
        updateUserDisplay();
        
        console.log('👤 Données utilisateur chargées:', currentUser);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données utilisateur:', error);
        // Utiliser les données de démonstration en cas d'erreur
        currentUser = {
            id: 'demo_user',
            name: 'Utilisateur',
            email: 'user@example.com',
            phone: '+221 77 000 00 00',
            region: 'Dakar',
            bio: 'Éleveur au Sénégal.'
        };
    }
}

/**
 * Met à jour l'affichage des informations utilisateur
 */
function updateUserDisplay() {
    if (!currentUser) return;
    
    // Mettre à jour les éléments d'affichage
    const elements = {
        'user-name': currentUser.name,
        'user-email': currentUser.email,
        'profile-nom': currentUser.name,
        'profile-email': currentUser.email,
        'profile-phone': currentUser.phone,
        'profile-region': currentUser.region,
        'profile-bio': currentUser.bio || ''
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    });
}

// ============================================================================
// FONCTIONS DE NAVIGATION
// ============================================================================

/**
 * Configure les événements de navigation entre sections
 */
function setupNavigationEvents() {
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
    
    console.log('✅ Navigation configurée');
}

/**
 * Affiche une section spécifique du compte
 * @param {string} sectionId - ID de la section à afficher
 */
function showSection(sectionId) {
    console.log(`📂 Affichage de la section: ${sectionId}`);
    
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
    // Masquer toutes les sections
    document.querySelectorAll('.account-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionId;
        
        // Charger les données spécifiques à la section
        loadSectionData(sectionId);
    }
}

/**
 * Charge les données spécifiques à chaque section
 * @param {string} section - Section actuelle
 */
function loadSectionData(section = currentSection) {
    console.log(`📊 Chargement des données pour la section: ${section}`);
    
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'my-ads':
            loadMyAds();
            break;
        case 'favorites':
            loadFavorites();
            break;
        case 'messages':
            loadMessages();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// ============================================================================
// FONCTIONS DU TABLEAU DE BORD
// ============================================================================

/**
 * Charge les données du tableau de bord
 */
function loadDashboardData() {
    try {
        // Récupérer les annonces locales
        const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        const userAds = localAnnonces.filter(ad => ad.user_id === currentUser.id);
        
        // Récupérer les favoris
        const favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        
        // Récupérer les messages
        const messages = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        const userMessages = messages.filter(msg => 
            msg.userName === currentUser.name || 
            msg.userEmail === currentUser.email
        );
        
        // Calculer les statistiques
        const stats = {
            totalAds: userAds.length,
            totalViews: userAds.reduce((sum, ad) => sum + (ad.views || 0), 0),
            totalFavorites: favorites.length,
            totalMessages: userMessages.length
        };
        
        // Mettre à jour les statistiques
        updateDashboardStats(stats);
        
        // Charger l'activité récente
        loadRecentActivity(userAds, userMessages);
        
        // Mettre à jour les badges
        updateBadges(stats);
        
        console.log('📊 Données du tableau de bord chargées:', stats);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du tableau de bord:', error);
    }
}

/**
 * Met à jour les statistiques du tableau de bord
 * @param {Object} stats - Statistiques à afficher
 */
function updateDashboardStats(stats) {
    const elements = {
        'total-ads': stats.totalAds,
        'total-views': stats.totalViews,
        'total-favorites': stats.totalFavorites,
        'total-messages': stats.totalMessages
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value.toLocaleString();
        }
    });
}

/**
 * Charge l'activité récente
 * @param {Array} ads - Annonces de l'utilisateur
 * @param {Array} messages - Messages de l'utilisateur
 */
function loadRecentActivity(ads, messages) {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;
    
    // Créer une liste d'activités
    const activities = [];
    
    // Ajouter les annonces récentes
    ads.slice(0, 3).forEach(ad => {
        activities.push({
            type: 'ad',
            icon: 'fa-bullhorn',
            title: `Nouvelle annonce publiée: ${ad.titre}`,
            time: ad.created_at,
            color: '#006837'
        });
    });
    
    // Ajouter les messages récents
    messages.slice(0, 3).forEach(msg => {
        activities.push({
            type: 'message',
            icon: 'fa-envelope',
            title: `Nouveau message de ${msg.userName}`,
            time: msg.timestamp,
            color: '#2196F3'
        });
    });
    
    // Trier par date
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Afficher les activités
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="no-content">
                <i class="fas fa-clock"></i>
                <p>Aucune activité récente</p>
            </div>
        `;
    } else {
        activityList.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${activity.color}20; color: ${activity.color};">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.title}</p>
                    <span class="activity-time">${formatRelativeTime(activity.time)}</span>
                </div>
            </div>
        `).join('');
    }
}

/**
 * Met à jour les badges de navigation
 * @param {Object} stats - Statistiques pour les badges
 */
function updateBadges(stats) {
    const badges = {
        'ads-count': stats.totalAds,
        'favorites-count': stats.totalFavorites,
        'messages-count': stats.totalMessages
    };
    
    Object.entries(badges).forEach(([id, count]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline-block' : 'none';
        }
    });
}

// ============================================================================
// FONCTIONS DES ANNONCES
// ============================================================================

/**
 * Charge les annonces de l'utilisateur
 */
function loadMyAds() {
    try {
        const allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        userAnnonces = allAnnonces.filter(ad => ad.user_id === currentUser.id);
        
        displayMyAds(userAnnonces);
        
        console.log(`📋 ${userAnnonces.length} annonces utilisateur chargées`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des annonces:', error);
    }
}

/**
 * Affiche les annonces de l'utilisateur
 * @param {Array} ads - Annonces à afficher
 */
function displayMyAds(ads) {
    const container = document.getElementById('my-ads-list');
    if (!container) return;
    
    if (ads.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <i class="fas fa-bullhorn"></i>
                <h3>Vous n'avez pas encore d'annonce</h3>
                <p>Commencez par créer votre première annonce</p>
                <a href="publier-annonce.html" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Créer une annonce
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ads.map(ad => `
        <div class="ad-card">
            <img src="${ad.image_principale || 'placeholder.jpg'}" alt="${ad.titre}" class="ad-image">
            <div class="ad-info">
                <h4 class="ad-title">${ad.titre}</h4>
                <div class="ad-price">${ad.prix.toLocaleString()} ${ad.devise || 'XOF'}</div>
                <div class="ad-meta">
                    <span class="ad-status status-${ad.status || 'active'}">
                        ${getStatusText(ad.status)}
                    </span>
                    <span class="ad-views">
                        <i class="fas fa-eye"></i> ${ad.views || 0}
                    </span>
                </div>
                <div class="ad-actions">
                    <button class="btn btn-sm btn-primary" onclick="editAd(${ad.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="toggleAdStatus(${ad.id})">
                        <i class="fas fa-power-off"></i> ${ad.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAd(${ad.id})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Retourne le texte du statut d'une annonce
 * @param {string} status - Statut de l'annonce
 * @returns {string} Texte du statut
 */
function getStatusText(status) {
    const statusTexts = {
        'active': 'Active',
        'inactive': 'Inactive',
        'sold': 'Vendue',
        'supprime': 'Supprimée'
    };
    return statusTexts[status] || 'Active';
}

// ============================================================================
// FONCTIONS DES FAVORIS
// ============================================================================

/**
 * Charge les favoris de l'utilisateur
 */
function loadFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        const allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        
        // Filtrer les annonces favorites
        userFavorites = allAnnonces.filter(ad => 
            favorites.some(fav => fav.id === ad.id)
        );
        
        displayFavorites(userFavorites);
        
        console.log(`❤️ ${userFavorites.length} favoris chargés`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des favoris:', error);
    }
}

/**
 * Affiche les favoris
 * @param {Array} favorites - Favoris à afficher
 */
function displayFavorites(favorites) {
    const container = document.getElementById('favorites-list');
    if (!container) return;
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <i class="fas fa-heart"></i>
                <h3>Vous n'avez pas encore de favoris</h3>
                <p>Browsez les annonces et ajoutez vos préférées</p>
                <a href="annonces.html" class="btn btn-primary">
                    <i class="fas fa-search"></i> Parcourir les annonces
                </a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = favorites.map(ad => `
        <div class="favorite-card">
            <img src="${ad.image_principale || 'placeholder.jpg'}" alt="${ad.titre}" class="favorite-image">
            <div class="favorite-info">
                <h4 class="favorite-title">${ad.titre}</h4>
                <div class="favorite-price">${ad.prix.toLocaleString()} ${ad.devise || 'XOF'}</div>
                <div class="favorite-location">
                    <i class="fas fa-map-marker-alt"></i> ${ad.localisation}
                </div>
                <div class="favorite-actions">
                    <a href="annonces.html" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Voir
                    </a>
                    <button class="btn btn-sm btn-outline" onclick="removeFavorite(${ad.id})">
                        <i class="fas fa-heart-broken"></i> Retirer
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================================================
// FONCTIONS DES MESSAGES
// ============================================================================

/**
 * Charge les messages de l'utilisateur
 */
function loadMessages() {
    try {
        const allMessages = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        userMessages = allMessages.filter(msg => 
            msg.userName === currentUser.name || 
            msg.userEmail === currentUser.email
        );
        
        displayMessages(userMessages);
        
        console.log(`📧 ${userMessages.length} messages chargés`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des messages:', error);
    }
}

/**
 * Affiche les messages
 * @param {Array} messages - Messages à afficher
 */
function displayMessages(messages) {
    const container = document.getElementById('messages-list');
    if (!container) return;
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <i class="fas fa-envelope"></i>
                <h3>Vous n'avez pas encore de message</h3>
                <p>Les messages des acheteurs apparaîtront ici</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(msg => `
        <div class="message-item">
            <div class="message-header">
                <span class="message-sender">${msg.userName}</span>
                <span class="message-time">${formatRelativeTime(msg.timestamp)}</span>
            </div>
            <div class="message-content">
                <p><strong>Type de demande:</strong> ${msg.messageType}</p>
                <p><strong>Téléphone:</strong> ${msg.userPhone}</p>
                <p><strong>Région:</strong> ${msg.userRegion}</p>
                ${msg.userMessage ? `<p><strong>Message:</strong> ${msg.userMessage}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================================================
// FONCTIONS DES PARAMÈTRES
// ============================================================================

/**
 * Charge les paramètres de l'utilisateur
 */
function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
        
        // Appliquer les paramètres
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
        
        console.log('⚙️ Paramètres chargés:', settings);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des paramètres:', error);
    }
}

/**
 * Sauvegarde les paramètres de l'utilisateur
 */
function saveSettings() {
    try {
        const settings = {
            'email-notifications': document.getElementById('email-notifications').checked,
            'sms-notifications': document.getElementById('sms-notifications').checked,
            'show-phone': document.getElementById('show-phone').checked,
            'show-email': document.getElementById('show-email').checked,
            'theme-select': document.getElementById('theme-select').value
        };
        
        localStorage.setItem('user_settings', JSON.stringify(settings));
        
        showNotification('⚙️ Paramètres enregistrés avec succès');
        
        console.log('⚙️ Paramètres sauvegardés:', settings);
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
        showError('Erreur lors de la sauvegarde des paramètres');
    }
}

// ============================================================================
// FONCTIONS DES FORMULAIRES
// ============================================================================

/**
 * Configure les événements des formulaires
 */
function setupFormEvents() {
    // Formulaire de profil
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Bouton de sauvegarde des paramètres
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }
    
    // Filtres des annonces
    const filterButtons = document.querySelectorAll('.ads-filters .filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterMyAds(btn.dataset.status);
        });
    });
    
    console.log('✅ Événements des formulaires configurés');
}

/**
 * Gère la soumission du formulaire de profil
 * @param {Event} e - Événement de soumission
 */
function handleProfileSubmit(e) {
    e.preventDefault();
    
    try {
        // Mettre à jour les données utilisateur
        currentUser.name = document.getElementById('profile-nom').value;
        currentUser.email = document.getElementById('profile-email').value;
        currentUser.phone = document.getElementById('profile-phone').value;
        currentUser.region = document.getElementById('profile-region').value;
        currentUser.bio = document.getElementById('profile-bio').value;
        currentUser.updatedAt = new Date().toISOString();
        
        // Sauvegarder
        localStorage.setItem('user_data', JSON.stringify(currentUser));
        
        // Mettre à jour l'affichage
        updateUserDisplay();
        
        showNotification('✅ Profil mis à jour avec succès');
        
        console.log('✅ Profil utilisateur mis à jour:', currentUser);
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        showError('Erreur lors de la mise à jour du profil');
    }
}

// ============================================================================
// FONCTIONS UTILITAIRES
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
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('fr-FR');
}

/**
 * Filtre les annonces par statut
 * @param {string} status - Statut de filtrage
 */
function filterMyAds(status) {
    let filtered = userAnnonces;
    
    if (status !== 'all') {
        filtered = userAnnonces.filter(ad => (ad.status || 'active') === status);
    }
    
    displayMyAds(filtered);
}

/**
 * Modifie une annonce
 * @param {number} adId - ID de l'annonce à modifier
 */
function editAd(adId) {
    console.log(`✏️ Modification de l'annonce ${adId}`);
    // Rediriger vers la page de création avec les données de l'annonce
    window.location.href = `publier-annonce.html?edit=${adId}`;
}

/**
 * Bascule le statut d'une annonce
 * @param {number} adId - ID de l'annonce
 */
function toggleAdStatus(adId) {
    try {
        const allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        const adIndex = allAnnonces.findIndex(ad => ad.id === adId);
        
        if (adIndex !== -1) {
            const currentStatus = allAnnonces[adIndex].status || 'active';
            allAnnonces[adIndex].status = currentStatus === 'active' ? 'inactive' : 'active';
            allAnnonces[adIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
            
            loadMyAds(); // Recharger la section
            showNotification(`✅ Annonce ${allAnnonces[adIndex].status === 'active' ? 'activée' : 'désactivée'}`);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du changement de statut:', error);
        showError('Erreur lors du changement de statut');
    }
}

/**
 * Supprime une annonce
 * @param {number} adId - ID de l'annonce à supprimer
 */
function deleteAd(adId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
        return;
    }
    
    try {
        let allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        allAnnonces = allAnnonces.filter(ad => ad.id !== adId);
        
        localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
        
        loadMyAds(); // Recharger la section
        showNotification('🗑️ Annonce supprimée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression de l\'annonce');
    }
}

/**
 * Retire un favori
 * @param {number} adId - ID de l'annonce à retirer des favoris
 */
function removeFavorite(adId) {
    try {
        let favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        favorites = favorites.filter(fav => fav.id !== adId);
        
        localStorage.setItem('user_favorites', JSON.stringify(favorites));
        
        loadFavorites(); // Recharger la section
        showNotification('💔 Retiré des favoris');
        
    } catch (error) {
        console.error('❌ Erreur lors du retrait des favoris:', error);
        showError('Erreur lors du retrait des favoris');
    }
}

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    console.log('🔔 Notification affichée:', message);
}

/**
 * Affiche un message d'erreur
 * @param {string} message - Message d'erreur
 */
function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    console.error('❌ Erreur affichée:', message);
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

// Exporter les fonctions pour usage global
window.AccountManager = {
    getCurrentUser: () => ({...currentUser}),
    getMyAds: () => [...userAnnonces],
    getFavorites: () => [...userFavorites],
    getMessages: () => [...userMessages],
    refreshData: loadSectionData,
    editAd: editAd,
    deleteAd: deleteAd,
    removeFavorite: removeFavorite
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeAccountPage);

console.log('✅ Script compte.js chargé - Prêt pour la page compte');
