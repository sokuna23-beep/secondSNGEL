/**
 * Fichier: administration.js
 * Description: Script pour le tableau de bord administrateur de Sénégal Élevage
 * Gestion complète de la plateforme (annonces, utilisateurs, statistiques)
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

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
function initializeAdminDashboard() {
    console.log('🚀 Initialisation du tableau de bord administrateur...');
    
    try {
        // 1. Vérifier les permissions administrateur
        checkAdminPermissions();
        
        // 2. Charger les données
        loadAdminData();
        
        // 3. Configurer les événements
        setupNavigationEvents();
        setupFilterEvents();
        setupActionEvents();
        
        // 4. Afficher la section par défaut
        showSection('dashboard');
        
        // 5. Mettre à jour les statistiques
        updateDashboardStats();
        
        console.log('✅ Tableau de bord administrateur initialisé');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement du tableau de bord');
    }
}

/**
 * Vérifie si l'utilisateur a les permissions administrateur
 */
function checkAdminPermissions() {
    try {
        currentUser = AuthManager.getCurrentUser();
        
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
        document.getElementById('admin-name').textContent = currentUser.name;
        
        console.log('✅ Permissions administrateur vérifiées pour:', currentUser.name);
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des permissions:', error);
        window.location.href = 'connexion.html';
    }
}

/**
 * Charge les données administratives
 */
function loadAdminData() {
    try {
        // Charger les annonces
        allAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        
        // Charger les utilisateurs
        allUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
        
        // Ajouter les comptes de démonstration
        const demoUsers = Object.values(AuthManager.DEMO_ACCOUNTS);
        demoUsers.forEach(demo => {
            if (!allUsers.find(u => u.email === demo.email)) {
                allUsers.push(demo);
            }
        });
        
        // Charger les messages
        allMessages = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        
        console.log(`📊 Données chargées: ${allAnnonces.length} annonces, ${allUsers.length} utilisateurs, ${allMessages.length} messages`);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        allAnnonces = [];
        allUsers = [];
        allMessages = [];
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
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    
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
            title: `Nouvelle annonce: ${ad.titre}`,
            time: ad.created_at,
            color: '#006837'
        });
    });
    
    // Ajouter les utilisateurs récents
    allUsers.slice(0, 3).forEach(user => {
        activities.push({
            type: 'user',
            icon: 'fa-user-plus',
            title: `Nouvel utilisateur: ${user.name}`,
            time: user.created_at || new Date().toISOString(),
            color: '#dc3545'
        });
    });
    
    // Ajouter les messages récents
    allMessages.slice(0, 3).forEach(msg => {
        activities.push({
            type: 'message',
            icon: 'fa-envelope',
            title: `Nouveau message de ${msg.userName}`,
            time: msg.timestamp,
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
            if (!ad.titre.toLowerCase().includes(search) && 
                !ad.description.toLowerCase().includes(search) &&
                !ad.nom.toLowerCase().includes(search)) return false;
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
        <td>${ad.id}</td>
        <td><strong>${ad.titre}</strong></td>
        <td>${ad.categorie || 'Non spécifié'}</td>
        <td>${ad.prix.toLocaleString()} ${ad.devise || 'XOF'}</td>
        <td>${ad.nom}</td>
        <td>${formatDate(ad.created_at)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="viewAnnonce(${ad.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editAnnonce(${ad.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteAnnonce(${ad.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Affiche les détails d'une annonce
 * @param {number} adId - ID de l'annonce
 */
function viewAnnonce(adId) {
    const ad = allAnnonces.find(a => a.id === adId);
    if (!ad) return;
    
    console.log('👁️ Visualisation de l\'annonce:', ad.titre);
    window.open(`annonce-details.html?id=${adId}`, '_blank');
}

/**
 * Modifie une annonce
 * @param {number} adId - ID de l'annonce
 */
function editAnnonce(adId) {
    const ad = allAnnonces.find(a => a.id === adId);
    if (!ad) return;
    
    console.log('✏️ Modification de l\'annonce:', ad.titre);
    window.open(`publier-annonce.html?edit=${adId}`, '_blank');
}

/**
 * Supprime une annonce
 * @param {number} adId - ID de l'annonce
 */
function deleteAnnonce(adId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
        return;
    }
    
    try {
        const index = allAnnonces.findIndex(a => a.id === adId);
        if (index !== -1) {
            allAnnonces.splice(index, 1);
            localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
            
            displayAnnonces();
            updateBadges();
            showSuccess('Annonce supprimée avec succès');
            
            console.log('🗑️ Annonce supprimée:', adId);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showError('Erreur lors de la suppression de l\'annonce');
    }
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
            if (!user.name.toLowerCase().includes(search) && 
                !user.email.toLowerCase().includes(search)) return false;
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
    
    row.innerHTML = `
        <td>${user.id || 'N/A'}</td>
        <td><strong>${user.name}</strong></td>
        <td>${user.email}</td>
        <td>${user.phone || 'N/A'}</td>
        <td><span class="role-badge">${user.role}</span></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${formatDate(user.created_at)}</td>
        <td>
            <div class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="viewUser('${user.email}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editUser('${user.email}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.email}')">
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
    
    console.log('👁️ Visualisation de l\'utilisateur:', user.name);
    
    const details = `
        👤 ${user.name}
        
        📧 Email: ${user.email}
        📞 Téléphone: ${user.phone || 'Non spécifié'}
        🏷️ Rôle: ${user.role}
        📊 Statut: ${user.status || 'Actif'}
        📅 Inscription: ${formatDate(user.created_at)}
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
    
    console.log('✏️ Modification de l\'utilisateur:', user.name);
    
    // En production, ouvrir un modal de modification
    showInfo('Fonctionnalité de modification en cours de développement');
}

/**
 * Supprime un utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 */
function deleteUser(userEmail) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        return;
    }
    
    try {
        const index = allUsers.findIndex(u => u.email === userEmail);
        if (index !== -1) {
            allUsers.splice(index, 1);
            localStorage.setItem('local_users', JSON.stringify(allUsers));
            
            displayUsers();
            updateBadges();
            showSuccess('Utilisateur supprimé avec succès');
            
            console.log('🗑️ Utilisateur supprimé:', userEmail);
        }
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
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-sender">
                <strong>${msg.userName || 'Anonyme'}</strong>
                ${msg.userEmail ? `<span>(${msg.userEmail})</span>` : ''}
            </div>
            <div class="message-time">${formatRelativeTime(msg.timestamp)}</div>
        </div>
        <div class="message-content">
            <p><strong>Objet:</strong> ${msg.title || 'Demande de contact'}</p>
            <p>${msg.userMessage || 'Pas de message'}</p>
            ${msg.phone ? `<p><strong>Téléphone:</strong> ${msg.phone}</p>` : ''}
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
            'auto-approve-ads': document.getElementById('auto-approve-ads').checked,
            'max-ads-per-user': parseInt(document.getElementById('max-ads-per-user').value),
            'email-verification': document.getElementById('email-verification').checked,
            'auto-approve-users': document.getElementById('auto-approve-users').checked,
            'email-notifications': document.getElementById('email-notifications').checked,
            'admin-email': document.getElementById('admin-email').value
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
        status: document.getElementById('ad-status-filter').value,
        category: document.getElementById('ad-category-filter').value,
        search: document.getElementById('ad-search').value
    };
}

/**
 * Met à jour les filtres des utilisateurs
 */
function updateUserFilters() {
    currentFilters.users = {
        role: document.getElementById('user-role-filter').value,
        status: document.getElementById('user-status-filter').value,
        search: document.getElementById('user-search').value
    };
}

/**
 * Met à jour les filtres des messages
 */
function updateMessageFilters() {
    currentFilters.messages = {
        type: document.getElementById('message-type-filter').value,
        status: document.getElementById('message-status-filter').value
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
function updateDashboardStats() {
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
            exported_by: currentUser.name
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
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

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
    if (windowHelper) {
        windowHelper.showError(message);
    } else {
        alert('❌ ' + message);
    }
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

// Exporter les fonctions pour usage global
window.AdminManager = {
    showSection,
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
