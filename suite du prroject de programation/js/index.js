// File: index.js
// Description: Script principal pour la page d'accueil de Sénégal Élevage
// Gère l'interactivité de la page et l'intégration avec Supabase

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// Importation du client Supabase (à installer via CDN ou npm)
// Documentation Supabase : https://supabase.com/docs/reference/javascript

// Configuration de la connexion à la base de données
// Remplacer ces valeurs par vos propres clés d'API Supabase
const SUPABASE_URL = 'https://votre-projet.supabase.co'; // URL de votre projet Supabase
const SUPABASE_ANON_KEY = 'votre_cle_anon_public'; // Clé publique pour accès anonyme

// Variable globale pour le client Supabase
let supabase;

// Initialisation du client Supabase pour la connexion à la base de données PostgreSQL
// Note: Pour utiliser cette initialisation, inclure le script Supabase dans le HTML:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
try {
    // Vérifier si Supabase est disponible globalement
    if (typeof supabaseClient !== 'undefined') {
        // Initialiser avec la configuration de la base de données
        supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Connexion à la base de données Supabase établie');
    } else {
        console.warn('⚠️ Client Supabase non disponible. Mode déconnecté activé.');
    }
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
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
                mobileMenuBtn.querySelector('i').classList.remove('fa-times');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            });
        });
        
        console.log('Menu mobile configuré avec succès');
    }
}

/**
 * Met en évidence l'élément de navigation actif en fonction de l'URL courante
 */
function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Supprimer la classe active de tous les liens
        link.classList.remove('active');
        
        // Si l'URL correspond à la page actuelle, ajouter la classe active
        if (linkHref === currentPage || 
            (currentPage === '' && linkHref === 'index.html') ||
            (linkHref === '#' && currentPage.includes('index.html'))) {
            link.classList.add('active');
        }
    });
    
    console.log('Navigation active mise à jour');
}

// ============================================================================
// FONCTIONS SUPABASE - INTERACTIONS AVEC LA BASE DE DONNÉES
// ============================================================================

/**
 * Récupère les annonces récentes depuis la base de données Supabase
 * Cette fonction interroge la table 'annonces' de votre base de données PostgreSQL
 * @param {number} limit - Nombre maximum d'annonces à récupérer
 * @returns {Promise<Array>} Liste des annonces récentes depuis la base de données
 */
async function fetchRecentListings(limit = 3) {
    // Si la base de données n'est pas disponible, retourner des données par défaut
    if (!supabase) {
        console.log('📴 Mode hors ligne: utilisation des données par défaut');
        return getDefaultListings();
    }
    
    try {
        console.log(`🔍 Récupération des ${limit} annonces récentes depuis la base de données...`);
        
        // Requête à la base de données Supabase
        // La table 'annonces' doit exister dans votre base de données PostgreSQL
        const { data, error } = await supabase
            .from('annonces') // Nom de la table dans la base de données
            .select('*') // Sélectionner toutes les colonnes
            .eq('status', 'actif') // Filtrer par statut actif
            .order('created_at', { ascending: false }) // Trier par date de création (plus récent d'abord)
            .limit(limit); // Limiter le nombre de résultats
        
        if (error) {
            console.error('❌ Erreur lors de la récupération des annonces depuis la base de données:', error);
            return getDefaultListings(); // Retourner les données par défaut en cas d'erreur
        }
        
        console.log(`✅ ${data.length} annonces récupérées avec succès depuis la base de données`);
        return data;
        
    } catch (error) {
        console.error('❌ Exception lors de l\'accès à la base de données:', error);
        return getDefaultListings();
    }
}

/**
 * Données par défaut lorsque Supabase n'est pas disponible ou en cas d'erreur
 * @returns {Array} Liste d'annonces par défaut
 */
function getDefaultListings() {
    return [
        {
            id: 1,
            title: "matériaux destiner au animaux",
            description: "Abreuvoirs de haute qualité, faciles à installer et à entretenir. Parfaits pour les élevages modernes.",
            location: "Dakar",
            type: "Matériel",
            image_url: "materiel.jpg",
            status: "Actif"
        },
        {
            id: 2,
            title: "volaille de qualité",
            description: "Poules pondeuses saines et productives. Livraison possible dans toute la région.",
            location: "Kaolack",
            type: "Animal",
            image_url: "volaille.jpg",
            status: "Actif"
        },
        {
            id: 3,
            title: "viande de haute qualité",
            description: "Lait de qualité premium, collecté quotidiennement. Disponible en petites et grandes quantités.",
            location: "Saint-Louis",
            type: "Produit",
            image_url: "viande.jpg",
            status: "Actif"
        }
    ];
}

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
    if (listing.type === 'Matériel') icon = '🔧';
    if (listing.type === 'Animal') icon = '🐑';
    
    // Structure HTML de la carte
    card.innerHTML = `
        <div class="listing-content">
            <img src="${listing.image_url || 'placeholder.svg'}" 
                 alt="${listing.title}" 
                 class="listing-image"
                 onerror="this.src='placeholder.svg'">
            <div class="listing-title">${listing.title}</div>
            <div class="listing-description">${listing.description}</div>
            <div class="listing-meta">📍 ${listing.location}</div>
            <div class="listing-tags">
                <span class="tag tag-type">${listing.type}</span>
                <span class="tag tag-status">${listing.status}</span>
            </div>
        </div>
    `;
    
    // Ajouter un événement de clic pour rediriger vers la page de détails
    card.addEventListener('click', () => {
        // Vous pouvez rediriger vers une page de détails avec l'ID de l'annonce
        // window.location.href = `annonce-details.html?id=${listing.id}`;
        console.log(`Clic sur l'annonce: ${listing.title} (ID: ${listing.id})`);
    });
    
    return card;
}

/**
 * Récupère et affiche le nombre total d'annonces actives depuis la base de données
 * Cette fonction interroge la base de données pour obtenir des statistiques
 * Utile pour le tableau de bord et les métriques de l'application
 */
async function displayActiveListingsCount() {
    // Vérifier la connexion à la base de données
    if (!supabase) {
        console.log('⚠️ Base de données non disponible pour le comptage');
        return;
    }
    
    try {
        console.log('🔢 Comptage des annonces actives dans la base de données...');
        
        // Requête de comptage dans la base de données
        const { count, error } = await supabase
            .from('annonces') // Table cible dans la base de données
            .select('*', { count: 'exact', head: true }) // Comptage exact sans récupérer les données
            .eq('status', 'actif'); // Filtrer par statut actif
        
        if (!error && count > 0) {
            // Afficher le compteur dans l'élément dédié
            const counterElement = document.querySelector('.listings-counter');
            if (counterElement) {
                counterElement.textContent = `${count} annonces actives`;
            }
            console.log(`📊 ${count} annonces actives trouvées dans la base de données`);
        } else if (error) {
            console.error('❌ Erreur lors du comptage dans la base de données:', error);
        }
    } catch (error) {
        console.error('❌ Exception lors du comptage des annonces:', error);
    }
}

// ============================================================================
// GESTION DES ÉVÉNEMENTS ET DES FORMULAIRES
// ============================================================================

/**
 * Configure les événements pour les boutons d'action principaux
 */
function setupActionButtons() {
    // Bouton "Parcourir les annonces"
    const browseBtn = document.querySelector('.btn-primary');
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            // Vous pouvez ajouter un tracking ou une logique avant la redirection
            console.log('Navigation vers la page des annonces');
            // La redirection est déjà gérée par l'attribut href
        });
    }
    
    // Bouton "Créer une annonce"
    const createBtn = document.querySelector('.btn-outline');
    if (createBtn) {
        createBtn.addEventListener('click', (e) => {
            // Vérifier si l'utilisateur est connecté
            if (!isUserLoggedIn()) {
                e.preventDefault(); // Empêcher la redirection
                alert('Veuillez vous connecter pour créer une annonce');
                window.location.href = 'authentification.html';
            }
        });
    }
    
    console.log('Boutons d\'action configurés');
}

/**
 * Vérifie si l'utilisateur est connecté via Supabase Auth
 * @returns {boolean} True si l'utilisateur est authentifié dans la base de données
 */
function isUserLoggedIn() {
    // Vérifier l'authentification Supabase dans le localStorage
    const token = localStorage.getItem('supabase.auth.token');
    
    // Alternative: vérifier via le client Supabase si disponible
    if (supabase && supabase.auth) {
        const user = supabase.auth.getUser();
        return !!(user && user.id);
    }
    
    return !!token; // Retourne true si un token d'authentification existe
}

// ============================================================================
// INITIALISATION DE LA PAGE
// ============================================================================

/**
 * Initialise toutes les fonctionnalités de la page
 * Cette fonction est appelée quand le DOM est complètement chargé
 * Configure l'interface et récupère les données depuis la base de données
 */
async function initializePage() {
    console.log('🚀 Initialisation de la page d\'accueil...');
    
    // 1. Configuration de l'interface utilisateur
    setupMobileMenu();
    highlightActiveNavLink();
    setupActionButtons();
    
    // 2. Récupération des données depuis la base de données Supabase
    try {
        console.log('📡 Connexion à la base de données pour récupérer les annonces...');
        const recentListings = await fetchRecentListings(3);
        updateListingCards(recentListings);
        
        // Récupérer d'autres données si nécessaire (statistiques, etc.)
        // await displayActiveListingsCount();
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des données depuis la base de données:', error);
    }
    
    // 3. Configuration du lecteur vidéo
    setupVideoPlayer();
    
    console.log('✅ Page d\'accueil initialisée avec succès');
}

/**
 * Configure le lecteur vidéo pour une meilleure compatibilité
 */
function setupVideoPlayer() {
    const video = document.querySelector('video');
    if (video) {
        // Redémarrer la vidéo si elle rencontre des erreurs
        video.addEventListener('error', () => {
            console.warn('Erreur de lecture vidéo, tentative de rechargement...');
            video.load();
        });
        
        // Ajuster les contrôles pour mobile
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
    }
}

// ============================================================================
// ÉVÉNEMENTS ET EXÉCUTION
// ============================================================================

// Attendre que le DOM soit complètement chargé
document.addEventListener('DOMContentLoaded', initializePage);

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    // Fermer le menu mobile lors du redimensionnement sur desktop
    const navLinks = document.querySelector('.nav-links');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth > 768 && navLinks && mobileMenuBtn) {
        navLinks.classList.remove('active');
        mobileMenuBtn.querySelector('i').classList.remove('fa-times');
        mobileMenuBtn.querySelector('i').classList.add('fa-bars');
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
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Styles de base pour la notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Couleurs selon le type
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    
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

// Ajouter les animations CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Exposer certaines fonctions globalement pour un accès externe
// Ces fonctions peuvent être appelées depuis d'autres scripts ou la console
window.SenegalElevage = {
    refreshListings: fetchRecentListings, // Pour rafraîchir les annonces depuis la base de données
    showNotification: showNotification, // Pour afficher des notifications
    isLoggedIn: isUserLoggedIn, // Pour vérifier l'état de connexion
    databaseStatus: () => supabase ? 'connecté' : 'hors ligne' // État de la base de données
};

console.log('✅ Script index.js chargé - Prêt pour la base de données');

/*
1: Installation de Supabase :
    <!-- Ajouter dans votre HTML, avant votre script -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

2:Configuration de Supabase :
Remplacez SUPABASE_URL et SUPABASE_ANON_KEY par vos clés réelles
Créez une table "annonces" dans Supabase avec les colonnes appropriées

3:Structure de la table "annonces" recommandée :
CREATE TABLE annonces (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  type VARCHAR(50),
  image_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

4:Fonctionnalités principales :

Menu responsive mobile

Récupération des annonces depuis Supabase

Affichage des cartes d'annonces dynamiques

Système de notifications

Gestion de l'état de connexion

5:Mode hors ligne :

Le script inclut des données par défaut si Supabase n'est pas disponible

Gestion élégante des erreurs de connexion

Ce script est modulaire et bien commenté pour faciliter la maintenance et l'ajout de nouvelles fonctionnalités.


*/
