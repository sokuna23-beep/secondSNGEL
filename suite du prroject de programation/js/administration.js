/**
 * Fichier: administration.js
 * Description: Script pour le tableau de bord administrateur de Sénégal Élevage
 * Gestion complète de la plateforme (annonces, utilisateurs, statistiques)
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Ajout de la configuration Supabase pour l'administration
// Configuration de la connexion à la base de données Supabase
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co'; // URL du projet Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag'; // Clé publique pour l'accès anonyme

// MODIFICATION 2: Variable globale pour le client Supabase
let supabaseClient = null;

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion des données
let allAnnonces = [];
let allUsers = [];
let allMessages = [];
let currentSection = 'dashboard';
let currentUser = null;

// Variables pour les filtres
let currentFilters = {
    ads: {
        status: '',
        category: '',
        search: ''
    },
    users: {
        role: '',
        status: '',
        search: ''
    },
    messages: {
        type: '',
        status: ''
    }
};

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise le tableau de bord administrateur
 */
async function initializeAdminDashboard() {
    console.log('🚀 Initialisation du tableau de bord administrateur...');
    
    try {
        // MODIFICATION 3: Initialisation de Supabase au début
        // 0. Initialiser la connexion à Supabase
        await initSupabase();
        
        // 1. Vérifier les permissions administrateur
        await checkAdminPermissions();
        
        // 2. Charger les données depuis Supabase
        await loadAdminData();
        
        // 3. Configurer les événements
        setupNavigationEvents();
        setupFilterEvents();
        setupActionEvents();
        
        // 4. Afficher la section par défaut
        showSection('dashboard');
        
        // 5. Mettre à jour les statistiques
        await updateDashboardStats();
        
        console.log('✅ Tableau de bord administrateur initialisé');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement du tableau de bord');
    }
}

// MODIFICATION 4: Nouvelle fonction pour initialiser Supabase
/**
 * Initialise la connexion à la base de données Supabase
 * @returns {boolean} True si l'initialisation a réussi
 */
async function initSupabase() {
    try {
        // Vérifier si le client Supabase est disponible (script chargé)
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion à la base de données Supabase établie pour l\'administration');
            return true;
        } else {
            console.error('❌ Client Supabase non chargé. Vérifiez le script dans le HTML.');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        return false;
    }
}

/**
 * Vérifie si l'utilisateur a les permissions administrateur
 */
async function checkAdminPermissions() {
    try {
        // MODIFICATION 5: Utilisation de la session Supabase au lieu du localStorage
        // Vérifier la session Supabase d'abord
        if (supabaseClient) {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            
            if (session && session.user) {
                // Récupérer le rôle depuis la base de données
                const { data: profileData, error: profileError } = await supabaseClient
                    .from('eleveurs')
                    .select('role, nom_complet')
                    .eq('user_id', session.user.id)
                    .single();
                
                if (!profileError && profileData) {
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: profileData.nom_complet,
                        role: profileData.role
                    };
                } else {
                    currentUser = {
                        id: session.user.id,
                        email: session.user.email,
                        name: session.user.email,
                        role: 'eleveur'
                    };
                }
            }
        }
        
        // Fallback: Vérifier dans localStorage si Supabase n'est pas disponible
        if (!currentUser && window.AuthManager) {
            currentUser = window.AuthManager.getCurrentUser();
        }
        
        if (!currentUser) {
            console.error('❌ Aucun utilisateur connecté');
            window.location.href = 'connexion.html';
            return;
        }
        
        if (currentUser.role !== 'admin') {
            console.error('❌ Permissions administrateur requises');
            showError('Permissions administrateur requises');
            window.location.href = 'compte.html';
            return;
        }
        
        // Mettre à jour l'affichage
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            adminNameElement.textContent = currentUser.name;
        }
        
        console.log('✅ Permissions administrateur vérifiées pour:', currentUser.name);
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des permissions:', error);
        window.location.href = 'connexion.html';
    }
}

// MODIFICATION 6: Chargement des données depuis Supabase au lieu de localStorage
/**
 * Charge les données administratives depuis Supabase
 */
async function loadAdminData() {
    try {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase non disponible, utilisation du localStorage');
            // Fallback vers localStorage
            allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
            allUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
            allMessages = JSON.parse(localStorage.getItem('contact_requests') || '[]');
            
            // Ajouter les comptes de démonstration
            if (window.AuthManager) {
                const demoUsers = Object.values(window.AuthManager.DEMO_ACCOUNTS);
                demoUsers.forEach(demo => {
                    if (!allUsers.find(u => u.email === demo.email)) {
                        allUsers.push(demo);
                    }
                });
            }
            
            console.log(`📊 Données locales chargées: ${allAnnonces.length} annonces, ${allUsers.length} utilisateurs, ${allMessages.length} messages`);
            return;
        }
        
        // Charger les annonces depuis Supabase
        console.log('📡 Chargement des annonces depuis Supabase...');
        const { data: annoncesData, error: annoncesError } = await supabaseClient
            .from('annonces')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (annoncesError) throw annoncesError;
        allAnnonces = annoncesData || [];
        
        // Charger les utilisateurs depuis Supabase (table eleveurs)
        console.log('📡 Chargement des utilisateurs depuis Supabase...');
        const { data: usersData, error: usersError } = await supabaseClient
            .from('eleveurs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (usersError) throw usersError;
        allUsers = usersData || [];
        
        // Charger les messages depuis Supabase
        console.log('📡 Chargement des messages depuis Supabase...');
        const { data: messagesData, error: messagesError } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (messagesError) throw messagesError;
        allMessages = messagesData || [];
        
        console.log(`📊 Données Supabase chargées: ${allAnnonces.length} annonces, ${allUsers.length} utilisateurs, ${allMessages.length} messages`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données depuis Supabase:', error);
        // Fallback vers localStorage en cas d'erreur
        allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        allUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
        allMessages = JSON.parse(localStorage.getItem('contact_requests') || '[]');
    }
}

// ============================================================================
// FONCTIONS DE NAVIGATION
// ============================================================================

/**
 * Configure les événements de navigation
 */
function setupNavigationEvents() {
    const navLinks = document.querySelectorAll('.admin-nav .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            showSection(section);
        });
    });
    
    console.log('✅ Navigation administrateur configurée');
}

/**
 * Affiche une section spécifique du tableau de bord
 * @param {string} sectionId - ID de la section à afficher
 */
function showSection(sectionId) {
    console.log(`📂 Affichage de la section: ${sectionId}`);
    
    // Mettre à jour la navigation
    document.querySelectorAll('.admin-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Masquer toutes les sections
    document.querySelectorAll('.admin-section').forEach(section => {
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
function loadSectionData(section) {
    console.log(`📊 Chargement des données pour la section: ${section}`);
    
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'annonces':
            loadAnnoncesData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'messages':
            loadMessagesData();
            break;
        case 'statistics':
            loadStatisticsData();
            break;
        case 'settings':
            loadSettingsData();
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
        // Calculer les statistiques
        const stats = {
            totalAds: allAnnonces.length,
            totalUsers: allUsers.length,
            totalViews: allAnnonces.reduce((sum, ad) => sum + (ad.views || 0), 0),
            totalMessages: allMessages.length
        };
        
        // Mettre à jour les cartes de statistiques
        updateDashboardCards(stats);
        
        // Charger l'activité récente
        loadRecentActivity();
        
        console.log('📊 Données du tableau de bord chargées:', stats);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du tableau de bord:', error);
    }
}

/**
 * Met à jour les cartes de statistiques du tableau de bord
 * @param {Object} stats - Statistiques à afficher
 */
function updateDashboardCards(stats) {
    const elements = {
        'total-ads': stats.totalAds,
        'total-users': stats.totalUsers,
        'total-views': stats.totalViews,
        'total-messages': stats.totalMessages
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            // Animation du compteur
            animateCounter(element, 0, value, 1000);
        }
    });
}

/**
 * Anime un compteur de 0 à une valeur
 * @param {HTMLElement} element - Élément à animer
 * @param {number} start - Valeur de départ
 * @param {number} end - Valeur d'arrivée
 * @param {number} duration - Durée en ms
 */
function animateCounter(element, start, end, duration) {
    const startTime = Date.now();
    const timer = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(start + (end - start) * progress);
        element.textContent = currentValue.toLocaleString();
        
        if (progress >= 1) {
            clearInterval(timer);
        }
    }, 50);
}

/**
 * Charge l'activité récente
 */
function loadRecentActivity() {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;
    
    // Créer une liste d'activités
    const activities = [];
    
    // Ajouter les annonces récentes
    allAnnonces.slice(0, 5).forEach(ad => {
        activities.push({
            type: 'ad',
            icon: 'fa-bullhorn',
            title: `Nouvelle annonce: ${ad.titre || ad.title}`,
            time: ad.created_at,
            color: '#006837'
        });
    });
    
    // Ajouter les utilisateurs récents
    allUsers.slice(0, 3).forEach(user => {
        activities.push({
            type: 'user',
            icon: 'fa-user-plus',
            title: `Nouvel utilisateur: ${user.nom_complet || user.name}`,
            time: user.created_at,
            color: '#dc3545'
        });
    });
    
    // Ajouter les messages récents
    allMessages.slice(0, 3).forEach(msg => {
        activities.push({
            type: 'message',
            icon: 'fa-envelope',
            title: `Nouveau message de ${msg.nom || msg.userName || 'Anonyme'}`,
            time: msg.created_at || msg.timestamp,
            color: '#007bff'
        });
    });
    
    // Trier par date
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    // Afficher les activités
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <p>Aucune activité récente</p>
                </div>
            </div>
        `;
    } else {
        activityList.innerHTML = activities.slice(0, 10).map(activity => `
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

// ============================================================================
// FONCTIONS DE GESTION DES ANNONCES
// ============================================================================

/**
 * Charge les données des annonces
 */
function loadAnnoncesData() {
    displayAnnonces();
    updateBadges();
}

/**
 * Affiche les annonces dans le tableau
 */
function displayAnnonces() {
    const tbody = document.getElementById('ads-tbody');
    if (!tbody) return;
    
    // Filtrer les annonces
    let filteredAnnonces = allAnnonces.filter(ad => {
        if (currentFilters.ads.status && ad.status !== currentFilters.ads.status) return false;
        if (currentFilters.ads.category && ad.categorie !== currentFilters.ads.category) return false;
        if (currentFilters.ads.search) {
            const search = currentFilters.ads.search.toLowerCase();
            if (!(ad.titre || ad.title || '').toLowerCase().includes(search) && 
                !(ad.description || '').toLowerCase().includes(search) &&
                !(ad.nom || '').toLowerCase().includes(search)) return false;
        }
        return true;
    });
    
    // Vider le tableau
    tbody.innerHTML = '';
    
    // Afficher les annonces
    if (filteredAnnonces.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px;">
                    <i class="fas fa-search"></i> Aucune annonce trouvée
                </td>
            </tr>
        `;
        return;
    }
    
    filteredAnnonces.forEach(ad => {
        const row = createAnnonceRow(ad);
        tbody.appendChild(row);
    });
    
    console.log(`📋 ${filteredAnnonces.length} annonces affichées`);
}

/**
 * Crée une ligne de tableau pour une annonce
 * @param {Object} ad - Données de l'annonce
 * @returns {HTMLElement} Ligne du tableau
 */
function createAnnonceRow(ad) {
    const row = document.createElement('tr');
    
    const statusClass = `status-${ad.status || 'actif'}`;
    const statusText = getStatusText(ad.status);
    
    row.innerHTML = `
        <td>${ad.id || ad.id_annonce}</td>
        <td><strong>${ad.titre || ad.title}</strong></td>
        <td>${ad.categorie || ad.category || 'Non spécifié'}</td>
        <td>${(ad.prix || 0).toLocaleString()} ${ad.devise || 'XOF'}</td>
        <td>${ad.nom || ad.nom_complet || 'Anonyme'}</td>
        <td>${formatDate(ad.created_at)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="window.AdminManager.viewAnnonce(${ad.id || ad.id_annonce})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="window.AdminManager.editAnnonce(${ad.id || ad.id_annonce})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.AdminManager.deleteAnnonce(${ad.id || ad.id_annonce})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// MODIFICATION 7: Suppression d'annonce avec Supabase
/**
 * Supprime une annonce
 * @param {number} adId - ID de l'annonce
 */
async function deleteAnnonce(adId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
        return;
    }
    
    try {
        if (supabaseClient) {
            // Supprimer dans Supabase
            const { error } = await supabaseClient
                .from('annonces')
                .delete()
                .eq('id', adId);
            
            if (error) throw error;
            
            // Recharger les données
            await loadAdminData();
        } else {
            // Fallback localStorage
            const index = allAnnonces.findIndex(a => a.id === adId);
            if (index !== -1) {
                allAnnonces.splice(index, 1);
                localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
            }
        }
        
        displayAnnonces();
        updateBadges();
        showSuccess('Annonce supprimée avec succès');
        
        console.log('🗑️ Annonce supprimée:', adId);
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression de l\'annonce');
    }
}

/**
 * Affiche les détails d'une annonce
 * @param {number} adId - ID de l'annonce
 */
function viewAnnonce(adId) {
    const ad = allAnnonces.find(a => (a.id === adId || a.id_annonce === adId));
    if (!ad) return;
    
    console.log('👁️ Visualisation de l\'annonce:', ad.titre || ad.title);
    window.open(`annonce-details.html?id=${adId}`, '_blank');
}

/**
 * Modifie une annonce
 * @param {number} adId - ID de l'annonce
 */
function editAnnonce(adId) {
    const ad = allAnnonces.find(a => (a.id === adId || a.id_annonce === adId));
    if (!ad) return;
    
    console.log('✏️ Modification de l\'annonce:', ad.titre || ad.title);
    window.open(`publier-annonce.html?edit=${adId}`, '_blank');
}

// ============================================================================
// FONCTIONS DE GESTION DES UTILISATEURS
// ============================================================================

/**
 * Charge les données des utilisateurs
 */
function loadUsersData() {
    displayUsers();
    updateBadges();
}

/**
 * Affiche les utilisateurs dans le tableau
 */
function displayUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    
    // Filtrer les utilisateurs
    let filteredUsers = allUsers.filter(user => {
        if (currentFilters.users.role && user.role !== currentFilters.users.role) return false;
        if (currentFilters.users.status && user.status !== currentFilters.users.status) return false;
        if (currentFilters.users.search) {
            const search = currentFilters.users.search.toLowerCase();
            if (!(user.nom_complet || user.name || '').toLowerCase().includes(search) && 
                !(user.email || '').toLowerCase().includes(search)) return false;
        }
        return true;
    });
    
    // Vider le tableau
    tbody.innerHTML = '';
    
    // Afficher les utilisateurs
    if (filteredUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 20px;">
                    <i class="fas fa-search"></i> Aucun utilisateur trouvé
                </td>
            </tr>
        `;
        return;
    }
    
    filteredUsers.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
    
    console.log(`👥 ${filteredUsers.length} utilisateurs affichés`);
}

/**
 * Crée une ligne de tableau pour un utilisateur
 * @param {Object} user - Données de l'utilisateur
 * @returns {HTMLElement} Ligne du tableau
 */
function createUserRow(user) {
    const row = document.createElement('tr');
    
    const statusClass = `status-${user.status || 'actif'}`;
    const statusText = getStatusText(user.status);
    const userName = user.nom_complet || user.name || 'N/A';
    const userEmail = user.email || 'N/A';
    const userPhone = user.telephone || user.phone || 'N/A';
    const userRole = user.role || 'eleveur';
    const userDate = user.created_at;
    
    row.innerHTML = `
        <td>${user.user_id || user.id || 'N/A'}</td>
        <td><strong>${userName}</strong></td>
        <td>${userEmail}</td>
        <td>${userPhone}</td>
        <td><span class="role-badge">${userRole}</span></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${formatDate(userDate)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="window.AdminManager.viewUser('${userEmail}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="window.AdminManager.editUser('${userEmail}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.AdminManager.deleteUser('${userEmail}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Affiche les détails d'un utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 */
function viewUser(userEmail) {
    const user = allUsers.find(u => u.email === userEmail);
    if (!user) return;
    
    console.log('👁️ Visualisation de l\'utilisateur:', user.nom_complet || user.name);
    
    const details = `
        👤 ${user.nom_complet || user.name}\n\n
        📧 Email: ${user.email}\n
        📞 Téléphone: ${user.telephone || user.phone || 'Non spécifié'}\n
        🏷️ Rôle: ${user.role || 'eleveur'}\n
        📊 Statut: ${user.status || 'Actif'}\n
        📅 Inscription: ${formatDate(user.created_at)}\n
        📍 Région: ${user.region || 'Non spécifiée'}
    `;
    
    alert(details);
}

/**
 * Modifie un utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 */
function editUser(userEmail) {
    const user = allUsers.find(u => u.email === userEmail);
    if (!user) return;
    
    console.log('✏️ Modification de l\'utilisateur:', user.nom_complet || user.name);
    
    // En production, ouvrir un modal de modification
    showInfo('Fonctionnalité de modification en cours de développement');
}

// MODIFICATION 8: Suppression d'utilisateur avec Supabase
/**
 * Supprime un utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 */
async function deleteUser(userEmail) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        return;
    }
    
    try {
        if (supabaseClient) {
            // Trouver l'utilisateur d'abord
            const userToDelete = allUsers.find(u => u.email === userEmail);
            
            if (userToDelete && userToDelete.user_id) {
                // Supprimer l'utilisateur dans Supabase Auth
                // Note: La suppression via le client anon n'est pas autorisée
                // Cela devrait être fait via une fonction Edge ou le dashboard
                console.warn('⚠️ La suppression d\'utilisateur doit être faite via le dashboard Supabase');
                showInfo('Pour les utilisateurs Supabase, veuillez utiliser le dashboard administrateur');
            }
            
            // Supprimer le profil dans la table eleveurs
            const { error } = await supabaseClient
                .from('eleveurs')
                .delete()
                .eq('email', userEmail);
            
            if (error) throw error;
            
            // Recharger les données
            await loadAdminData();
        } else {
            // Fallback localStorage
            const index = allUsers.findIndex(u => u.email === userEmail);
            if (index !== -1) {
                allUsers.splice(index, 1);
                localStorage.setItem('local_users', JSON.stringify(allUsers));
            }
        }
        
        displayUsers();
        updateBadges();
        showSuccess('Utilisateur supprimé avec succès');
        
        console.log('🗑️ Utilisateur supprimé:', userEmail);
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression de l\'utilisateur');
    }
}

// ============================================================================
// FONCTIONS DE GESTION DES MESSAGES
// ============================================================================

/**
 * Charge les données des messages
 */
function loadMessagesData() {
    displayMessages();
    updateBadges();
}

/**
 * Affiche les messages
 */
function displayMessages() {
    const messagesList = document.getElementById('messages-list');
    if (!messagesList) return;
    
    // Filtrer les messages
    let filteredMessages = allMessages.filter(msg => {
        if (currentFilters.messages.type && msg.type !== currentFilters.messages.type) return false;
        if (currentFilters.messages.status && msg.status !== currentFilters.messages.status) return false;
        return true;
    });
    
    // Vider la liste
    messagesList.innerHTML = '';
    
    // Afficher les messages
    if (filteredMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="message-item">
                <i class="fas fa-envelope"></i>
                <p>Aucun message trouvé</p>
            </div>
        `;
        return;
    }
    
    filteredMessages.forEach(msg => {
        const messageElement = createMessageElement(msg);
        messagesList.appendChild(messageElement);
    });
    
    console.log(`📧 ${filteredMessages.length} messages affichés`);
}

/**
 * Crée un élément de message
 * @param {Object} msg - Données du message
 * @returns {HTMLElement} Élément de message
 */
function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-item';
    
    const senderName = msg.nom || msg.userName || 'Anonyme';
    const senderEmail = msg.email || msg.userEmail || '';
    const messageTitle = msg.sujet || msg.title || 'Demande de contact';
    const messageContent = msg.message || msg.userMessage || 'Pas de message';
    const messagePhone = msg.telephone || msg.phone || '';
    const messageDate = msg.created_at || msg.timestamp;
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-sender">
                <strong>${senderName}</strong>
                ${senderEmail ? `<span>(${senderEmail})</span>` : ''}
            </div>
            <div class="message-time">${formatRelativeTime(messageDate)}</div>
        </div>
        <div class="message-content">
            <p><strong>Objet:</strong> ${messageTitle}</p>
            <p>${messageContent}</p>
            ${messagePhone ? `<p><strong>Téléphone:</strong> ${messagePhone}</p>` : ''}
        </div>
    `;
    
    return messageDiv;
}

// ============================================================================
// FONCTIONS DE STATISTIQUES
// ============================================================================

/**
 * Charge les données statistiques
 */
function loadStatisticsData() {
    // En production, intégrer avec une librairie de graphiques
    console.log('📊 Chargement des statistiques détaillées');
    showInfo('Graphiques statistiques en cours de développement');
}

// ============================================================================
// FONCTIONS DE PARAMÈTRES
// ============================================================================

/**
 * Charge les données des paramètres
 */
function loadSettingsData() {
    try {
        const settings = JSON.parse(localStorage.getItem('admin_settings') || '{}');
        
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
 * Sauvegarde les paramètres
 */
function saveSettings() {
    try {
        const settings = {
            'auto-approve-ads': document.getElementById('auto-approve-ads')?.checked || false,
            'max-ads-per-user': parseInt(document.getElementById('max-ads-per-user')?.value || '10'),
            'email-verification': document.getElementById('email-verification')?.checked || false,
            'auto-approve-users': document.getElementById('auto-approve-users')?.checked || false,
            'email-notifications': document.getElementById('email-notifications')?.checked || false,
            'admin-email': document.getElementById('admin-email')?.value || ''
        };
        
        localStorage.setItem('admin_settings', JSON.stringify(settings));
        
        showSuccess('Paramètres enregistrés avec succès');
        console.log('⚙️ Paramètres sauvegardés:', settings);
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
        showError('Erreur lors de la sauvegarde des paramètres');
    }
}

/**
 * Réinitialise les paramètres
 */
function resetSettings() {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
        return;
    }
    
    try {
        localStorage.removeItem('admin_settings');
        loadSettingsData();
        showSuccess('Paramètres réinitialisés avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
        showError('Erreur lors de la réinitialisation des paramètres');
    }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Configure les événements des filtres
 */
function setupFilterEvents() {
    // Filtres des annonces
    const adFilters = ['ad-status-filter', 'ad-category-filter', 'ad-search'];
    adFilters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                updateAdFilters();
                displayAnnonces();
            });
        }
    });
    
    // Filtres des utilisateurs
    const userFilters = ['user-role-filter', 'user-status-filter', 'user-search'];
    userFilters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                updateUserFilters();
                displayUsers();
            });
        }
    });
    
    // Filtres des messages
    const messageFilters = ['message-type-filter', 'message-status-filter'];
    messageFilters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                updateMessageFilters();
                displayMessages();
            });
        }
    });
    
    console.log('✅ Événements des filtres configurés');
}

/**
 * Met à jour les filtres des annonces
 */
function updateAdFilters() {
    currentFilters.ads = {
        status: document.getElementById('ad-status-filter')?.value || '',
        category: document.getElementById('ad-category-filter')?.value || '',
        search: document.getElementById('ad-search')?.value || ''
    };
}

/**
 * Met à jour les filtres des utilisateurs
 */
function updateUserFilters() {
    currentFilters.users = {
        role: document.getElementById('user-role-filter')?.value || '',
        status: document.getElementById('user-status-filter')?.value || '',
        search: document.getElementById('user-search')?.value || ''
    };
}

/**
 * Met à jour les filtres des messages
 */
function updateMessageFilters() {
    currentFilters.messages = {
        type: document.getElementById('message-type-filter')?.value || '',
        status: document.getElementById('message-status-filter')?.value || ''
    };
}

/**
 * Configure les événements des actions
 */
function setupActionEvents() {
    // Les actions seront configurées selon les besoins
    console.log('✅ Événements des actions configurés');
}

/**
 * Met à jour les badges de navigation
 */
function updateBadges() {
    const badges = {
        'ads-count': allAnnonces.length,
        'users-count': allUsers.length,
        'messages-count': allMessages.length
    };
    
    Object.entries(badges).forEach(([id, count]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = count;
            element.style.display = count > 0 ? 'inline-block' : 'none';
        }
    });
}

/**
 * Met à jour les statistiques du tableau de bord
 */
async function updateDashboardStats() {
    // MODIFICATION 9: Recharger les données depuis Supabase pour des stats à jour
    if (supabaseClient) {
        await loadAdminData();
    }
    
    const stats = {
        totalAds: allAnnonces.length,
        totalUsers: allUsers.length,
        totalViews: allAnnonces.reduce((sum, ad) => sum + (ad.views || 0), 0),
        totalMessages: allMessages.length
    };
    
    updateDashboardCards(stats);
    updateBadges();
}

/**
 * Exporte les données de la plateforme
 */
function exportData() {
    try {
        const exportData = {
            annonces: allAnnonces,
            users: allUsers,
            messages: allMessages,
            exported_at: new Date().toISOString(),
            exported_by: currentUser?.name || 'Administrateur'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `senegal-elevage-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showSuccess('Données exportées avec succès');
        console.log('📤 Données exportées');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'exportation:', error);
        showError('Erreur lors de l\'exportation des données');
    }
}

/**
 * Affiche les notifications
 */
function showNotifications() {
    showInfo('Système de notifications en cours de développement');
}

/**
 * Affiche le modal de création d'annonce
 */
function showCreateAdModal() {
    window.open('publier-annonce.html', '_blank');
}

/**
 * Affiche le modal de création d'utilisateur
 */
function showCreateUserModal() {
    showInfo('Fonctionnalité de création d\'utilisateur en cours de développement');
}

/**
 * Retourne le texte du statut
 * @param {string} status - Statut
 * @returns {string} Texte du statut
 */
function getStatusText(status) {
    const statusTexts = {
        'actif': 'Actif',
        'inactif': 'Inactif',
        'vendu': 'Vendu',
        'supprime': 'Supprimé',
        'banni': 'Banni'
    };
    return statusTexts[status] || 'Actif';
}

/**
 * Formate une date
 * @param {string} dateString - Date à formater
 * @returns {string} Date formatée
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

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
 * @param {string} message - Message à afficher
 */
function showError(message) {
    if (window.NavigationHelper) {
        window.NavigationHelper.showError(message);
    } else {
        alert('❌ ' + message);
    }
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

// Exporter les fonctions pour usage global
window.AdminManager = {
    viewAnnonce,
    editAnnonce,
    deleteAnnonce,
    viewUser,
    editUser,
    deleteUser,
    saveSettings,
    resetSettings,
    exportData,
    showNotifications,
    showCreateAdModal,
    showCreateUserModal
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeAdminDashboard);

console.log('✅ Script administration.js chargé - Prêt pour le tableau de bord administrateur');
console.log('🔗 Connexion Supabase configurée avec l\'URL:', SUPABASE_URL);