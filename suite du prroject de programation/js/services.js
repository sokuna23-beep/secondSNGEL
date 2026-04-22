/**
 * Fichier: services.js
 * Description: Script pour la page Services de Sénégal Élevage
 * Gestion de l'affichage, du filtrage et de la recherche des services d'élevage
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion des services
let allServices = [];
let filteredServices = [];
let currentPage = 1;
let itemsPerPage = 9;

// Variables pour les filtres
let currentCategory = 'all';
let currentFilters = {
    search: '',
    region: '',
    priceMin: '',
    priceMax: '',
    availability: ''
};

// Configuration des catégories de services
const SERVICE_CATEGORIES = {
    all: 'Tous les services',
    veterinaire: 'Services vétérinaires',
    transport: 'Transport',
    alimentation: 'Alimentation',
    conseil: 'Conseil & Formation',
    abattage: 'Abattage & Transformation',
    maintenance: 'Maintenance & Réparation'
};

// Configuration des icônes par catégorie
const CATEGORY_ICONS = {
    veterinaire: '🩺',
    transport: '🚚',
    alimentation: '🌾',
    conseil: '🎓',
    abattage: '🔪',
    maintenance: '🔧'
};

// ============================================================================
// DONNÉES DES SERVICES
// ============================================================================

/**
 * Retourne les données des services
 * @returns {Array} Liste des services
 */
function getServicesData() {
    return [
        // Services vétérinaires
        {
            id: 1,
            title: 'Consultation vétérinaire à domicile',
            category: 'veterinaire',
            price: 15000,
            currency: 'XOF',
            description: 'Consultation complète de vos animaux à domicile : diagnostic, traitement et conseils préventifs.',
            provider: 'Dr. Mamadou Ba, Vétérinaire',
            location: 'Dakar',
            region: 'Dakar',
            phone: '+221 77 123 45 67',
            availability: '24h',
            rating: 4.8,
            reviews: 156,
            certified: true,
            urgent: true,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            title: 'Vaccination et déparasitage',
            category: 'veterinaire',
            price: 8000,
            currency: 'XOF',
            description: 'Programme complet de vaccination et déparasitage pour bovins, ovins et caprins.',
            provider: 'Clinique Vétérinaire du Sahel',
            location: 'Thiès',
            region: 'Thiès',
            phone: '+221 76 234 56 78',
            availability: '48h',
            rating: 4.6,
            reviews: 89,
            certified: true,
            urgent: false,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },

        // Transport
        {
            id: 3,
            title: 'Transport de bétail national',
            category: 'transport',
            price: 25000,
            currency: 'XOF',
            description: 'Transport sécurisé de votre bétail dans toutes les régions du Sénégal. Véhicules spécialisés.',
            provider: 'TransÉlevage Pro',
            location: 'Dakar',
            region: 'Dakar',
            phone: '+221 77 345 67 89',
            availability: 'immediate',
            rating: 4.7,
            reviews: 234,
            certified: true,
            urgent: true,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 4,
            title: 'Transport d\'urgence 24/7',
            category: 'transport',
            price: 35000,
            currency: 'XOF',
            description: 'Service d\'urgence disponible 24h/24 et 7j/7 pour transport de bétail malade ou blessé.',
            provider: 'Urgence Transport Bétail',
            location: 'Saint-Louis',
            region: 'Saint-Louis',
            phone: '+221 78 456 78 90',
            availability: '24h',
            rating: 4.9,
            reviews: 67,
            certified: true,
            urgent: true,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },

        // Alimentation
        {
            id: 5,
            title: 'Conseil en alimentation bétail',
            category: 'alimentation',
            price: 20000,
            currency: 'XOF',
            description: 'Analyse de vos besoins et recommandation personnalisée pour l\'alimentation de votre troupeau.',
            provider: 'NutriBétail Conseil',
            location: 'Kaolack',
            region: 'Kaolack',
            phone: '+221 77 567 89 01',
            availability: 'week',
            rating: 4.5,
            reviews: 45,
            certified: true,
            urgent: false,
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },

        // Conseil & Formation
        {
            id: 6,
            title: 'Formation en élevage moderne',
            category: 'conseil',
            price: 50000,
            currency: 'XOF',
            description: 'Formation complète de 3 jours sur les techniques modernes d\'élevage et gestion.',
            provider: 'École Supérieure d\'Élevage',
            location: 'Dakar',
            region: 'Dakar',
            phone: '+221 33 800 00 00',
            availability: 'week',
            rating: 4.8,
            reviews: 112,
            certified: true,
            urgent: false,
            created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 7,
            title: 'Conseil en gestion de ferme',
            category: 'conseil',
            price: 30000,
            currency: 'XOF',
            description: 'Audit complet de votre exploitation et plan d\'amélioration personnalisé.',
            provider: 'Conseil Agricole Pro',
            location: 'Fatick',
            region: 'Fatick',
            phone: '+221 76 678 90 12',
            availability: '48h',
            rating: 4.6,
            reviews: 78,
            certified: true,
            urgent: false,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },

        // Abattage & Transformation
        {
            id: 8,
            title: 'Service d\'abattage certifié',
            category: 'abattage',
            price: 15000,
            currency: 'XOF',
            description: 'Abattage selon les normes halal et sanitaires, avec certificat vétérinaire.',
            provider: 'Abattage Sanitaire Sénégal',
            location: 'Tambacounda',
            region: 'Tambacounda',
            phone: '+221 77 789 01 23',
            availability: '24h',
            rating: 4.7,
            reviews: 134,
            certified: true,
            urgent: true,
            created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },

        // Maintenance & Réparation
        {
            id: 9,
            title: 'Maintenance d\'équipement d\'élevage',
            category: 'maintenance',
            price: 12000,
            currency: 'XOF',
            description: 'Entretien et réparation de tous types d\'équipements : abreuvoirs, clôtures, etc.',
            provider: 'TechÉlevage Maintenance',
            location: 'Kolda',
            region: 'Kolda',
            phone: '+221 76 890 12 34',
            availability: '48h',
            rating: 4.4,
            reviews: 56,
            certified: true,
            urgent: false,
            created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
}

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise la page services
 */
function initializeServicesPage() {
    console.log('🚀 Initialisation de la page Services...');

    try {
        // 1. Charger les données
        allServices = getServicesData();
        filteredServices = [...allServices];

        // 2. Configurer les événements
        setupCategoryEvents();
        setupFilterEvents();
        setupSearchEvents();
        setupLoadMoreEvents();

        // 3. Appliquer les filtres initiaux
        applyFilters();

        // 4. Afficher les résultats
        displayServices();

        // 5. Afficher les services vedettes
        displayFeaturedServices();

        console.log(`✅ Page Services initialisée avec ${allServices.length} services`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement des services');
    }
}

// ============================================================================
// FONCTIONS D'AFFICHAGE
// ============================================================================

/**
 * Affiche les services
 */
function displayServices() {
    const container = document.getElementById('services-container');
    if (!container) {
        console.warn('⚠️ Conteneur des services non trouvé');
        return;
    }

    // Calculer les services à afficher pour la pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const servicesToShow = filteredServices.slice(startIndex, endIndex);

    // Vider le conteneur
    container.innerHTML = '';

    // Afficher un message si aucun résultat
    if (servicesToShow.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Aucun service trouvé</h3>
                <p>Essayez de modifier vos filtres ou votre recherche</p>
            </div>
        `;
        updateLoadMoreButton(false);
        return;
    }

    // Créer et afficher chaque service
    servicesToShow.forEach(service => {
        const card = createServiceCard(service);
        container.appendChild(card);
    });

    // Mettre à jour le compteur de résultats
    updateResultsCount();

    // Mettre à jour le bouton "charger plus"
    const hasMore = endIndex < filteredServices.length;
    updateLoadMoreButton(hasMore);

    console.log(`📋 Affichage de ${servicesToShow.length} services (page ${currentPage})`);
}

/**
 * Affiche les services vedettes
 */
function displayFeaturedServices() {
    const container = document.getElementById('featured-container');
    if (!container) return;

    // Prendre les 3 services les mieux notés
    const featuredServices = allServices
        .filter(service => service.certified)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

    if (featuredServices.length === 0) return;

    container.innerHTML = featuredServices.map(service => `
        <div class="featured-card">
            <div class="featured-icon">
                <i class="fas ${getServiceIcon(service.category)}"></i>
            </div>
            <h3 class="featured-title">${service.title}</h3>
            <p class="featured-description">${truncateText(service.description, 80)}</p>
            <div class="featured-rating">
                ${generateStars(service.rating)} (${service.reviews} avis)
            </div>
        </div>
    `).join('');
}

/**
 * Crée une carte de service
 * @param {Object} service - Données du service
 * @returns {HTMLElement} Carte du service
 */
function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';

    // Formater le prix
    const formattedPrice = `${service.price.toLocaleString()} ${service.currency}`;

    card.innerHTML = `
        <div class="service-header">
            <div class="service-icon">
                <i class="fas ${getServiceIcon(service.category)}"></i>
            </div>
            <h3 class="service-title">${SERVICE_CATEGORIES[service.category]}</h3>
        </div>
        
        <div class="service-info">
            <h4 class="service-name">${service.title}</h4>
            <p class="service-description">${truncateText(service.description, 120)}</p>
            
            <div class="service-details">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span>${service.provider}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${service.location}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>Disponible: ${getAvailabilityText(service.availability)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>${service.certified ? 'Certifié' : 'Non certifié'}</span>
                </div>
            </div>
            
            <div class="service-price">${formattedPrice}</div>
            
            <div class="service-meta">
                <div class="service-provider">
                    <i class="fas fa-store"></i>
                    <span>${service.provider}</span>
                </div>
                <div class="service-rating">
                    ${generateStars(service.rating)} (${service.reviews})
                </div>
            </div>
            
            <div class="service-actions">
                <button class="btn btn-primary contact-btn" data-service-id="${service.id}">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
                <button class="btn btn-outline details-btn" data-service-id="${service.id}">
                    <i class="fas fa-info-circle"></i> Détails
                </button>
            </div>
        </div>
    `;

    // Ajouter les événements aux boutons
    const contactBtn = card.querySelector('.contact-btn');
    const detailsBtn = card.querySelector('.details-btn');

    contactBtn.addEventListener('click', () => contactServiceProvider(service));
    detailsBtn.addEventListener('click', () => showServiceDetails(service));

    return card;
}

/**
 * Retourne l'icône Font Awesome pour une catégorie
 * @param {string} category - Catégorie du service
 * @returns {string} Classe Font Awesome
 */
function getServiceIcon(category) {
    const icons = {
        veterinaire: 'fa-stethoscope',
        transport: 'fa-truck',
        alimentation: 'fa-wheat-awn',
        conseil: 'fa-graduation-cap',
        abattage: 'fa-cut',
        maintenance: 'fa-wrench'
    };
    return icons[category] || 'fa-handshake';
}

/**
 * Génère les étoiles de notation
 * @param {number} rating - Note du service
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
 * Retourne le texte de disponibilité
 * @param {string} availability - Code de disponibilité
 * @returns {string} Texte formaté
 */
function getAvailabilityText(availability) {
    const texts = {
        'immediate': 'Immédiat',
        '24h': '24h',
        '48h': '48h',
        'week': 'Semaine'
    };
    return texts[availability] || availability;
}

/**
 * Met à jour le compteur de résultats
 */
function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = filteredServices.length.toLocaleString();
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
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Charger plus de services';
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
    const categoryButtons = document.querySelectorAll('.service-category-btn');

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
        'availability-filter': 'availability'
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
            displayServices();
        });
    }

    console.log('✅ Événements du bouton "charger plus" configurés');
}

/**
 * Applique tous les filtres actifs
 */
function applyFilters() {
    console.log('🔍 Application des filtres:', currentFilters);

    // Filtrer les services
    filteredServices = allServices.filter(service => {
        // Filtre par catégorie
        const categoryMatch = currentCategory === 'all' || service.category === currentCategory;

        // Filtre par recherche
        const searchMatch = currentFilters.search === '' ||
            service.title.toLowerCase().includes(currentFilters.search) ||
            service.description.toLowerCase().includes(currentFilters.search) ||
            service.provider.toLowerCase().includes(currentFilters.search) ||
            service.location.toLowerCase().includes(currentFilters.search);

        // Filtre par région
        const regionMatch = currentFilters.region === '' || service.region === currentFilters.region;

        // Filtre par prix
        let priceMatch = true;
        if (currentFilters.priceMin) {
            priceMatch = priceMatch && service.price >= parseInt(currentFilters.priceMin);
        }
        if (currentFilters.priceMax) {
            priceMatch = priceMatch && service.price <= parseInt(currentFilters.priceMax);
        }

        // Filtre par disponibilité
        const availabilityMatch = currentFilters.availability === '' ||
            service.availability === currentFilters.availability;

        return categoryMatch && searchMatch && regionMatch && priceMatch && availabilityMatch;
    });

    // Appliquer le tri
    sortServices();

    // Afficher les résultats
    displayServices();

    console.log(`📊 Filtres appliqués: ${filteredServices.length}/${allServices.length} services affichés`);
}

/**
 * Applique le tri aux services filtrés
 */
function sortServices() {
    // Tri par défaut : les plus récents et les mieux notés d'abord
    filteredServices.sort((a, b) => {
        // Priorité aux services urgents
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;

        // Ensuite par note
        if (a.rating !== b.rating) return b.rating - a.rating;

        // Enfin par date
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

// ============================================================================
// FONCTIONS D'INTERACTION
// ============================================================================

/**
 * Contacte le prestataire de service via WhatsApp
 * @param {Object} service - Service concerné
 */
function contactServiceProvider(service) {
    console.log(`📱 Contact WhatsApp du prestataire pour: ${service.title}`);

    const phone = service.phone || '221770000000';
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone;

    const message = encodeURIComponent(
        `Bonjour, je suis intéressé(e) par votre service "${service.title}" à ${service.price.toLocaleString()} ${service.currency} sur Sénégal Élevage. Pouvez-vous me donner plus d'informations ?`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');

    // Sauvegarder la demande localement
    saveServiceRequest(service);
}

/**
 * Affiche les détails d'un service
 * @param {Object} service - Service à afficher
 */
function showServiceDetails(service) {
    console.log(`📋 Affichage des détails pour: ${service.title}`);

    const details = `
        🤝 ${service.title}
        
        📝 Description: ${service.description}
        
        🏷️ Catégorie: ${SERVICE_CATEGORIES[service.category]}
        
        💰 Prix: ${service.price.toLocaleString()} ${service.currency}
        
        👤 Prestataire: ${service.provider}
        
        📍 Localisation: ${service.location} (${service.region})
        
        📞 Téléphone: ${service.phone}
        
        ⏰ Disponibilité: ${getAvailabilityText(service.availability)}
        
        📜 Certifié: ${service.certified ? 'Oui' : 'Non'}
        
        ⭐ Note: ${service.rating}/5 (${service.reviews} avis)
        
        📅 Date: ${new Date(service.created_at).toLocaleDateString('fr-FR')}
        
        ${service.urgent ? '🚨 SERVICE URGENT' : ''}
    `;

    alert(details);
}

/**
 * Sauvegarde une demande de service localement
 * @param {Object} service - Service concerné
 */
function saveServiceRequest(service) {
    try {
        const requests = JSON.parse(localStorage.getItem('service_requests') || '[]');
        const newRequest = {
            id: Date.now(),
            type: 'service',
            serviceId: service.id,
            title: service.title,
            provider: service.provider,
            phone: service.phone,
            location: service.location,
            price: service.price,
            timestamp: new Date().toISOString()
        };

        requests.unshift(newRequest);

        // Garder seulement les 100 dernières demandes
        if (requests.length > 100) {
            requests.splice(100);
        }

        localStorage.setItem('service_requests', JSON.stringify(requests));
        console.log('💾 Demande de service sauvegardée localement');
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

// Exporter les fonctions pour usage global
window.ServicesManager = {
    getServices: () => [...allServices],
    getFilteredServices: () => [...filteredServices],
    getCurrentCategory: () => currentCategory,
    getCurrentFilters: () => ({ ...currentFilters }),
    refreshServices: () => applyFilters(),
    contactProvider: contactServiceProvider,
    showDetails: showServiceDetails
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeServicesPage);

console.log('✅ Script services.js chargé - Prêt pour la page services');
