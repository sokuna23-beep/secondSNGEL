/**
 * Fichier: materiel.js
 * Description: Script pour la page du matériel d'élevage
 * Gestion de l'affichage, du filtrage et de la recherche des équipements
 * Version: 2.0.0
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

// MODIFICATION 3: Mapping des catégories pour compatibilité Supabase
const CATEGORY_MAPPING = {
    'bovin': 'bovins',
    'ovin': 'ovins',
    'avicole': 'avicole',
    'veterinaire': 'veterinaire',
    'alimentation': 'alimentation',
    'cloture': 'cloture'
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
// FONCTIONS D'INTERACTION AVEC SUPABASE
// ============================================================================

// MODIFICATION 4: Initialisation de Supabase
/**
 * Initialise la connexion à Supabase
 */
async function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion Supabase établie pour la page matériel');
            
            // Tester la connexion
            const { data, error } = await supabaseClient
                .from('annonces')
                .select('count', { count: 'exact', head: true })
                .eq('categorie', 'materiaux')
                .eq('status', 'actif');
            
            if (!error) {
                isUsingSupabase = true;
                console.log('✅ Base de données accessible pour le matériel');
            } else {
                console.warn('⚠️ Table annonces non accessible, utilisation des données locales');
            }
        } else {
            console.warn('⚠️ Client Supabase non trouvé, mode hors ligne');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
    }
}

// MODIFICATION 5: Récupération des produits depuis Supabase
/**
 * Récupère les produits de matériel depuis Supabase
 * @returns {Promise<Array>} Liste des produits
 */
async function fetchProductsFromSupabase() {
    if (!supabaseClient) return null;
    
    try {
        console.log('📡 Récupération des produits de matériel depuis Supabase...');
        
        const { data, error } = await supabaseClient
            .from('annonces')
            .select('*')
            .eq('categorie', 'materiaux')
            .eq('status', 'actif')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`✅ ${data.length} produits de matériel récupérés depuis Supabase`);
            return data.map(annonce => transformSupabaseToProduct(annonce));
        }
        
        return [];
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération depuis Supabase:', error);
        return null;
    }
}

// MODIFICATION 6: Transformation des données Supabase vers format produit
/**
 * Transforme une annonce Supabase en format produit
 * @param {Object} annonce - Annonce depuis Supabase
 * @returns {Object} Produit formaté pour la page matériel
 */
function transformSupabaseToProduct(annonce) {
    // Déterminer la catégorie à partir des tags ou du titre
    let category = determineProductCategory(annonce);
    
    return {
        id: annonce.id,
        name: annonce.titre || annonce.title,
        category: category,
        price: annonce.prix || annonce.price || 0,
        currency: annonce.devise || annonce.currency || 'XOF',
        description: annonce.description || '',
        image: annonce.image_principale || annonce.main_image || 'assets/images/placeholder.svg',
        stock: annonce.stock || 10,
        rating: annonce.note || annonce.rating || 4.0,
        reviews: annonce.avis || annonce.reviews || 0,
        vendor: annonce.nom_vendeur || annonce.seller_name || 'Fournisseur',
        location: annonce.localisation || annonce.location || 'Sénégal',
        delivery: annonce.livraison_possible || annonce.delivery || false,
        featured: annonce.annonce_vedette || annonce.featured || false,
        phone: annonce.telephone || annonce.phone,
        created_at: annonce.created_at
    };
}

// MODIFICATION 7: Détermination de la catégorie produit
/**
 * Détermine la catégorie d'un produit à partir de l'annonce
 * @param {Object} annonce - Annonce Supabase
 * @returns {string} Catégorie
 */
function determineProductCategory(annonce) {
    // Si une sous-catégorie est spécifiée
    if (annonce.sous_categorie) {
        for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
            if (value === annonce.sous_categorie || key === annonce.sous_categorie) {
                return key;
            }
        }
    }
    
    // Sinon, déterminer par le titre et la description
    const title = (annonce.titre || annonce.title || '').toLowerCase();
    const description = (annonce.description || '').toLowerCase();
    const searchText = title + ' ' + description;
    
    if (searchText.includes('abreuvoir') || searchText.includes('mangeoire') || searchText.includes('bovin')) {
        return 'bovin';
    }
    if (searchText.includes('mouton') || searchText.includes('chèvre') || searchText.includes('ovin') || searchText.includes('caprin')) {
        return 'ovin';
    }
    if (searchText.includes('poule') || searchText.includes('volaille') || searchText.includes('avicole')) {
        return 'avicole';
    }
    if (searchText.includes('vaccin') || searchText.includes('seringue') || searchText.includes('vétérinaire')) {
        return 'veterinaire';
    }
    if (searchText.includes('aliment') || searchText.includes('concentré') || searchText.includes('nutrition')) {
        return 'alimentation';
    }
    if (searchText.includes('clôture') || searchText.includes('enclos') || searchText.includes('barrière')) {
        return 'cloture';
    }
    
    return 'bovin'; // Par défaut
}

// MODIFICATION 8: Sauvegarde d'une demande de contact dans Supabase
/**
 * Sauvegarde une demande de contact dans Supabase
 * @param {Object} requestData - Données de la demande
 * @returns {Promise<boolean>} Succès de l'opération
 */
async function saveContactRequestToSupabase(requestData) {
    if (!supabaseClient) return false;
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert([{
                nom: requestData.userName,
                email: requestData.userEmail || '',
                telephone: requestData.userPhone,
                sujet: `Demande matériel - Produit #${requestData.productId}`,
                message: requestData.userMessage,
                status: 'non_lu',
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        console.log('✅ Demande de contact sauvegardée dans Supabase');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde dans Supabase:', error);
        return false;
    }
}

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
            featured: true,
            phone: '+221 77 123 45 67'
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
            featured: false,
            phone: '+221 76 234 56 78'
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
            featured: true,
            phone: '+221 77 345 67 89'
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
            featured: false,
            phone: '+221 78 456 78 90'
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
            featured: true,
            phone: '+221 77 567 89 01'
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
            featured: false,
            phone: '+221 76 678 90 12'
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
            featured: true,
            phone: '+221 77 789 01 23'
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
            featured: false,
            phone: '+221 76 890 12 34'
        }
    ];
}

// ============================================================================
// FONCTIONS D'AFFICHAGE
// ============================================================================

// MODIFICATION 9: Initialisation asynchrone avec Supabase
/**
 * Initialise la page des produits
 */
async function initializeProductsPage() {
    console.log('🚀 Initialisation de la page matériel...');
    
    // Afficher un indicateur de chargement
    showLoadingIndicator();
    
    try {
        // 1. Initialiser Supabase
        await initSupabase();
        
        // 2. Charger les données depuis Supabase ou localement
        await loadProductsData();
        
        // 3. Configurer les événements
        setupFilterEvents();
        setupSearchEvents();
        setupModalEvents();
        
        // 4. Afficher les produits
        displayProducts();
        
        // 5. Mettre à jour les statistiques
        updateStatistics();
        
        // 6. Initialiser les fonctionnalités responsives
        initializeResponsiveFeatures();
        optimizeImagePerformance();
        
        // Afficher le statut de connexion
        showConnectionStatus();
        
        console.log(`✅ Page matériel initialisée avec ${allProducts.length} produits`);
        console.log(`📡 Statut Supabase: ${isUsingSupabase ? 'Connecté' : 'Hors ligne'}`);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement des produits');
    } finally {
        hideLoadingIndicator();
    }
}

// MODIFICATION 10: Chargement des produits depuis Supabase
/**
 * Charge les produits depuis Supabase ou localement
 */
async function loadProductsData() {
    // Tenter de charger depuis Supabase
    if (supabaseClient) {
        const supabaseProducts = await fetchProductsFromSupabase();
        if (supabaseProducts && supabaseProducts.length > 0) {
            allProducts = supabaseProducts;
            console.log(`✅ ${allProducts.length} produits chargés depuis Supabase`);
            
            // Mettre à jour le localStorage pour le fallback
            localStorage.setItem('products_data', JSON.stringify(allProducts));
            filteredProducts = [...allProducts];
            return;
        }
    }
    
    // Fallback: Charger depuis localStorage
    const cachedProducts = localStorage.getItem('products_data');
    if (cachedProducts) {
        try {
            allProducts = JSON.parse(cachedProducts);
            console.log(`💾 ${allProducts.length} produits chargés depuis le cache`);
            filteredProducts = [...allProducts];
            return;
        } catch (e) {
            console.warn('Erreur lors du chargement du cache');
        }
    }
    
    // Dernier recours: Données par défaut
    allProducts = getProductsData();
    console.log(`📋 ${allProducts.length} produits chargés depuis les données par défaut`);
    filteredProducts = [...allProducts];
    
    // Sauvegarder dans localStorage
    localStorage.setItem('products_data', JSON.stringify(allProducts));
}

/**
 * Affiche un indicateur de chargement
 */
function showLoadingIndicator() {
    const container = document.getElementById('products-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #006837;"></i>
                <p>Chargement des produits...</p>
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
 * Affiche le statut de connexion
 */
function showConnectionStatus() {
    if (isUsingSupabase) {
        console.log('📡 Mode: Connecté à Supabase (produits synchronisés)');
        const statusBadge = document.createElement('div');
        statusBadge.className = 'connection-status online';
        statusBadge.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Catalogue synchronisé';
        statusBadge.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #28a745; color: white; padding: 8px 15px; border-radius: 20px; font-size: 12px; z-index: 1000;';
        document.body.appendChild(statusBadge);
        setTimeout(() => statusBadge.remove(), 5000);
    } else {
        console.log('📴 Mode: Hors ligne (catalogue local)');
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
    const stars = generateStarRating(product.rating || 4.0);

    // Formater le prix
    const formattedPrice = `${(product.price || 0).toLocaleString()} ${product.currency || 'XOF'}`;
    
    // Gérer l'image par défaut
    const imageUrl = product.image && product.image !== 'undefined' ? 
        product.image : 'assets/images/placeholder.svg';

    card.innerHTML = `
        <div class="product-image-container">
            <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                 loading="lazy"
                 onerror="this.src='assets/images/placeholder.svg'">
            ${product.featured ? '<span class="featured-badge">⭐ Vedette</span>' : ''}
            ${product.stock < 10 ? '<span class="low-stock-badge">Stock limité</span>' : ''}
        </div>
        
        <div class="product-info">
            <div class="product-category">
                ${CATEGORY_ICONS[product.category] || '🔧'} ${CATEGORIES[product.category] || product.category}
            </div>
            
            <h3 class="product-name">${product.name || 'Sans nom'}</h3>
            <p class="product-description">${truncateText(product.description || '', 100)}</p>
            
            <div class="product-rating">
                <div class="stars">${stars}</div>
                <span class="rating-text">${(product.rating || 4.0).toFixed(1)} (${product.reviews || 0} avis)</span>
            </div>
            
            <div class="product-meta">
                <div class="product-price">${formattedPrice}</div>
                <div class="product-stock">Stock: ${product.stock || 'N/A'}</div>
            </div>
            
            <div class="product-vendor">
                <i class="fas fa-store"></i> ${product.vendor || 'Fournisseur'} - ${product.location || 'Sénégal'}
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

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }

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
    const images = document.querySelectorAll('.product-image, .listing-image');

    images.forEach(img => {
        img.addEventListener('error', function() {
            this.src = 'assets/images/placeholder.svg';
            this.alt = 'Image non disponible';
        });
    });
}

/**
 * Initialise tous les ajustements responsives
 */
function initializeResponsiveFeatures() {
    setupLazyLoading();
    handleImageErrors();
    console.log('📱 Fonctionnalités responsives initialisées');
}

/**
 * Optimise les performances des images
 */
function optimizeImagePerformance() {
    const images = document.querySelectorAll('.product-image, .listing-image');

    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        img.style.width = '100%';
        img.style.height = 'auto';
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
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
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
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchTerm = e.target.value.toLowerCase();
                applyFilters();
            }, 300);
        });
    }

    console.log('✅ Événements de recherche configurés');
}

/**
 * Applique les filtres de catégorie et de recherche
 */
function applyFilters() {
    console.log(`🔍 Application des filtres - Catégorie: ${currentCategory}, Recherche: "${searchTerm}"`);

    filteredProducts = allProducts.filter(product => {
        const categoryMatch = currentCategory === 'all' || product.category === currentCategory;

        const searchMatch = searchTerm === '' ||
            (product.name || '').toLowerCase().includes(searchTerm) ||
            (product.description || '').toLowerCase().includes(searchTerm) ||
            (product.vendor || '').toLowerCase().includes(searchTerm) ||
            (product.location || '').toLowerCase().includes(searchTerm);

        return categoryMatch && searchMatch;
    });

    displayProducts();
    updateStatistics();

    console.log(`📊 Filtres appliqués: ${filteredProducts.length}/${allProducts.length} produits affichés`);
}

/**
 * Met à jour les statistiques de la page
 */
function updateStatistics() {
    const statsElements = document.querySelectorAll('.stat-number');

    if (statsElements.length >= 3) {
        statsElements[0].textContent = `${allProducts.length}+`;
        statsElements[1].textContent = `${new Set(allProducts.map(p => p.vendor)).size}+`;
        statsElements[2].textContent = `${new Set(allProducts.map(p => p.location)).size}`;
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

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            closeModal();
        });
    });

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

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
    const phone = product.phone || '221770000000';
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone;

    const message = encodeURIComponent(
        `Bonjour, je suis intéressé(e) par "${product.name}" à ${(product.price || 0).toLocaleString()} ${product.currency || 'XOF'} sur Sénégal Élevage. Est-ce toujours disponible ?`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    console.log(`📱 WhatsApp ouvert pour: ${product.name}`);
}

/**
 * Ferme le modal de contact
 */
function closeModal() {
    const modal = document.getElementById('contact-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    const form = document.getElementById('contact-form');
    if (form) {
        form.reset();
    }

    console.log('📞 Modal de contact fermé');
}

// MODIFICATION 11: Sauvegarde de la demande de contact avec Supabase
/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - Événement de soumission
 */
async function handleContactSubmit(e) {
    e.preventDefault();

    const modal = document.getElementById('contact-modal');
    const productId = modal ? modal.dataset.productId : null;

    const formData = {
        productId: productId,
        userName: document.getElementById('user-name')?.value || '',
        userPhone: document.getElementById('user-phone')?.value || '',
        userRegion: document.getElementById('user-region')?.value || '',
        userEmail: document.getElementById('user-email')?.value || '',
        messageType: document.getElementById('message-type')?.value || 'general',
        userMessage: document.getElementById('user-message')?.value || '',
        timestamp: new Date().toISOString()
    };

    console.log('📝 Données de contact:', { ...formData, userMessage: '[CONTENU CACHÉ]' });

    let supabaseSuccess = false;
    
    // Sauvegarder dans Supabase si disponible
    if (isUsingSupabase) {
        supabaseSuccess = await saveContactRequestToSupabase(formData);
    }
    
    // Toujours sauvegarder localement
    saveContactRequest(formData);

    const successMessage = supabaseSuccess 
        ? '📧 Demande envoyée avec succès ! Sauvegardée dans le cloud.'
        : '📧 Demande envoyée avec succès ! Le vendeur vous contactera rapidement.';
    
    showNotification(successMessage);
    closeModal();
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
            synced: isUsingSupabase
        });

        if (requests.length > 100) {
            requests.splice(100);
        }

        localStorage.setItem('contact_requests', JSON.stringify(requests));
        console.log('💾 Demande de contact sauvegardée localement');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

/**
 * Affiche les détails d'un produit
 * @param {Object} product - Produit à afficher
 */
function showProductDetails(product) {
    console.log(`📋 Affichage des détails pour: ${product.name}`);

    const details = `
        📋 ${product.name || 'Produit'}
        
        📝 Description: ${product.description || 'Non disponible'}
        
        💰 Prix: ${(product.price || 0).toLocaleString()} ${product.currency || 'XOF'}
        
        📦 Stock: ${product.stock || 'N/A'} unités
        
        ⭐ Note: ${(product.rating || 4.0).toFixed(1)}/5 (${product.reviews || 0} avis)
        
        🏪 Vendeur: ${product.vendor || 'Fournisseur'}
        
        📍 Localisation: ${product.location || 'Sénégal'}
        
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
    optimizeImagePerformance: optimizeImagePerformance,
    isOnline: () => isUsingSupabase
};

// ============================================================================
// INITIALISATION AU CHARGEMENT DE LA PAGE
// ============================================================================

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeProductsPage);

console.log('✅ Script materiel.js chargé - Prêt pour la page matériel');
console.log('🔗 Connexion Supabase configurée avec l\'URL:', SUPABASE_URL);