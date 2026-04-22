/**
 * Fichier: betail.js
 * Description: Script pour la page Bétail de Sénégal Élevage
 * Gestion de l'affichage, du filtrage et de la recherche des annonces de bétail
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion des annonces
let allLivestock = [];
let filteredLivestock = [];
let currentPage = 1;
let itemsPerPage = 12;

// Variables pour les filtres
let currentCategory = 'all';
let currentFilters = {
    search: '',
    region: '',
    priceMin: '',
    priceMax: '',
    sort: 'recent'
};

// Configuration des catégories de bétail
const LIVESTOCK_CATEGORIES = {
    all: 'Tous les types',
    bovin: 'Bovins',
    ovin: 'Ovins',
    caprin: 'Caprins',
    porcin: 'Porcins',
    camelins: 'Camélins'
};

// Configuration des icônes par catégorie
const CATEGORY_ICONS = {
    bovin: '🐄',
    ovin: '🐑',
    caprin: '🐐',
    porcin: '🐖',
    camelins: '🐪'
};

// ============================================================================
// DONNÉES DES ANNONCES DE BÉTAIL
// ============================================================================

/**
 * Retourne les données des annonces de bétail
 * @returns {Array} Liste des annonces de bétail
 */
function getLivestockData() {
    return [
        // Bovins
        {
            id: 1,
            title: 'Vache Gyr laitière pure',
            category: 'bovin',
            price: 250000,
            currency: 'XOF',
            age: '3 ans',
            weight: '450 kg',
            breed: 'Gyr',
            description: 'Vache laitière de race Gyr, production journalière de 15-20 litres, en excellente santé.',
            image: 'assets/images/VacheGyrlaitièrepure1.jpg',
            location: 'Dakar',
            region: 'Dakar',
            seller: 'Ferme Laitière du Sénégal',
            phone: '+221 77 123 45 67',
            certified: true,
            vaccinated: true,
            views: 145,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: true
        },
        {
            id: 2,
            title: 'Taureau Charolais de 2 ans',
            category: 'bovin',
            price: 350000,
            currency: 'XOF',
            age: '2 ans',
            weight: '600 kg',
            breed: 'Charolais',
            description: 'Magnifique taureau Charolais, parfait pour la reproduction, excellent gabarit.',
            image: 'assets/images/Taureau Charolais de 2 ans.jpg',
            location: 'Thiès',
            region: 'Thiès',
            seller: 'Élevage Moderne',
            phone: '+221 76 234 56 78',
            certified: true,
            vaccinated: true,
            views: 89,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: false
        },
        
        // Ovins
        {
            id: 3,
            title: 'Bélier Touabire pur',
            category: 'ovin',
            price: 45000,
            currency: 'XOF',
            age: '18 mois',
            weight: '65 kg',
            breed: 'Touabire',
            description: 'Bélier de race Touabire, excellent reproducteur, papiers en ordre.',
            image: 'assets/images/BélierTouabirepur.jpg',
            location: 'Kaolack',
            region: 'Kaolack',
            seller: 'Éleveur Ovin Expert',
            phone: '+221 77 345 67 89',
            certified: true,
            vaccinated: true,
            views: 234,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: false
        },
        {
            id: 4,
            title: 'Lot de 10 brebis Djallonké',
            category: 'ovin',
            price: 280000,
            currency: 'XOF',
            age: '2-3 ans',
            weight: '45-55 kg',
            breed: 'Djallonké',
            description: 'Lot de 10 brebis Djallonké en bonne santé, idéales pour la reproduction.',
            image: 'assets/images/Lot de 10 brebis Djallonké.jpg',
            location: 'Saint-Louis',
            region: 'Saint-Louis',
            seller: 'Élevage Nord',
            phone: '+221 78 456 78 90',
            certified: true,
            vaccinated: true,
            views: 167,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: true
        },
        
        // Caprins
        {
            id: 5,
            title: 'Bouc Sahélien de 18 mois',
            category: 'caprin',
            price: 35000,
            currency: 'XOF',
            age: '18 mois',
            weight: '40 kg',
            breed: 'Sahélien',
            description: 'Bouc Sahélien robuste, excellent pour la reproduction en zone sahélienne.',
            image: 'assets/images/BoucSahéliende18mois.jpg',
            location: 'Tambacounda',
            region: 'Tambacounda',
            seller: 'Éleveur Sahel',
            phone: '+221 77 567 89 01',
            certified: false,
            vaccinated: true,
            views: 98,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: false
        },
        
        // Porcins
        {
            id: 6,
            title: 'Truie Large White de 1 an',
            category: 'porcin',
            price: 85000,
            currency: 'XOF',
            age: '1 an',
            weight: '180 kg',
            breed: 'Large White',
            description: 'Truie Large White prête pour la reproduction, excellente mère.',
            image: 'assets/images/TruieLargeWhitede1an.jpg',
            location: 'Fatick',
            region: 'Fatick',
            seller: 'Porcin Pro Sénégal',
            phone: '+221 76 678 90 12',
            certified: true,
            vaccinated: true,
            views: 76,
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: false
        },
        
        // Camélins
        {
            id: 7,
            title: 'Chameau mâure de 4 ans',
            category: 'camelins',
            price: 450000,
            currency: 'XOF',
            age: '4 ans',
            weight: '450 kg',
            breed: 'Mâure',
            description: 'Chameau mâure de 4 ans, excellent pour le transport et le travail.',
            image: 'assets/images/Chameau mâure de 4 ans.jpg',
            location: 'Kédougou',
            region: 'Kédougou',
            seller: 'Éleveur du Nord',
            phone: '+221 77 789 01 23',
            certified: true,
            vaccinated: true,
            views: 54,
            created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: false
        },
        
        // Plus de bovins
        {
            id: 8,
            title: 'Génisse Montbéliarde de 20 mois',
            category: 'bovin',
            price: 180000,
            currency: 'XOF',
            age: '20 mois',
            weight: '380 kg',
            breed: 'Montbéliarde',
            description: 'Génisse Montbéliarde, excellent potentiel laitier et viandeux.',
            image: 'assets/images/Génisse Montbéliarde de 20 mois.jpg',
            location: 'Kolda',
            region: 'Kolda',
            seller: 'Ferme Montbéliarde',
            phone: '+221 76 890 12 34',
            certified: true,
            vaccinated: true,
            views: 112,
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            urgent: false
        }
    ];
}

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise la page bétail
 */
function initializeLivestockPage() {
    console.log('🚀 Initialisation de la page Bétail...');
    
    try {
        // 1. Charger les données
        allLivestock = getLivestockData();
        filteredLivestock = [...allLivestock];
        
        // 2. Configurer les événements
        setupCategoryEvents();
        setupFilterEvents();
        setupSearchEvents();
        setupLoadMoreEvents();
        
        // 3. Appliquer les filtres initiaux
        applyFilters();
        
        // 4. Afficher les résultats
        displayLivestock();
        
        // 5. Optimiser les images
        optimizeImages();
        
        console.log(`✅ Page Bétail initialisée avec ${allLivestock.length} annonces`);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement des annonces de bétail');
    }
}

// ============================================================================
// FONCTIONS D'AFFICHAGE
// ============================================================================

/**
 * Affiche les annonces de bétail
 */
function displayLivestock() {
    const container = document.getElementById('livestock-container');
    if (!container) {
        console.warn('⚠️ Conteneur du bétail non trouvé');
        return;
    }
    
    // Calculer les annonces à afficher pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const livestockToShow = filteredLivestock.slice(startIndex, endIndex);
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Afficher un message si aucun résultat
    if (livestockToShow.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Aucune annonce trouvée</h3>
                <p>Essayez de modifier vos filtres ou votre recherche</p>
            </div>
        `;
        updateLoadMoreButton(false);
        return;
    }
    
    // Créer et afficher chaque annonce
    livestockToShow.forEach(livestock => {
        const card = createLivestockCard(livestock);
        container.appendChild(card);
    });
    
    // Mettre à jour le compteur de résultats
    updateResultsCount();
    
    // Mettre à jour le bouton "charger plus"
    const hasMore = endIndex < filteredLivestock.length;
    updateLoadMoreButton(hasMore);
    
    console.log(`📋 Affichage de ${livestockToShow.length} annonces (page ${currentPage})`);
}

/**
 * Crée une carte d'annonce de bétail
 * @param {Object} livestock - Données de l'annonce
 * @returns {HTMLElement} Carte de l'annonce
 */
function createLivestockCard(livestock) {
    const card = document.createElement('div');
    card.className = 'livestock-card';
    
    // Formater le prix
    const formattedPrice = `${livestock.price.toLocaleString()} ${livestock.currency}`;
    
    // Générer le badge de catégorie
    const categoryBadge = livestock.urgent ? 
        '<span class="livestock-badge">URGENT</span>' : 
        `<span class="livestock-badge">${LIVESTOCK_CATEGORIES[livestock.category]}</span>`;
    
    card.innerHTML = `
        <div class="livestock-image-container">
            <img src="${livestock.image}" alt="${livestock.title}" class="livestock-image" 
                 loading="lazy"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22sans-serif%22 font-size=%2216%22 fill=%22%23999%22%3EImage non disponible%3C/text%3E%3C/svg%3E'">
            ${categoryBadge}
        </div>
        
        <div class="livestock-info">
            <h3 class="livestock-title">${livestock.title}</h3>
            <p class="livestock-description">${truncateText(livestock.description, 80)}</p>
            
            <div class="livestock-details">
                <div class="detail-item">
                    <i class="fas fa-tag"></i>
                    <span>${livestock.breed}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-birthday-cake"></i>
                    <span>${livestock.age}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-weight"></i>
                    <span>${livestock.weight}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>${livestock.certified ? 'Certifié' : 'Non certifié'}</span>
                </div>
            </div>
            
            <div class="livestock-price">${formattedPrice}</div>
            
            <div class="livestock-meta">
                <div class="livestock-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${livestock.location}</span>
                </div>
                <div class="livestock-date">
                    <i class="fas fa-clock"></i>
                    <span>${formatRelativeTime(livestock.created_at)}</span>
                </div>
            </div>
            
            <div class="livestock-actions">
                <button class="btn btn-primary contact-btn" data-livestock-id="${livestock.id}">
                    <i class="fas fa-phone"></i> Contacter
                </button>
                <button class="btn btn-outline details-btn" data-livestock-id="${livestock.id}">
                    <i class="fas fa-info-circle"></i> Détails
                </button>
            </div>
        </div>
    `;
    
    // Ajouter les événements aux boutons
    const contactBtn = card.querySelector('.contact-btn');
    const detailsBtn = card.querySelector('.details-btn');
    
    contactBtn.addEventListener('click', () => contactSeller(livestock));
    detailsBtn.addEventListener('click', () => showLivestockDetails(livestock));
    
    return card;
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
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = filteredLivestock.length.toLocaleString();
    }
}

/**
 * Met à jour le bouton "charger plus"
 * @param {boolean} hasMore - S'il y a plus de résultats
 */
function updateLoadMoreButton(hasMore) {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!loadMoreBtn) return;
    
    if (hasMore) {
        loadMoreBtn.style.display = 'inline-flex';
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Charger plus d\'annonces';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// ============================================================================
// FONCTIONS DE FILTRAGE ET RECHERCHE
// ============================================================================

/**
 * Configure les événements des catégories
 */
function setupCategoryEvents() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Mettre à jour la catégorie courante
            currentCategory = button.dataset.category;
            currentPage = 1;
            
            // Appliquer les filtres
            applyFilters();
        });
    });
    
    console.log('✅ Événements des catégories configurés');
}

/**
 * Configure les événements des filtres
 */
function setupFilterEvents() {
    const filterElements = {
        'region-filter': 'region',
        'price-min': 'priceMin',
        'price-max': 'priceMax',
        'sort-filter': 'sort'
    };
    
    Object.entries(filterElements).forEach(([elementId, filterKey]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('change', (e) => {
                currentFilters[filterKey] = e.target.value;
                currentPage = 1;
                applyFilters();
            });
        }
    });
    
    console.log('✅ Événements des filtres configurés');
}

/**
 * Configure les événements de recherche
 */
function setupSearchEvents() {
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        // Recherche en temps réel avec debounce
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value.toLowerCase();
                currentPage = 1;
                applyFilters();
            }, 300);
        });
    }
    
    console.log('✅ Événements de recherche configurés');
}

/**
 * Configure les événements du bouton "charger plus"
 */
function setupLoadMoreEvents() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            displayLivestock();
        });
    }
    
    console.log('✅ Événements du bouton "charger plus" configurés');
}

/**
 * Applique tous les filtres actifs
 */
function applyFilters() {
    console.log('🔍 Application des filtres:', currentFilters);
    
    // Filtrer les annonces
    filteredLivestock = allLivestock.filter(livestock => {
        // Filtre par catégorie
        const categoryMatch = currentCategory === 'all' || livestock.category === currentCategory;
        
        // Filtre par recherche
        const searchMatch = currentFilters.search === '' || 
            livestock.title.toLowerCase().includes(currentFilters.search) ||
            livestock.description.toLowerCase().includes(currentFilters.search) ||
            livestock.breed.toLowerCase().includes(currentFilters.search) ||
            livestock.location.toLowerCase().includes(currentFilters.search) ||
            livestock.seller.toLowerCase().includes(currentFilters.search);
        
        // Filtre par région
        const regionMatch = currentFilters.region === '' || livestock.region === currentFilters.region;
        
        // Filtre par prix
        let priceMatch = true;
        if (currentFilters.priceMin) {
            priceMatch = priceMatch && livestock.price >= parseInt(currentFilters.priceMin);
        }
        if (currentFilters.priceMax) {
            priceMatch = priceMatch && livestock.price <= parseInt(currentFilters.priceMax);
        }
        
        return categoryMatch && searchMatch && regionMatch && priceMatch;
    });
    
    // Appliquer le tri
    sortLivestock();
    
    // Afficher les résultats
    displayLivestock();
    
    console.log(`📊 Filtres appliqués: ${filteredLivestock.length}/${allLivestock.length} annonces affichées`);
}

/**
 * Applique le tri aux annonces filtrées
 */
function sortLivestock() {
    switch (currentFilters.sort) {
        case 'recent':
            filteredLivestock.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'prix-asc':
            filteredLivestock.sort((a, b) => a.price - b.price);
            break;
        case 'prix-desc':
            filteredLivestock.sort((a, b) => b.price - a.price);
            break;
        case 'age-asc':
            filteredLivestock.sort((a, b) => parseInt(a.age) - parseInt(b.age));
            break;
        case 'age-desc':
            filteredLivestock.sort((a, b) => parseInt(b.age) - parseInt(a.age));
            break;
        default:
            filteredLivestock.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

// ============================================================================
// FONCTIONS D'INTERACTION
// ============================================================================

/**
 * Contacte le vendeur
 * @param {Object} livestock - Annonce concernée
 */
function contactSeller(livestock) {
    console.log(`📞 Contact du vendeur pour: ${livestock.title}`);
    
    // Créer un message de contact
    const contactMessage = `
        🐄 DEMANDE DE CONTACT - BÉTAIL
        
        Annonce: ${livestock.title}
        Prix: ${livestock.price.toLocaleString()} ${livestock.currency}
        Race: ${livestock.breed}
        Âge: ${livestock.age}
        Poids: ${livestock.weight}
        Localisation: ${livestock.location}
        Vendeur: ${livestock.seller}
        Téléphone: ${livestock.phone}
        
        Intéressé(e) par cette annonce. Merci de me contacter pour plus d'informations.
    `;
    
    // Copier dans le presse-papiers
    navigator.clipboard.writeText(contactMessage).then(() => {
        showNotification('📋 Informations du vendeur copiées dans le presse-papiers');
        
        // Ouvrir le téléphone (si possible)
        window.open(`tel:${livestock.phone}`, '_self');
        
    }).catch(() => {
        // Alternative: afficher les informations dans une alerte
        alert(contactMessage);
    });
    
    // Sauvegarder la demande localement
    saveContactRequest(livestock);
}

/**
 * Affiche les détails d'une annonce
 * @param {Object} livestock - Annonce à afficher
 */
function showLivestockDetails(livestock) {
    console.log(`📋 Affichage des détails pour: ${livestock.title}`);
    
    const details = `
        🐄 ${livestock.title}
        
        📝 Description: ${livestock.description}
        
        🏷️ Race: ${livestock.breed}
        🎂 Âge: ${livestock.age}
        ⚖️ Poids: ${livestock.weight}
        
        💰 Prix: ${livestock.price.toLocaleString()} ${livestock.currency}
        
        📍 Localisation: ${livestock.location} (${livestock.region})
        
        🏪 Vendeur: ${livestock.seller}
        📞 Téléphone: ${livestock.phone}
        
        📜 Certifié: ${livestock.certified ? 'Oui' : 'Non'}
        💉 Vacciné: ${livestock.vaccinated ? 'Oui' : 'Non'}
        
        👁️ Vues: ${livestock.views}
        📅 Date: ${new Date(livestock.created_at).toLocaleDateString('fr-FR')}
        
        ${livestock.urgent ? '🚨 ANNONCE URGENTE' : ''}
    `;
    
    alert(details);
}

/**
 * Sauvegarde une demande de contact localement
 * @param {Object} livestock - Annonce concernée
 */
function saveContactRequest(livestock) {
    try {
        const requests = JSON.parse(localStorage.getItem('contact_requests') || '[]');
        const newRequest = {
            id: Date.now(),
            type: 'livestock',
            livestockId: livestock.id,
            title: livestock.title,
            seller: livestock.seller,
            phone: livestock.phone,
            location: livestock.location,
            price: livestock.price,
            timestamp: new Date().toISOString()
        };
        
        requests.unshift(newRequest);
        
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

/**
 * Optimise le chargement et l'affichage des images
 */
function optimizeImages() {
    // Supporter le lazy loading natif
    if ('IntersectionObserver' in window) {
        const imageElements = document.querySelectorAll('.livestock-image');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    // Supprimer le placeholder
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        imageElements.forEach(img => imageObserver.observe(img));
        console.log('✅ Lazy loading des images configuré');
    }
    
    // Ajouter des dimensions responsives
    const images = document.querySelectorAll('.livestock-image');
    images.forEach(img => {
        // Définir des attributs de dimension
        if (!img.hasAttribute('width')) {
            img.setAttribute('width', '400');
        }
        if (!img.hasAttribute('height')) {
            img.setAttribute('height', '300');
        }
        
        // Ajouter srcset pour la responsivité
        if (img.src && !img.hasAttribute('srcset')) {
            const src = img.src;
            img.setAttribute('srcset', `${src} 1x, ${src} 2x`);
        }
    });
    
    console.log('🖼️ Images optimisées pour la responsivité');
}

/**
 * Redéfinir displayLivestock pour appeler optimizeImages
 */
const originalDisplayLivestock = displayLivestock;
displayLivestock = function() {
    originalDisplayLivestock.call(this);
    // Optimiser les images après l'affichage
    setTimeout(() => optimizeImages(), 100);
};

// Exporter les fonctions pour usage global
window.LivestockManager = {
    getLivestock: () => [...allLivestock],
    getFilteredLivestock: () => [...filteredLivestock],
    getCurrentCategory: () => currentCategory,
    getCurrentFilters: () => ({...currentFilters}),
    refreshLivestock: () => applyFilters(),
    contactSeller: contactSeller,
    showDetails: showLivestockDetails,
    optimizeImages: optimizeImages
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeLivestockPage);

console.log('✅ Script betail.js chargé - Prêt pour la page bétail');
