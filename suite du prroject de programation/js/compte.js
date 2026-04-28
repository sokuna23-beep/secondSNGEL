/**
 * Fichier: compte.js
 * Description: Script pour la page "Mon Compte" de Sénégal Élevage
 * Gestion du profil utilisateur, des annonces, des favoris et des messages
 * Version: 1.0.0
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
            console.log('✅ Connexion Supabase établie pour le compte utilisateur');
            
            // Tester la connexion et récupérer la session
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (!error && session) {
                isUsingSupabase = true;
                console.log('✅ Utilisateur connecté à Supabase:', session.user.email);
                return true;
            } else {
                console.warn('⚠️ Aucune session Supabase active');
                return false;
            }
        } else {
            console.warn('⚠️ Client Supabase non trouvé');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
        return false;
    }
}

// MODIFICATION 4: Récupération du profil utilisateur depuis Supabase
/**
 * Récupère le profil utilisateur depuis Supabase
 * @returns {Promise<Object|null>} Profil utilisateur ou null
 */
async function fetchUserProfileFromSupabase() {
    if (!supabaseClient) return null;
    
    try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
            console.warn('⚠️ Utilisateur non connecté à Supabase');
            return null;
        }
        
        // Récupérer les informations supplémentaires depuis la table eleveurs
        const { data: profile, error: profileError } = await supabaseClient
            .from('eleveurs')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (profileError) {
            console.warn('⚠️ Profil non trouvé dans la table eleveurs:', profileError);
            // Retourner les données de base
            return {
                id: user.id,
                name: user.user_metadata?.nom_complet || user.email,
                email: user.email,
                phone: user.user_metadata?.telephone || '',
                region: '',
                bio: '',
                created_at: user.created_at,
                role: 'eleveur'
            };
        }
        
        return {
            id: user.id,
            name: profile.nom_complet || user.email,
            email: user.email,
            phone: profile.telephone || '',
            region: profile.region || '',
            bio: profile.bio || '',
            created_at: profile.created_at || user.created_at,
            role: profile.role || 'eleveur'
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        return null;
    }
}

// MODIFICATION 5: Mise à jour du profil dans Supabase
/**
 * Met à jour le profil utilisateur dans Supabase
 * @param {Object} profileData - Données du profil à mettre à jour
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function updateUserProfileInSupabase(profileData) {
    if (!supabaseClient || !currentUser?.id) return false;
    
    try {
        const { error } = await supabaseClient
            .from('eleveurs')
            .update({
                nom_complet: profileData.name,
                telephone: profileData.phone,
                region: profileData.region,
                bio: profileData.bio,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        console.log('✅ Profil mis à jour dans Supabase');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        return false;
    }
}

// MODIFICATION 6: Récupération des annonces utilisateur depuis Supabase
/**
 * Récupère les annonces de l'utilisateur depuis Supabase
 * @returns {Promise<Array>} Liste des annonces
 */
async function fetchUserAnnoncesFromSupabase() {
    if (!supabaseClient || !currentUser?.id) return [];
    
    try {
        const { data, error } = await supabaseClient
            .from('annonces')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log(`📋 ${data.length} annonces utilisateur récupérées depuis Supabase`);
        return data || [];
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des annonces:', error);
        return [];
    }
}

// MODIFICATION 7: Mise à jour du statut d'une annonce dans Supabase
/**
 * Met à jour le statut d'une annonce dans Supabase
 * @param {number} adId - ID de l'annonce
 * @param {string} status - Nouveau statut
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function updateAnnonceStatusInSupabase(adId, status) {
    if (!supabaseClient) return false;
    
    try {
        const { error } = await supabaseClient
            .from('annonces')
            .update({ status: status, updated_at: new Date().toISOString() })
            .eq('id', adId);
        
        if (error) throw error;
        
        console.log(`✅ Statut de l'annonce ${adId} mis à jour: ${status}`);
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        return false;
    }
}

// MODIFICATION 8: Suppression d'une annonce dans Supabase
/**
 * Supprime une annonce dans Supabase
 * @param {number} adId - ID de l'annonce
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function deleteAnnonceInSupabase(adId) {
    if (!supabaseClient) return false;
    
    try {
        const { error } = await supabaseClient
            .from('annonces')
            .delete()
            .eq('id', adId);
        
        if (error) throw error;
        
        console.log(`🗑️ Annonce ${adId} supprimée de Supabase`);
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        return false;
    }
}

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

// MODIFICATION 9: Initialisation avec Supabase
/**
 * Initialise la page du compte utilisateur
 */
async function initializeAccountPage() {
    console.log('🚀 Initialisation de la page Mon Compte...');
    
    // Afficher un indicateur de chargement
    showLoadingIndicator();
    
    try {
        // 1. Initialiser Supabase
        await initSupabase();
        
        // 2. Charger les données utilisateur
        await loadUserData();
        
        // 3. Vérifier si l'utilisateur est connecté
        if (!currentUser) {
            console.warn('⚠️ Aucun utilisateur connecté, redirection vers connexion');
            window.location.href = 'connexion.html';
            return;
        }
        
        // 4. Configurer les événements de navigation
        setupNavigationEvents();
        
        // 5. Configurer les formulaires
        setupFormEvents();
        
        // 6. Charger les données des sections
        await loadSectionData();
        
        // 7. Afficher la section par défaut
        showSection('dashboard');
        
        // Afficher le statut de connexion
        showConnectionStatus();
        
        console.log('✅ Page Mon Compte initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement de votre compte');
    } finally {
        hideLoadingIndicator();
    }
}

// MODIFICATION 10: Chargement des données utilisateur depuis Supabase
/**
 * Charge les données utilisateur depuis Supabase ou localStorage
 */
async function loadUserData() {
    try {
        // Priorité 1: Charger depuis Supabase
        if (isUsingSupabase) {
            const supabaseProfile = await fetchUserProfileFromSupabase();
            if (supabaseProfile) {
                currentUser = supabaseProfile;
                // Sauvegarder dans localStorage pour le fallback
                localStorage.setItem('user_data', JSON.stringify(currentUser));
                console.log('👤 Données utilisateur chargées depuis Supabase');
                updateUserDisplay();
                return;
            }
        }
        
        // Priorité 2: Charger depuis localStorage
        const userData = localStorage.getItem('user_data');
        if (userData) {
            currentUser = JSON.parse(userData);
            console.log('👤 Données utilisateur chargées depuis localStorage');
        } else {
            // Priorité 3: Données de démonstration
            currentUser = {
                id: 'demo_user',
                name: 'Mamadou Diop',
                email: 'mamadou.diop@example.com',
                phone: '+221 77 123 45 67',
                region: 'Dakar',
                bio: 'Éleveur professionnel spécialisé dans l\'élevage bovin depuis 10 ans.',
                role: 'eleveur',
                created_at: new Date().toISOString()
            };
            // Sauvegarder pour la session
            localStorage.setItem('user_data', JSON.stringify(currentUser));
            console.log('👤 Utilisateur de démonstration chargé');
        }
        
        updateUserDisplay();
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données utilisateur:', error);
        // Utiliser les données de démonstration en cas d'erreur
        currentUser = {
            id: 'demo_user',
            name: 'Utilisateur',
            email: 'user@example.com',
            phone: '+221 77 000 00 00',
            region: 'Dakar',
            bio: 'Éleveur au Sénégal.',
            role: 'eleveur'
        };
    }
}

/**
 * Affiche un indicateur de chargement
 */
function showLoadingIndicator() {
    const mainContent = document.querySelector('.account-content');
    if (mainContent) {
        mainContent.style.opacity = '0.5';
    }
}

/**
 * Cache l'indicateur de chargement
 */
function hideLoadingIndicator() {
    const mainContent = document.querySelector('.account-content');
    if (mainContent) {
        mainContent.style.opacity = '1';
    }
}

/**
 * Affiche le statut de connexion à Supabase
 */
function showConnectionStatus() {
    if (isUsingSupabase && currentUser?.id !== 'demo_user') {
        console.log('📡 Mode: Connecté à Supabase (compte en ligne)');
        const statusBadge = document.createElement('div');
        statusBadge.className = 'connection-status online';
        statusBadge.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Compte synchronisé';
        statusBadge.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #28a745; color: white; padding: 8px 15px; border-radius: 20px; font-size: 12px; z-index: 1000;';
        document.body.appendChild(statusBadge);
        setTimeout(() => statusBadge.remove(), 5000);
    } else if (currentUser?.id === 'demo_user') {
        console.log('📴 Mode: Compte de démonstration (données locales)');
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
        'profile-phone': currentUser.phone || '',
        'profile-region': currentUser.region || '',
        'profile-bio': currentUser.bio || ''
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value || '';
            } else {
                element.textContent = value || '';
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
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');
    
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
async function loadSectionData(section = currentSection) {
    console.log(`📊 Chargement des données pour la section: ${section}`);
    
    switch (section) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'my-ads':
            await loadMyAds();
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

// MODIFICATION 11: Chargement du tableau de bord avec Supabase
/**
 * Charge les données du tableau de bord
 */
async function loadDashboardData() {
    try {
        let userAds = [];
        let favorites = [];
        let userMessagesList = [];
        
        // Récupérer les annonces depuis Supabase ou localStorage
        if (isUsingSupabase && currentUser?.id !== 'demo_user') {
            userAds = await fetchUserAnnoncesFromSupabase();
        } else {
            const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
            userAds = localAnnonces.filter(ad => ad.user_id === currentUser.id || ad.user_id === currentUser.email);
        }
        
        // Récupérer les favoris
        favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        
        // Récupérer les messages
        const messages = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        userMessagesList = messages.filter(msg => 
            msg.userName === currentUser.name || 
            msg.userEmail === currentUser.email
        );
        
        // Calculer les statistiques
        const stats = {
            totalAds: userAds.length,
            totalViews: userAds.reduce((sum, ad) => sum + (ad.views || 0), 0),
            totalFavorites: favorites.length,
            totalMessages: userMessagesList.length
        };
        
        // Mettre à jour les statistiques
        updateDashboardStats(stats);
        
        // Charger l'activité récente
        loadRecentActivity(userAds, userMessagesList);
        
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
            title: `Nouvelle annonce publiée: ${ad.titre || ad.title}`,
            time: ad.created_at,
            color: '#006837'
        });
    });
    
    // Ajouter les messages récents
    messages.slice(0, 3).forEach(msg => {
        activities.push({
            type: 'message',
            icon: 'fa-envelope',
            title: `Nouveau message de ${msg.userName || msg.nom}`,
            time: msg.timestamp || msg.created_at,
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

// MODIFICATION 12: Chargement des annonces utilisateur avec Supabase
/**
 * Charge les annonces de l'utilisateur
 */
async function loadMyAds() {
    try {
        if (isUsingSupabase && currentUser?.id !== 'demo_user') {
            userAnnonces = await fetchUserAnnoncesFromSupabase();
        } else {
            const allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
            userAnnonces = allAnnonces.filter(ad => ad.user_id === currentUser.id || ad.user_id === currentUser.email);
        }
        
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
            <img src="${ad.image_principale || ad.main_image || 'placeholder.jpg'}" alt="${ad.titre || ad.title}" class="ad-image">
            <div class="ad-info">
                <h4 class="ad-title">${ad.titre || ad.title}</h4>
                <div class="ad-price">${(ad.prix || ad.price || 0).toLocaleString()} ${ad.devise || 'XOF'}</div>
                <div class="ad-meta">
                    <span class="ad-status status-${(ad.status || 'active')}">
                        ${getStatusText(ad.status)}
                    </span>
                    <span class="ad-views">
                        <i class="fas fa-eye"></i> ${ad.views || 0}
                    </span>
                </div>
                <div class="ad-actions">
                    <button class="btn btn-sm btn-primary" onclick="window.AccountManager.editAd(${ad.id})">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.AccountManager.toggleAdStatus(${ad.id})">
                        <i class="fas fa-power-off"></i> ${ad.status === 'active' ? 'Désactiver' : 'Activer'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.AccountManager.deleteAd(${ad.id})">
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
        'actif': 'Active',
        'inactive': 'Inactive',
        'inactif': 'Inactive',
        'sold': 'Vendue',
        'vendu': 'Vendue',
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
                <div class="favorite-price">${(ad.prix || 0).toLocaleString()} ${ad.devise || 'XOF'}</div>
                <div class="favorite-location">
                    <i class="fas fa-map-marker-alt"></i> ${ad.localisation}
                </div>
                <div class="favorite-actions">
                    <a href="annonce-details.html?id=${ad.id}" class="btn btn-sm btn-primary">
                        <i class="fas fa-eye"></i> Voir
                    </a>
                    <button class="btn btn-sm btn-outline" onclick="window.AccountManager.removeFavorite(${ad.id})">
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
            msg.userEmail === currentUser.email ||
            msg.nom === currentUser.name ||
            msg.email === currentUser.email
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
                <span class="message-sender">${msg.userName || msg.nom || 'Anonyme'}</span>
                <span class="message-time">${formatRelativeTime(msg.timestamp || msg.created_at)}</span>
            </div>
            <div class="message-content">
                <p><strong>Type de demande:</strong> ${msg.messageType || msg.type || 'Contact'}</p>
                <p><strong>Téléphone:</strong> ${msg.userPhone || msg.telephone || 'Non spécifié'}</p>
                <p><strong>Région:</strong> ${msg.userRegion || msg.region || 'Non spécifiée'}</p>
                ${msg.userMessage || msg.message ? `<p><strong>Message:</strong> ${msg.userMessage || msg.message}</p>` : ''}
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
            'email-notifications': document.getElementById('email-notifications')?.checked || false,
            'sms-notifications': document.getElementById('sms-notifications')?.checked || false,
            'show-phone': document.getElementById('show-phone')?.checked || false,
            'show-email': document.getElementById('show-email')?.checked || false,
            'theme-select': document.getElementById('theme-select')?.value || 'light'
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
            const status = btn.dataset.status;
            if (status === 'all') {
                displayMyAds(userAnnonces);
            } else {
                const filtered = userAnnonces.filter(ad => (ad.status || 'active') === status);
                displayMyAds(filtered);
            }
        });
    });
    
    console.log('✅ Événements des formulaires configurés');
}

// MODIFICATION 13: Mise à jour du profil avec Supabase
/**
 * Gère la soumission du formulaire de profil
 * @param {Event} e - Événement de soumission
 */
async function handleProfileSubmit(e) {
    e.preventDefault();
    
    try {
        // Récupérer les nouvelles valeurs
        const updatedData = {
            name: document.getElementById('profile-nom')?.value || currentUser.name,
            email: document.getElementById('profile-email')?.value || currentUser.email,
            phone: document.getElementById('profile-phone')?.value || currentUser.phone,
            region: document.getElementById('profile-region')?.value || currentUser.region,
            bio: document.getElementById('profile-bio')?.value || currentUser.bio
        };
        
        // Mettre à jour dans Supabase si disponible
        let supabaseSuccess = false;
        if (isUsingSupabase && currentUser?.id !== 'demo_user') {
            supabaseSuccess = await updateUserProfileInSupabase(updatedData);
        }
        
        // Mettre à jour les données locales
        currentUser.name = updatedData.name;
        currentUser.email = updatedData.email;
        currentUser.phone = updatedData.phone;
        currentUser.region = updatedData.region;
        currentUser.bio = updatedData.bio;
        currentUser.updatedAt = new Date().toISOString();
        
        // Sauvegarder dans localStorage
        localStorage.setItem('user_data', JSON.stringify(currentUser));
        
        // Mettre à jour l'affichage
        updateUserDisplay();
        
        const message = supabaseSuccess ? 
            '✅ Profil mis à jour et synchronisé avec le cloud' : 
            '✅ Profil mis à jour localement';
        
        showNotification(message);
        
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
    if (!dateString) return 'Date inconnue';
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

// MODIFICATION 14: Modification du statut d'annonce avec Supabase
/**
 * Bascule le statut d'une annonce
 * @param {number} adId - ID de l'annonce
 */
async function toggleAdStatus(adId) {
    try {
        let newStatus = '';
        
        if (isUsingSupabase && currentUser?.id !== 'demo_user') {
            // Trouver l'annonce actuelle
            const currentAd = userAnnonces.find(ad => ad.id === adId);
            const currentStatus = currentAd?.status || 'active';
            newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            const success = await updateAnnonceStatusInSupabase(adId, newStatus);
            if (!success) throw new Error('Erreur Supabase');
        } else {
            // Fallback localStorage
            const allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
            const adIndex = allAnnonces.findIndex(ad => ad.id === adId);
            
            if (adIndex !== -1) {
                const currentStatus = allAnnonces[adIndex].status || 'active';
                newStatus = currentStatus === 'active' ? 'inactive' : 'active';
                allAnnonces[adIndex].status = newStatus;
                allAnnonces[adIndex].updatedAt = new Date().toISOString();
                localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
            }
        }
        
        await loadMyAds(); // Recharger la section
        showNotification(`✅ Annonce ${newStatus === 'active' ? 'activée' : 'désactivée'}`);
        
    } catch (error) {
        console.error('❌ Erreur lors du changement de statut:', error);
        showError('Erreur lors du changement de statut');
    }
}

// MODIFICATION 15: Suppression d'annonce avec Supabase
/**
 * Supprime une annonce
 * @param {number} adId - ID de l'annonce à supprimer
 */
async function deleteAd(adId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
        return;
    }
    
    try {
        if (isUsingSupabase && currentUser?.id !== 'demo_user') {
            const success = await deleteAnnonceInSupabase(adId);
            if (!success) throw new Error('Erreur Supabase');
        } else {
            // Fallback localStorage
            let allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
            allAnnonces = allAnnonces.filter(ad => ad.id !== adId);
            localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
        }
        
        await loadMyAds(); // Recharger la section
        showNotification('🗑️ Annonce supprimée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression de l\'annonce');
    }
}

/**
 * Modifie une annonce
 * @param {number} adId - ID de l'annonce à modifier
 */
function editAd(adId) {
    console.log(`✏️ Modification de l'annonce ${adId}`);
    window.location.href = `publier-annonce.html?edit=${adId}`;
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
    refreshData: () => loadSectionData(),
    editAd: editAd,
    toggleAdStatus: toggleAdStatus,
    deleteAd: deleteAd,
    removeFavorite: removeFavorite,
    isOnline: () => isUsingSupabase
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeAccountPage);

console.log('✅ Script compte.js chargé - Prêt pour la page compte');
console.log('🔗 Connexion Supabase configurée avec l\'URL:', SUPABASE_URL);