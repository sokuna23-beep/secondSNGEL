/**
 * Fichier: materiel.js
 * Description: Script pour la page du matériel d'élevage
 * Gestion de l'affichage, du filtrage et de la recherche des équipements
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion des produits
let allProducts = [];
let filteredProducts = [];
let currentCategory = 'all';
let searchTerm = '';

// Configuration des catégories de matériel
const CATEGORIES = {
    all: 'Tous les équipements',
    bovin: 'Équipement bovin',
    ovin: 'Équipement ovin/caprin',
    avicole: 'Équipement avicole',
    veterinaire: 'Matériel vétérinaire',
    alimentation: 'Alimentation',
    cloture: 'Clôtures et enclos'
};

// Configuration des icônes par catégorie
const CATEGORY_ICONS = {
    bovin: '🐄',
    ovin: '🐑',
    avicole: '🐔',
    veterinaire: '💉',
    alimentation: '🌾',
    cloture: '🚧'
};

// ============================================================================
// DONNÉES DES PRODUITS (Base de données locale)
// ============================================================================

/**
 * Retourne les données des produits disponibles
 * @returns {Array} Liste des produits
 */
function getProductsData() {
    return [
        // Équipement bovin
        {
            id: 1,
            name: 'Abreuvoir automatique pour bovins',
            category: 'bovin',
            price: 45000,
            currency: 'XOF',
            description: 'Abreuvoir automatique de 200L avec flotteur, idéal pour 10-15 têtes de bétail. Construction en inox résistant.',
            image: 'assets/images/abreuvoir_automatique.jpg',
            stock: 15,
            rating: 4.5,
            reviews: 23,
            vendor: 'ÉquipPro Sénégal',
            location: 'Dakar',
            delivery: true,
            featured: true
        },
        {
            id: 2,
            name: 'Mangeoire double pour bovin',
            category: 'bovin',
            price: 32000,
            currency: 'XOF',
            description: 'Mangeoire en acier galvanisé pour 2 animaux, avec protection anti-gaspillage.',
            image: 'assets/images/mangeoir_pour_bovin.jpg',
            stock: 8,
            rating: 4.2,
            reviews: 18,
            vendor: 'Bétail Plus',
            location: 'Thiès',
            delivery: true,
            featured: false
        },

        // Équipement ovin/caprin
        {
            id: 3,
            name: 'Abreuvoir portable pour petits ruminants',
            category: 'ovin',
            price: 15000,
            currency: 'XOF',
            description: 'Abreuvoir léger de 50L, facile à déplacer, adapté pour moutons et chèvres.',
            image: 'assets/images/abreuvoir_avec_pipette.jpg',
            stock: 25,
            rating: 4.7,
            reviews: 31,
            vendor: 'Petit Élevage Pro',
            location: 'Kaolack',
            delivery: true,
            featured: true
        },

        // Équipement avicole
        {
            id: 4,
            name: 'Mangeoire automatique pour volailles',
            category: 'avicole',
            price: 12000,
            currency: 'XOF',
            description: 'Mangeoire avec distribution automatique, capacité 5kg, pour 20-30 poules.',
            image: 'assets/images/Poules pondeuses.jpg',
            stock: 40,
            rating: 4.3,
            reviews: 27,
            vendor: 'Avicole Expert',
            location: 'Saint-Louis',
            delivery: false,
            featured: false
        },
        {
            id: 5,
            name: 'Abreuvoir à pipettes pour poules',
            category: 'avicole',
            price: 8000,
            currency: 'XOF',
            description: 'Système de 10 pipettes avec réservoir de 20L, eau toujours propre.',
            image: 'assets/images/abreuvoir_avec_pipette.jpg',
            stock: 60,
            rating: 4.6,
            reviews: 45,
            vendor: 'Volaille Pro',
            location: 'Dakar',
            delivery: true,
            featured: true
        },

        // Matériel vétérinaire
        {
            id: 6,
            name: 'Kit de vaccination complet',
            category: 'veterinaire',
            price: 25000,
            currency: 'XOF',
            description: 'Kit complet avec seringues, aiguilles, stérilisateur et boîte de transport.',
            image: 'assets/images/Services vétérinaires mobile.jpg',
            stock: 12,
            rating: 4.8,
            reviews: 19,
            vendor: 'Veto Supply',
            location: 'Dakar',
            delivery: true,
            featured: false
        },

        // Alimentation
        {
            id: 7,
            name: 'Concentré pour bétail premium',
            category: 'alimentation',
            price: 15000,
            currency: 'XOF',
            description: 'Sac de 50kg de concentré de haute qualité, enrichi en vitamines et minéraux.',
            image: 'assets/images/Aliments concentrés pour bétail.jpg',
            stock: 100,
            rating: 4.4,
            reviews: 56,
            vendor: 'NutriBétail',
            location: 'Kaolack',
            delivery: true,
            featured: true
        },

        // Clôtures
        {
            id: 8,
            name: 'Kit de clôture électrique',
            category: 'cloture',
            price: 85000,
            currency: 'XOF',
            description: 'Kit complet pour 100m de clôture électrique avec energizer et accessoires.',
            image: 'assets/images/cloture.jpg',
            stock: 5,
            rating: 4.1,
            reviews: 12,
            vendor: 'Clôture Pro',
            location: 'Thiès',
            delivery: true,
            featured: false
        }
    ];
}

// ============================================================================
// FONCTIONS D'AFFICHAGE
// ============================================================================

/**
 * Initialise la page des produits
 */
function initializeProductsPage() {
    console.log('🚀 Initialisation de la page matériel...');

    try {
        // 1. Charger les données des produits
        allProducts = getProductsData();
        filteredProducts = [...allProducts];

        // 2. Configurer les événements
        setupFilterEvents();
        setupSearchEvents();
        setupModalEvents();

        // 3. Afficher les produits initiaux
        displayProducts();

        // 4. Mettre à jour les statistiques
        updateStatistics();

        console.log(`✅ Page matériel initialisée avec ${allProducts.length} produits`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement des produits');
    }
}

/**
 * Affiche les produits dans la grille
 */
function displayProducts() {
    const container = document.getElementById('products-container');
    if (!container) {
        console.warn('⚠️ Conteneur des produits non trouvé');
        return;
    }

    // Vider le conteneur
    container.innerHTML = '';

    // Afficher un message si aucun produit
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos filtres ou votre recherche</p>
            </div>
        `;
        return;
    }

    // Créer et afficher chaque produit
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });

    console.log(`📋 Affichage de ${filteredProducts.length} produits`);
}

/**
 * Crée une carte de produit HTML
 * @param {Object} product - Données du produit
 * @returns {HTMLElement} Carte du produit
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    // Ajouter la classe "featured" si c'est un produit vedette
    if (product.featured) {
        card.classList.add('featured');
    }

    // Générer les étoiles de notation
    const stars = generateStarRating(product.rating);

    // Formater le prix
    const formattedPrice = `${product.price.toLocaleString()} ${product.currency}`;

    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.image}" alt="${product.name}" class="product-image" 
                 onerror="this.src='placeholder.jpg'">
            ${product.featured ? '<span class="featured-badge">⭐ Vedette</span>' : ''}
            ${product.stock < 10 ? '<span class="low-stock-badge">Stock limité</span>' : ''}
        </div>
        
        <div class="product-info">
            <div class="product-category">
                ${CATEGORY_ICONS[product.category]} ${CATEGORIES[product.category]}
            </div>
            
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${truncateText(product.description, 100)}</p>
            
            <div class="product-rating">
                <div class="stars">${stars}</div>
                <span class="rating-text">${product.rating} (${product.reviews} avis)</span>
            </div>
            
            <div class="product-meta">
                <div class="product-price">${formattedPrice}</div>
                <div class="product-stock">Stock: ${product.stock}</div>
            </div>
            
            <div class="product-vendor">
                <i class="fas fa-store"></i> ${product.vendor} - ${product.location}
            </div>
            
            <div class="product-actions">
                <button class="btn btn-primary contact-btn" data-product-id="${product.id}">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn btn-outline details-btn" data-product-id="${product.id}">
                    <i class="fas fa-info-circle"></i> Détails
                </button>
            </div>
            
            ${product.delivery ? '<div class="delivery-info"><i class="fas fa-truck"></i> Livraison disponible</div>' : ''}
        </div>
    `;

    // Ajouter les événements aux boutons
    const contactBtn = card.querySelector('.contact-btn');
    const detailsBtn = card.querySelector('.details-btn');

    contactBtn.addEventListener('click', () => openContactModal(product));
    detailsBtn.addEventListener('click', () => showProductDetails(product));

    return card;
}

/**
 * Génère les étoiles de notation HTML
 * @param {number} rating - Note du produit
 * @returns {string} HTML des étoiles
 */
function generateStarRating(rating) {
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
 * Tronque un texte à une longueur spécifique
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ============================================================================
// GESTION DE LA RESPONSIVITÉ ET DES IMAGES
// ============================================================================

/**
 * Gère le redimensionnement dynamique des images avec tailles uniformes
 */
/**
 * Gère le redimensionnement dynamique des images avec tailles uniformes
 * @deprecated Cette fonction est maintenant gérée par CSS
 */
function handleImageResize() {
    // La gestion de la taille des images est maintenant faite en CSS
    // pour assurer une meilleure performance et éviter les sauts de mise en page
    console.log('📏 Gestion des images déléguée au CSS');
}

/**
 * Optimise le chargement des images avec lazy loading
 */
function setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

/**
 * Gère les erreurs de chargement d'images
 */
function handleImageErrors() {
    const images = document.querySelectorAll('.listing-image, .product-image');

    images.forEach(img => {
        img.addEventListener('error', function () {
            // Remplacer par une image placeholder ou une icône
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTI5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4=';
            this.alt = 'Image non disponible';
        });
    });
}

/**
 * Force des hauteurs uniformes pour toutes les cartes
 */
/**
 * Force des hauteurs uniformes pour toutes les cartes
 * @deprecated Cette fonction est maintenant gérée par CSS
 */
function enforceUniformCardHeights() {
    // La gestion des hauteurs est maintenant faite via Flexbox en CSS
    console.log('📏 Hauteurs uniformes gérées par CSS');
}

/**
 * Adapte la grille de produits en fonction de la taille d'écran
 */
/**
 * Adapte la grille de produits en fonction de la taille d'écran
 * @deprecated Cette fonction est maintenant gérée par CSS Grid
 */
function adjustProductGrid() {
    // Géré par CSS Grid
}

/**
 * Adapte la grille des cartes featured material
 * @deprecated Cette fonction est maintenant gérée par CSS Grid
 */
function adjustFeaturedCards() {
    // Géré par CSS Grid
}

/**
 * Initialise tous les ajustements responsives
 */
/**
 * Initialise tous les ajustements responsives
 */
function initializeResponsiveFeatures() {
    // Seulement Lazy Loading et gestion des erreurs
    setupLazyLoading();
    handleImageErrors();

    console.log('📱 Fonctionnalités responsives initialisées (CSS Grid)');
}

/**
 * Optimise les performances des images
 */
function optimizeImagePerformance() {
    const images = document.querySelectorAll('.listing-image, .product-image');

    images.forEach(img => {
        // Ajouter loading="lazy" pour les images
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }

        // Optimiser les tailles d'image
        img.style.width = '100%';
        img.style.height = 'auto';

        // Ajouter des transitions fluides
        img.style.transition = 'transform 0.3s ease, filter 0.3s ease';
    });
}

// ============================================================================
// FONCTIONS DE FILTRAGE ET RECHERCHE
// ============================================================================

/**
 * Configure les événements de filtrage
 */
function setupFilterEvents() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');

            // Mettre à jour la catégorie courante
            currentCategory = button.dataset.category;

            // Appliquer le filtre
            applyFilters();
        });
    });

    console.log('✅ Événements de filtrage configurés');
}

/**
 * Configure les événements de recherche
 */
function setupSearchEvents() {
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
        // Recherche en temps réel
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            applyFilters();
        });

        // Recherche au submit (pour compatibilité)
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchTerm = e.target.value.toLowerCase();
                applyFilters();
            }
        });
    }

    console.log('✅ Événements de recherche configurés');
}

/**
 * Applique les filtres de catégorie et de recherche
 */
function applyFilters() {
    console.log(`🔍 Application des filtres - Catégorie: ${currentCategory}, Recherche: "${searchTerm}"`);

    // Filtrer par catégorie
    filteredProducts = allProducts.filter(product => {
        const categoryMatch = currentCategory === 'all' || product.category === currentCategory;

        // Filtrer par recherche
        const searchMatch = searchTerm === '' ||
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.vendor.toLowerCase().includes(searchTerm) ||
            product.location.toLowerCase().includes(searchTerm);

        return categoryMatch && searchMatch;
    });

    // Afficher les produits filtrés
    displayProducts();

    // Mettre à jour les statistiques
    updateStatistics();

    console.log(`📊 Filtres appliqués: ${filteredProducts.length}/${allProducts.length} produits affichés`);
}

/**
 * Met à jour les statistiques de la page
 */
function updateStatistics() {
    const statsElements = document.querySelectorAll('.stat-number');

    if (statsElements.length >= 3) {
        statsElements[0].textContent = `${allProducts.length}+`; // Équipements
        statsElements[1].textContent = `${new Set(allProducts.map(p => p.vendor)).size}+`; // Fournisseurs
        statsElements[2].textContent = `${new Set(allProducts.map(p => p.location)).size}`; // Régions
    }
}

// ============================================================================
// FONCTIONS DU MODAL DE CONTACT
// ============================================================================

/**
 * Configure les événements du modal
 */
function setupModalEvents() {
    const modal = document.getElementById('contact-modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    // Fermer le modal avec les boutons de fermeture
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal();
        });
    });

    // Fermer le modal en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Fermer avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Soumission du formulaire de contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    console.log('✅ Événements du modal configurés');
}

/**
 * Ouvre WhatsApp pour contacter le vendeur d'un produit
 * @param {Object} product - Produit concerné
 */
function openContactModal(product) {
    const phone = product.phone || product.telephone || '221770000000';
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone;

    const message = encodeURIComponent(
        `Bonjour, je suis intéressé(e) par "${product.name}" à ${product.price.toLocaleString()} ${product.currency} sur Sénégal Élevage. Est-ce toujours disponible ?`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    console.log(`📱 WhatsApp ouvert pour: ${product.name}`);
}

/**
 * Ferme le modal de contact
 */
function closeModal() {
    const modal = document.getElementById('contact-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';

    // Réinitialiser le formulaire
    const form = document.getElementById('contact-form');
    if (form) {
        form.reset();
    }

    console.log('📞 Modal de contact fermé');
}

/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - Événement de soumission
 */
function handleContactSubmit(e) {
    e.preventDefault();

    const modal = document.getElementById('contact-modal');
    const productId = modal.dataset.productId;

    // Récupérer les données du formulaire
    const formData = {
        productId: productId,
        userName: document.getElementById('user-name').value,
        userPhone: document.getElementById('user-phone').value,
        userRegion: document.getElementById('user-region').value,
        messageType: document.getElementById('message-type').value,
        userMessage: document.getElementById('user-message').value,
        timestamp: new Date().toISOString()
    };

    console.log('📝 Données de contact:', formData);

    // Simuler l'envoi (à remplacer par un vrai appel API)
    showNotification('📧 Demande envoyée avec succès ! Le vendeur vous contactera rapidement.');

    // Sauvegarder localement pour suivi
    saveContactRequest(formData);

    // Fermer le modal
    closeModal();
}

/**
 * Sauvegarde une demande de contact localement
 * @param {Object} requestData - Données de la demande
 */
function saveContactRequest(requestData) {
    try {
        const requests = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        requests.unshift(requestData);

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
 * Affiche les détails d'un produit (version simplifiée)
 * @param {Object} product - Produit à afficher
 */
function showProductDetails(product) {
    console.log(`📋 Affichage des détails pour: ${product.name}`);

    // Créer un message d'information
    const details = `
        📋 ${product.name}
        
        📝 Description: ${product.description}
        
        💰 Prix: ${product.price.toLocaleString()} ${product.currency}
        
        📦 Stock: ${product.stock} unités
        
        ⭐ Note: ${product.rating}/5 (${product.reviews} avis)
        
        🏪 Vendeur: ${product.vendor}
        
        📍 Localisation: ${product.location}
        
        🚚 Livraison: ${product.delivery ? 'Disponible' : 'Non disponible'}
    `;

    alert(details);
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
// EXPORT ET UTILITAIRES
// ============================================================================

// Exporter les fonctions pour usage global
window.MaterielManager = {
    getProducts: () => [...allProducts],
    getFilteredProducts: () => [...filteredProducts],
    getCurrentCategory: () => currentCategory,
    getSearchTerm: () => searchTerm,
    refreshProducts: displayProducts,
    exportContactRequests: () => JSON.parse(localStorage.getItem('contact_requests') || '[]'),
    handleImageResize: handleImageResize,
    adjustProductGrid: adjustProductGrid,
    adjustFeaturedCards: adjustFeaturedCards,
    optimizeImagePerformance: optimizeImagePerformance
};

// ============================================================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================================================

/**
 * Initialise la page des produits avec toutes les fonctionnalités
 */
function initializeProductsPage() {
    console.log('🚀 Initialisation de la page matériel...');

    try {
        // Charger les données
        allProducts = getProductsData();
        filteredProducts = [...allProducts];

        // Afficher les produits
        displayProducts();

        // Configurer les événements
        setupFilterEvents();
        setupSearchEvents();
        setupModalEvents();

        // Initialiser les fonctionnalités responsives
        initializeResponsiveFeatures();
        optimizeImagePerformance();

        // Forcer les hauteurs uniformes après le chargement
        setTimeout(() => {
            enforceUniformCardHeights();
        }, 100);

        console.log('✅ Page matériel initialisée avec succès');
        console.log(`📦 ${allProducts.length} produits chargés`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Une erreur est survenue lors du chargement de la page');
    }
}

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeProductsPage);

console.log('✅ Script materiel.js chargé - Prêt pour la page matériel');
