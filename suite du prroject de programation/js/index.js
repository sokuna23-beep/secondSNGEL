// File: index.js
// Description: Script principal pour la page d'accueil de Sénégal Élevage
// Gère l'interactivité de la page et l'intégration avec Supabase

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Remplacement des placeholders par les vraies valeurs Supabase
// Configuration de la connexion à la base de données
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co'; // URL de votre projet Supabase (CORRIGÉE)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag'; // Clé publique pour accès anonyme (CORRIGÉE)

// Variable globale pour le client Supabase
let supabase = null;
let isUsingSupabase = false;

// Initialisation du client Supabase pour la connexion à la base de données PostgreSQL
// MODIFICATION 2: Initialisation plus robuste du client Supabase
try {
    // Vérifier si Supabase est disponible globalement
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        supabase = supabaseClient;
        isUsingSupabase = true;
        console.log('✅ Connexion à la base de données Supabase établie via client centralisé');
    } else if (typeof window.supabase !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isUsingSupabase = true;
        console.log('✅ Connexion à la base de données Supabase établie via création directe');
    } else {
        console.warn('⚠️ Client Supabase non disponible. Mode déconnecté activé.');
        console.warn('⚠️ Assurez-vous d\'inclure: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
    }
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
}

// MODIFICATION 3: Fonction pour vérifier l'état de la connexion
function isSupabaseAvailable() {
    return supabase !== null && isUsingSupabase;
}

// ============================================================================
// FONCTIONS POUR LA NAVIGATION ET L'INTERFACE
// ============================================================================

/**
 * Gère le menu responsive pour les appareils mobiles
 * Affiche/masque le menu de navigation sur clic du bouton hamburger
 */
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            // Basculer la classe 'active' pour afficher/masquer le menu
            navLinks.classList.toggle('active');
            
            // Changer l'icône du bouton
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Fermer le menu mobile lors du clic sur un lien
        const navAnchors = navLinks.querySelectorAll('a');
        navAnchors.forEach(anchor => {
            anchor.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
        
        console.log('Menu mobile configuré avec succès');
    }
}

/**
 * Met en évidence l'élément de navigation actif en fonction de l'URL courante
 */
function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Supprimer la classe active de tous les liens
        link.classList.remove('active');
        
        // Si l'URL correspond à la page actuelle, ajouter la classe active
        if (linkHref === currentPage || 
            (currentPage === 'index.html' && linkHref === 'index.html') ||
            (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    console.log('Navigation active mise à jour');
}

// ============================================================================
// FONCTIONS SUPABASE - INTERACTIONS AVEC LA BASE DE DONNÉES
// ============================================================================

// MODIFICATION 4: Amélioration de fetchRecentListings avec transformation des données
/**
 * Récupère les annonces récentes depuis la base de données Supabase
 * Cette fonction interroge la table 'annonces' de votre base de données PostgreSQL
 * @param {number} limit - Nombre maximum d'annonces à récupérer
 * @returns {Promise<Array>} Liste des annonces récentes depuis la base de données
 */
async function fetchRecentListings(limit = 3) {
    // Si la base de données n'est pas disponible, retourner des données par défaut
    if (!isSupabaseAvailable()) {
        console.log('📴 Mode hors ligne: utilisation des données par défaut');
        return getDefaultListings();
    }
    
    try {
        console.log(`🔍 Récupération des ${limit} annonces récentes depuis la base de données...`);
        
        // Requête à la base de données Supabase
        const { data, error } = await supabase
            .from('annonces')
            .select('*')
            .eq('status', 'actif')
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('❌ Erreur lors de la récupération des annonces:', error);
            return getDefaultListings();
        }
        
        // MODIFICATION 5: Transformation des données pour compatibilité
        const transformedData = data.map(annonce => ({
            id: annonce.id,
            title: annonce.titre || annonce.title,
            description: annonce.description || '',
            location: annonce.localisation || annonce.location || 'Sénégal',
            type: annonce.categorie || annonce.type || 'Autre',
            image_url: annonce.image_principale || annonce.main_image || annonce.image_url || 'placeholder.svg',
            status: annonce.status || 'actif',
            price: annonce.prix,
            views: annonce.views || 0,
            created_at: annonce.created_at
        }));
        
        console.log(`✅ ${transformedData.length} annonces récupérées avec succès depuis la base de données`);
        return transformedData;
        
    } catch (error) {
        console.error('❌ Exception lors de l\'accès à la base de données:', error);
        return getDefaultListings();
    }
}

// MODIFICATION 6: Mise à jour des données par défaut avec des images réelles
/**
 * Données par défaut lorsque Supabase n'est pas disponible ou en cas d'erreur
 * @returns {Array} Liste d'annonces par défaut
 */
function getDefaultListings() {
    return [
        {
            id: 1,
            title: "Abreuvoirs automatiques pour bétail",
            description: "Abreuvoirs de haute qualité, faciles à installer et à entretenir. Parfaits pour les élevages modernes.",
            location: "Dakar",
            type: "Matériel",
            image_url: "assets/images/abreuvoir.jpg",
            status: "actif",
            price: 25000
        },
        {
            id: 2,
            title: "Poules pondeuses de race",
            description: "Poules pondeuses saines et productives, race locale adaptée au climat sénégalais.",
            location: "Kaolack",
            type: "Animal",
            image_url: "assets/images/Poules pondeuses.jpg",
            status: "actif",
            price: 3500
        },
        {
            id: 3,
            title: "Lait fermier biologique",
            description: "Lait de qualité premium, collecté quotidiennement auprès d'éleveurs locaux.",
            location: "Saint-Louis",
            type: "Produit",
            image_url: "assets/images/Lait fermier biologique.jpg",
            status: "actif",
            price: 500
        }
    ];
}

// MODIFICATION 7: Amélioration de l'affichage des cartes avec plus d'informations
/**
 * Met à jour les cartes d'annonces avec les données récupérées
 * @param {Array} listings - Liste des annonces à afficher
 */
function updateListingCards(listings) {
    const container = document.querySelector('.listing-cards-container');
    if (!container) {
        console.warn('Conteneur des cartes d\'annonces non trouvé');
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Créer et ajouter chaque carte d'annonce
    listings.forEach(listing => {
        const card = createListingCard(listing);
        container.appendChild(card);
    });
    
    console.log(`${listings.length} cartes d'annonces mises à jour`);
}

// MODIFICATION 8: Amélioration de la carte d'annonce avec plus de détails
/**
 * Crée une carte d'annonce HTML à partir des données
 * @param {Object} listing - Données de l'annonce
 * @returns {HTMLElement} Élément HTML de la carte
 */
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    
    // Déterminer l'icône en fonction du type d'annonce
    let icon = '📦';
    if (listing.type === 'Matériel' || listing.type === 'materiaux' || listing.type === 'materiel') icon = '🔧';
    if (listing.type === 'Animal' || listing.type === 'animaux') icon = '🐑';
    if (listing.type === 'Produit' || listing.type === 'produits') icon = '🥛';
    
    // Gérer l'image par défaut
    const imageUrl = listing.image_url && listing.image_url !== 'undefined' ? 
        listing.image_url : 'assets/images/placeholder.svg';
    
    // Afficher le prix s'il existe
    const priceHtml = listing.price ? 
        `<div class="listing-price">${listing.price.toLocaleString()} XOF</div>` : '';
    
    card.innerHTML = `
        <div class="listing-content">
            <img src="${imageUrl}" 
                 alt="${listing.title}" 
                 class="listing-image"
                 loading="lazy"
                 onerror="this.src='assets/images/placeholder.svg'">
            <div class="listing-title">${icon} ${listing.title}</div>
            <div class="listing-description">${listing.description.substring(0, 80)}${listing.description.length > 80 ? '...' : ''}</div>
            ${priceHtml}
            <div class="listing-meta">📍 ${listing.location}</div>
            <div class="listing-tags">
                <span class="tag tag-type">${listing.type}</span>
                <span class="tag tag-status ${listing.status === 'actif' ? 'status-active' : 'status-inactive'}">
                    ${listing.status === 'actif' ? 'Disponible' : listing.status}
                </span>
            </div>
        </div>
    `;
    
    // Ajouter un événement de clic pour rediriger vers la page de détails
    card.addEventListener('click', () => {
        console.log(`🔗 Clic sur l'annonce: ${listing.title} (ID: ${listing.id})`);
        window.location.href = `annonce-details.html?id=${listing.id}`;
    });
    
    return card;
}

// MODIFICATION 9: Amélioration de la fonction de comptage
/**
 * Récupère et affiche le nombre total d'annonces actives depuis la base de données
 */
async function displayActiveListingsCount() {
    if (!isSupabaseAvailable()) {
        console.log('⚠️ Base de données non disponible pour le comptage');
        return;
    }
    
    try {
        console.log('🔢 Comptage des annonces actives dans la base de données...');
        
        const { count, error } = await supabase
            .from('annonces')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'actif');
        
        if (!error && count > 0) {
            const counterElement = document.querySelector('.listings-counter');
            if (counterElement) {
                counterElement.textContent = `${count} annonces actives`;
            }
            console.log(`📊 ${count} annonces actives trouvées dans la base de données`);
        } else if (error) {
            console.error('❌ Erreur lors du comptage:', error);
        }
    } catch (error) {
        console.error('❌ Exception lors du comptage des annonces:', error);
    }
}

// ============================================================================
// GESTION DES ÉVÉNEMENTS ET DES FORMULAIRES
// ============================================================================

// MODIFICATION 10: Amélioration de la vérification de connexion
/**
 * Configure les événements pour les boutons d'action principaux
 */
function setupActionButtons() {
    // Bouton "Parcourir les annonces"
    const browseBtn = document.querySelector('.btn-primary');
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            console.log('Navigation vers la page des annonces');
            // La redirection est déjà gérée par l'attribut href
        });
    }
    
    // Bouton "Créer une annonce"
    const createBtn = document.querySelector('.btn-outline');
    if (createBtn) {
        createBtn.addEventListener('click', async (e) => {
            // Vérifier si l'utilisateur est connecté
            const isLoggedIn = await isUserLoggedIn();
            if (!isLoggedIn) {
                e.preventDefault();
                showNotification('Veuillez vous connecter pour créer une annonce', 'warning');
                setTimeout(() => {
                    window.location.href = 'authentification.html';
                }, 1500);
            }
        });
    }
    
    console.log('Boutons d\'action configurés');
}

/**
 * Vérifie si l'utilisateur est connecté via Supabase Auth
 * @returns {Promise<boolean>} True si l'utilisateur est authentifié
 */
async function isUserLoggedIn() {
    // Vérifier via le client Supabase si disponible
    if (isSupabaseAvailable() && supabase.auth) {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!error && session) {
                return true;
            }
        } catch (error) {
            console.warn('Erreur lors de la vérification de session:', error);
        }
    }
    
    // Fallback: vérifier dans localStorage
    const session = localStorage.getItem('user_session');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 heures
            return sessionAge < maxAge;
        } catch (e) {
            return false;
        }
    }
    
    return false;
}

// ============================================================================
// INITIALISATION DE LA PAGE
// ============================================================================

// MODIFICATION 11: Initialisation asynchrone complète
/**
 * Initialise toutes les fonctionnalités de la page
 * Cette fonction est appelée quand le DOM est complètement chargé
 * Configure l'interface et récupère les données depuis la base de données
 */
async function initializePage() {
    console.log('🚀 Initialisation de la page d\'accueil...');
    console.log(`📡 Statut Supabase: ${isSupabaseAvailable() ? 'Connecté' : 'Hors ligne'}`);
    
    // Afficher un indicateur de chargement
    showLoadingIndicator();
    
    // 1. Configuration de l'interface utilisateur
    setupMobileMenu();
    highlightActiveNavLink();
    setupActionButtons();
    
    // 2. Récupération des données depuis la base de données Supabase
    try {
        console.log('📡 Connexion à la base de données pour récupérer les annonces...');
        const recentListings = await fetchRecentListings(3);
        updateListingCards(recentListings);
        
        // Récupérer le compteur d'annonces si l'élément existe
        if (document.querySelector('.listings-counter')) {
            await displayActiveListingsCount();
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des données:', error);
        showNotification('Erreur de chargement des annonces. Mode hors ligne activé.', 'warning');
    }
    
    // 3. Configuration du lecteur vidéo
    setupVideoPlayer();
    
    // Cacher l'indicateur de chargement
    hideLoadingIndicator();
    
    // Afficher un message de bienvenue si connecté
    if (await isUserLoggedIn()) {
        console.log('👋 Utilisateur connecté détecté');
    }
    
    console.log('✅ Page d\'accueil initialisée avec succès');
}

/**
 * Affiche un indicateur de chargement
 */
function showLoadingIndicator() {
    const container = document.querySelector('.listing-cards-container');
    if (container && container.children.length === 0) {
        container.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #006837;"></i>
                <p>Chargement des annonces...</p>
            </div>
        `;
    }
}

/**
 * Cache l'indicateur de chargement
 */
function hideLoadingIndicator() {
    // L'indicateur sera remplacé par le contenu réel
}

/**
 * Configure le lecteur vidéo pour une meilleure compatibilité
 */
function setupVideoPlayer() {
    const video = document.querySelector('video');
    if (video) {
        video.addEventListener('error', () => {
            console.warn('Erreur de lecture vidéo, tentative de rechargement...');
            video.load();
        });
        
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        console.log('✅ Lecteur vidéo configuré');
    }
}

// ============================================================================
// ÉVÉNEMENTS ET EXÉCUTION
// ============================================================================

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', initializePage);

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth > 768 && navLinks && mobileMenuBtn) {
        navLinks.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});

// ============================================================================
// FONCTIONS UTILITAIRES GLOBALES
// ============================================================================

/**
 * Affiche une notification à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de notification (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotif = document.querySelector('.notification-global');
    if (existingNotif) existingNotif.remove();
    
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification-global notification-${type}`;
    notification.textContent = message;
    
    // Styles de base pour la notification
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background-color: ${colors[type] || colors.info};
        color: white;
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 14px;
        max-width: 350px;
    `;
    
    // Ajouter au body
    document.body.appendChild(notification);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Ajouter les animations CSS pour les notifications si pas déjà présentes
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .status-active { background-color: #4caf50; color: white; }
        .status-inactive { background-color: #ff9800; color: white; }
        .listing-price { 
            font-size: 18px; 
            font-weight: bold; 
            color: #006837; 
            margin: 8px 0;
        }
    `;
    document.head.appendChild(style);
}

// Exposer certaines fonctions globalement pour un accès externe
window.SenegalElevage = {
    refreshListings: fetchRecentListings,
    showNotification: showNotification,
    isLoggedIn: isUserLoggedIn,
    databaseStatus: () => isSupabaseAvailable() ? 'connecté' : 'hors ligne'
};

console.log('✅ Script index.js chargé - Prêt pour la base de données');
console.log(`🔗 Connexion Supabase configurée avec l'URL: ${SUPABASE_URL}`);