/**
 * Fichier: services.js
 * Description: Script pour la page Services de Sénégal Élevage
 * Gestion de l'affichage, du filtrage et de la recherche des services d'élevage
 * Version: 2.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Ajout de la configuration Supabase
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag';

// MODIFICATION 2: Variables globales Supabase
let supabaseClient = null;
let isUsingSupabase = false;

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

// Mapping des catégories pour Supabase
const CATEGORY_MAPPING = {
    'veterinaire': 'service_veterinaire',
    'transport': 'service_transport',
    'alimentation': 'service_alimentation',
    'conseil': 'service_conseil',
    'abattage': 'service_abattage',
    'maintenance': 'service_maintenance'
};

// ============================================================================
// FONCTIONS D'INTERACTION AVEC SUPABASE
// ============================================================================

// MODIFICATION 3: Initialisation de Supabase
async function initSupabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion Supabase établie pour la page Services');
            
            // Tester la connexion
            const { data, error } = await supabaseClient
                .from('services')
                .select('count', { count: 'exact', head: true });
            
            if (!error) {
                isUsingSupabase = true;
                console.log('✅ Table services accessible');
            } else if (error.message.includes('does not exist')) {
                console.warn('⚠️ Table "services" non trouvée, utilisation des données locales');
            }
        } else {
            console.warn('⚠️ Client Supabase non trouvé, mode hors ligne');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation Supabase:', error);
    }
}

// MODIFICATION 4: Récupération des services depuis Supabase
async function fetchServicesFromSupabase() {
    if (!supabaseClient) return null;
    
    try {
        console.log('📡 Récupération des services depuis Supabase...');
        
        const { data, error } = await supabaseClient
            .from('services')
            .select('*')
            .eq('status', 'actif')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            console.log(`✅ ${data.length} services récupérés depuis Supabase`);
            return data.map(service => transformSupabaseToService(service));
        }
        
        return [];
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des services:', error);
        return null;
    }
}

// MODIFICATION 5: Transformation des données Supabase vers format service
function transformSupabaseToService(service) {
    // Déterminer la catégorie
    let category = determineServiceCategory(service);
    
    return {
        id: service.id,
        title: service.titre || service.title,
        category: category,
        price: service.prix || service.price || 0,
        currency: service.devise || 'XOF',
        description: service.description || '',
        provider: service.prestataire || service.provider || service.nom_vendeur,
        location: service.localisation || service.location,
        region: service.region,
        phone: service.telephone || service.phone,
        availability: service.disponibilite || service.availability || '48h',
        rating: service.note || service.rating || 4.5,
        reviews: service.nombre_avis || service.reviews || 0,
        certified: service.certifie || service.certified || false,
        urgent: service.urgent || false,
        created_at: service.created_at,
        image_url: service.image_principale || service.image_url
    };
}

// MODIFICATION 6: Détermination de la catégorie du service
function determineServiceCategory(service) {
    const categorie = service.categorie || service.category || '';
    const title = (service.titre || service.title || '').toLowerCase();
    const description = (service.description || '').toLowerCase();
    const searchText = title + ' ' + description;
    
    if (categorie === 'veterinaire' || searchText.includes('vétérinaire') || searchText.includes('veterinaire') || searchText.includes('clinique')) {
        return 'veterinaire';
    }
    if (categorie === 'transport' || searchText.includes('transport') || searchText.includes('livraison')) {
        return 'transport';
    }
    if (categorie === 'alimentation' || searchText.includes('aliment') || searchText.includes('nutrition')) {
        return 'alimentation';
    }
    if (categorie === 'conseil' || searchText.includes('conseil') || searchText.includes('formation') || searchText.includes('audit')) {
        return 'conseil';
    }
    if (categorie === 'abattage' || searchText.includes('abattage') || searchText.includes('transformation')) {
        return 'abattage';
    }
    if (categorie === 'maintenance' || searchText.includes('maintenance') || searchText.includes('réparation')) {
        return 'maintenance';
    }
    
    return 'conseil'; // Par défaut
}

// ============================================================================
// DONNÉES DES SERVICES (LOCALES - FALLBACK)
// ============================================================================

function getServicesData() {
    return [
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

// MODIFICATION 7: Initialisation asynchrone avec Supabase
async function initializeServicesPage() {
    console.log('🚀 Initialisation de la page Services...');
    
    // Afficher l'indicateur de chargement
    showLoadingIndicator();

    try {
        // 1. Initialiser Supabase
        await initSupabase();
        
        // 2. Charger les données
        await loadServicesData();
        
        // 3. Configurer les événements
        setupCategoryEvents();
        setupFilterEvents();
        setupSearchEvents();
        setupLoadMoreEvents();
        
        // 4. Appliquer les filtres initiaux
        applyFilters();
        
        // 5. Afficher les résultats
        displayServices();
        
        // 6. Afficher les services vedettes
        displayFeaturedServices();
        
        // Afficher le statut de connexion
        showConnectionStatus();
        
        console.log(`✅ Page Services initialisée avec ${allServices.length} services`);
        console.log(`📡 Statut Supabase: ${isUsingSupabase ? 'Connecté' : 'Hors ligne'}`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement des services');
    } finally {
        hideLoadingIndicator();
    }
}

// MODIFICATION 8: Chargement des données avec priorité Supabase
async function loadServicesData() {
    // Tenter de charger depuis Supabase
    if (isUsingSupabase) {
        const supabaseData = await fetchServicesFromSupabase();
        if (supabaseData && supabaseData.length > 0) {
            allServices = supabaseData;
            console.log(`✅ ${allServices.length} services chargés depuis Supabase`);
            
            // Mettre à jour le cache local
            localStorage.setItem('services_data', JSON.stringify(allServices));
            return;
        }
    }
    
    // Fallback: Charger depuis localStorage
    const cachedData = localStorage.getItem('services_data');
    if (cachedData) {
        try {
            allServices = JSON.parse(cachedData);
            console.log(`💾 ${allServices.length} services chargés depuis le cache`);
            return;
        } catch (e) {
            console.warn('Erreur lors du chargement du cache');
        }
    }
    
    // Dernier recours: Données par défaut
    allServices = getServicesData();
    console.log(`📋 ${allServices.length} services chargés depuis les données par défaut`);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('services_data', JSON.stringify(allServices));
}

function showLoadingIndicator() {
    const container = document.getElementById('services-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: #006837;"></i>
                <p>Chargement des services...</p>
            </div>
        `;
    }
}

function hideLoadingIndicator() {
    // L'indicateur sera remplacé par le contenu réel
}

function showConnectionStatus() {
    if (isUsingSupabase) {
        console.log('📡 Mode: Connecté à Supabase (services en ligne)');
    } else {
        console.log('📴 Mode: Hors ligne (services locaux)');
    }
}

// ============================================================================
// FONCTIONS D'AFFICHAGE
// ============================================================================

function displayServices() {
    const container = document.getElementById('services-container');
    if (!container) {
        console.warn('⚠️ Conteneur des services non trouvé');
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const servicesToShow = filteredServices.slice(startIndex, endIndex);

    container.innerHTML = '';

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

    servicesToShow.forEach(service => {
        const card = createServiceCard(service);
        container.appendChild(card);
    });

    updateResultsCount();
    const hasMore = endIndex < filteredServices.length;
    updateLoadMoreButton(hasMore);

    console.log(`📋 Affichage de ${servicesToShow.length} services (page ${currentPage})`);
}

function displayFeaturedServices() {
    const container = document.getElementById('featured-container');
    if (!container) return;

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

function createServiceCard(service) {
    const card = document.createElement('div');
    card.className = 'service-card';

    const formattedPrice = `${service.price.toLocaleString()} ${service.currency}`;

    card.innerHTML = `
        <div class="service-header">
            <div class="service-icon">
                <i class="fas ${getServiceIcon(service.category)}"></i>
            </div>
            <h3 class="service-title">${SERVICE_CATEGORIES[service.category] || service.category}</h3>
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

    const contactBtn = card.querySelector('.contact-btn');
    const detailsBtn = card.querySelector('.details-btn');

    contactBtn.addEventListener('click', () => contactServiceProvider(service));
    detailsBtn.addEventListener('click', () => showServiceDetails(service));

    return card;
}

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

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let stars = '';

    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star" style="color: #ffc107;"></i>';
    }

    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
    }

    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star" style="color: #ffc107;"></i>';
    }

    return stars;
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
}

function getAvailabilityText(availability) {
    const texts = {
        'immediate': 'Immédiat',
        '24h': '24h',
        '48h': '48h',
        'week': 'Semaine'
    };
    return texts[availability] || availability;
}

function updateResultsCount() {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = filteredServices.length.toLocaleString();
    }
}

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

function setupCategoryEvents() {
    const categoryButtons = document.querySelectorAll('.service-category-btn');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            currentPage = 1;
            applyFilters();
        });
    });

    console.log('✅ Événements des catégories configurés');
}

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

function setupSearchEvents() {
    const searchInput = document.getElementById('search-input');

    if (searchInput) {
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

function setupLoadMoreEvents() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            displayServices();
            window.scrollTo({ top: document.querySelector('.services-section')?.offsetTop || 0, behavior: 'smooth' });
        });
    }

    console.log('✅ Événements du bouton "charger plus" configurés');
}

function applyFilters() {
    console.log('🔍 Application des filtres:', currentFilters);

    filteredServices = allServices.filter(service => {
        const categoryMatch = currentCategory === 'all' || service.category === currentCategory;
        
        const searchMatch = currentFilters.search === '' ||
            (service.title || '').toLowerCase().includes(currentFilters.search) ||
            (service.description || '').toLowerCase().includes(currentFilters.search) ||
            (service.provider || '').toLowerCase().includes(currentFilters.search) ||
            (service.location || '').toLowerCase().includes(currentFilters.search);
        
        const regionMatch = currentFilters.region === '' || service.region === currentFilters.region;
        
        let priceMatch = true;
        if (currentFilters.priceMin) {
            priceMatch = priceMatch && service.price >= parseInt(currentFilters.priceMin);
        }
        if (currentFilters.priceMax) {
            priceMatch = priceMatch && service.price <= parseInt(currentFilters.priceMax);
        }
        
        const availabilityMatch = currentFilters.availability === '' ||
            service.availability === currentFilters.availability;
        
        return categoryMatch && searchMatch && regionMatch && priceMatch && availabilityMatch;
    });

    sortServices();
    displayServices();

    console.log(`📊 Filtres appliqués: ${filteredServices.length}/${allServices.length} services affichés`);
}

function sortServices() {
    filteredServices.sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        if (a.rating !== b.rating) return b.rating - a.rating;
        return new Date(b.created_at) - new Date(a.created_at);
    });
}

// ============================================================================
// FONCTIONS D'INTERACTION
// ============================================================================

function contactServiceProvider(service) {
    console.log(`📱 Contact WhatsApp du prestataire pour: ${service.title}`);

    const phone = service.phone || '221770000000';
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone;

    const message = encodeURIComponent(
        `Bonjour, je suis intéressé(e) par votre service "${service.title}" à ${service.price.toLocaleString()} ${service.currency} sur Sénégal Élevage. Pouvez-vous me donner plus d'informations ?`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    saveServiceRequest(service);
}

function showServiceDetails(service) {
    console.log(`📋 Affichage des détails pour: ${service.title}`);

    const details = `
        🤝 ${service.title}
        
        📝 Description: ${service.description}
        
        🏷️ Catégorie: ${SERVICE_CATEGORIES[service.category] || service.category}
        
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
            timestamp: new Date().toISOString(),
            synced: isUsingSupabase
        };

        requests.unshift(newRequest);
        if (requests.length > 100) requests.splice(100);
        localStorage.setItem('service_requests', JSON.stringify(requests));
        console.log('💾 Demande de service sauvegardée localement');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la demande:', error);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    console.log('🔔 Notification affichée:', message);
}

function showError(message) {
    showNotification(message, 'error');
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

window.ServicesManager = {
    getServices: () => [...allServices],
    getFilteredServices: () => [...filteredServices],
    getCurrentCategory: () => currentCategory,
    getCurrentFilters: () => ({ ...currentFilters }),
    refreshServices: () => applyFilters(),
    contactProvider: contactServiceProvider,
    showDetails: showServiceDetails,
    isOnline: () => isUsingSupabase
};

document.addEventListener('DOMContentLoaded', initializeServicesPage);

console.log('✅ Script services.js chargé - Prêt pour la page services');
console.log(`🔗 Connexion Supabase configurée avec l'URL: ${SUPABASE_URL}`);