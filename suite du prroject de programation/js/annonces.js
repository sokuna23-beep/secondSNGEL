// File: annonces.js
// Description: Script pour la page des annonces de Sénégal Élevage
// Gestion de l'affichage, du filtrage, de la recherche et de la pagination des annonces

// ============================================================================
// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// Le client est déjà initialisé dans js/supabase-config.js et disponible via window.supabaseClient
// Si non, on tente de le récupérer via window.supabase si la lib est chargée
let supabase = window.supabaseClient || (window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);

if (supabase) {
    console.log('✅ Connexion à la base de données établie pour les annonces (via config centralisée)');
} else {
    console.warn('⚠️ Client Supabase non trouvé. Assurez-vous que js/supabase-config.js est chargé.');
}

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

// Variables pour la gestion des annonces
let allAnnonces = [];
let filteredAnnonces = [];
let currentPage = 1;
let annoncesPerPage = 12;

// Variables pour les filtres et la recherche
let currentFilters = {
    search: '',
    type: '',
    region: '',
    sort: 'recent'
};

// ============================================================================
// FONCTIONS D'INTERACTION AVEC LA BASE DE DONNÉES
// ============================================================================

/**
 * Récupère toutes les annonces actives depuis la base de données Supabase
 */
async function fetchAllAnnonces() {
    if (!supabase) {
        console.log('📴 Mode hors ligne: utilisation des données par défaut');
        return getDefaultAnnonces();
    }

    try {
        console.log('🔍 Récupération de toutes les annonces depuis la base de données...');

        const { data, error } = await supabase
            .from('annonces')
            .select('*')
            .eq('status', 'actif')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erreur lors de la récupération des annonces:', error);
            return getDefaultAnnonces();
        }

        console.log(`✅ ${data.length} annonces récupérées avec succès`);
        return data || [];

    } catch (error) {
        console.error('❌ Exception lors de l\'accès à la base de données:', error);
        return getDefaultAnnonces();
    }
}

// ============================================================================
// FONCTIONS DE FILTRAGE ET DE RECHERCHE
// ============================================================================

/**
 * Applique les filtres et la recherche aux annonces
 */
function applyFilters() {
    let filtered = [...allAnnonces];

    // Filtrage par recherche
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filtered = filtered.filter(annonce =>
            annonce.titre.toLowerCase().includes(searchTerm) ||
            annonce.description.toLowerCase().includes(searchTerm) ||
            annonce.localisation.toLowerCase().includes(searchTerm) ||
            (annonce.region && annonce.region.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrage par type
    if (currentFilters.type) {
        filtered = filtered.filter(annonce =>
            annonce.categorie === currentFilters.type ||
            annonce.type_annonce === currentFilters.type
        );
    }

    // Filtrage par région
    if (currentFilters.region) {
        filtered = filtered.filter(annonce =>
            annonce.region === currentFilters.region
        );
    }

    // Tri des résultats
    switch (currentFilters.sort) {
        case 'recent':
            filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
        case 'prix-asc':
            filtered.sort((a, b) => (a.prix || 0) - (b.prix || 0));
            break;
        case 'prix-desc':
            filtered.sort((a, b) => (b.prix || 0) - (a.prix || 0));
            break;
        case 'populaire':
            filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
    }

    filteredAnnonces = filtered;
    return filtered;
}

/**
 * Met à jour les filtres actuels et rafraîchit l'affichage
 */
function updateFilter(filterType, value) {
    currentFilters[filterType] = value;
    currentPage = 1;
    applyFilters();
    displayAnnonces();
    updatePagination();
}

// ============================================================================
// FONCTIONS D'AFFICHAGE
// ============================================================================

/**
 * Affiche les annonces dans la grille
 */
function displayAnnonces() {
    const container = document.querySelector('.listings-grid');
    if (!container) {
        console.warn('⚠️ Conteneur des annonces non trouvé');
        return;
    }

    const startIndex = (currentPage - 1) * annoncesPerPage;
    const endIndex = startIndex + annoncesPerPage;
    const annoncesToDisplay = filteredAnnonces.slice(startIndex, endIndex);

    container.innerHTML = '';

    if (annoncesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="error-state" style="grid-column: 1/-1;">
                <i class="fas fa-search"></i>
                <h3>Aucune annonce trouvée</h3>
                <p>Essayez de modifier vos filtres ou votre recherche</p>
            </div>
        `;
        return;
    }

    annoncesToDisplay.forEach(annonce => {
        const card = createAnnonceCard(annonce);
        container.appendChild(card);
    });

    console.log(`📋 Affichage de ${annoncesToDisplay.length} annonces (page ${currentPage})`);
}

/**
 * Crée une carte d'annonce HTML à partir des données
 */
function createAnnonceCard(annonce) {
    const card = document.createElement('div');
    card.className = 'listing-card';
    // Assigner l'ID de l'annonce au dataset pour les fonctions de mise en évidence
    if (typeof annonce.id !== 'undefined') card.dataset.id = annonce.id;

    // Ajouter une classe spéciale si c'est une nouvelle annonce
    const createdAt = new Date(annonce.created_at);
    const now = new Date();
    const diffSeconds = (now - createdAt) / 1000;

    if (diffSeconds < 5) {
        card.classList.add('new-announcement');
    }

    // Déterminer l'icône en fonction du type d'annonce
    let icon = '';
    if (annonce.categorie === 'materiaux' || annonce.type_annonce === 'materiel') icon = '🔧';
    if (annonce.categorie === 'animaux') icon = '🐄';
    if (annonce.categorie === 'produits') icon = '🥛';

    const prix = annonce.prix ? `${annonce.prix.toLocaleString()} ${annonce.devise || 'XOF'}` : 'Prix sur demande';

    card.innerHTML = `
        <img src="${annonce.image_principale || 'assets/images/placeholder.svg'}" 
             alt="${annonce.titre}" 
             class="listing-image"
             onerror="this.src='assets/images/placeholder.svg'">
        
        <div class="listing-content">
            <h3 class="listing-title">${annonce.titre}</h3>
            <p class="listing-description">${truncateText(annonce.description, 80)}</p>
            
            <div class="listing-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${annonce.localisation}</span>
                <span><i class="fas fa-tag"></i> ${prix}</span>
            </div>

            <div class="listing-tags">
                <span class="tag tag-type">${icon} ${getCategorieLabel(annonce.categorie)}</span>
                <span class="tag tag-status">${annonce.status}</span>
            </div>
            
            <a href="annonce-details.html?id=${annonce.id}" class="btn btn-outline" style="width:100%; margin-top:1rem; padding: 0.5rem;">
                Voir détails
            </a>
        </div>
    `;

    card.addEventListener('click', () => {
        console.log(`🔗 Clic sur l'annonce: ${annonce.titre} (ID: ${annonce.id})`);
    });

    return card;
}

/**
 * Met à jour la pagination
 */
function updatePagination() {
    const totalPages = Math.ceil(filteredAnnonces.length / annoncesPerPage);
    const paginationContainer = document.querySelector('.pagination');

    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    paginationContainer.innerHTML = '';

    // Bouton précédent
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayAnnonces();
            updatePagination();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Numéros de page
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                displayAnnonces();
                updatePagination();
            });
            paginationContainer.appendChild(pageBtn);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        }
    }

    // Bouton suivant
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayAnnonces();
            updatePagination();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Tronque un texte à une longueur spécifique
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

/**
 * Retourne le libellé d'une catégorie
 */
function getCategorieLabel(categorie) {
    const labels = {
        'materiaux': 'Matériel',
        'animaux': 'Animaux',
        'produits': 'Produits',
        'services': 'Services',
        'materiel': 'Matériel'
    };
    return labels[categorie] || categorie;
}

/**
 * Données par défaut lorsque la base de données n'est pas disponible
 */
function getDefaultAnnonces() {
    // Générer des annonces par défaut à partir des images présentes dans uploads/images/
    const uploadImages = [
        'BoucSahéliende18mois.jpg',
        'BélierTouabirepur.jpg',
        'Chameau mâure de 4 ans.jpg',
        'Génisse Montbéliarde de 20 mois.jpg',
        'Lot de 10 brebis Djallonké.jpg',
        'Moutonsbienengraissés.jpg',
        'VacheGyrlaitièrepure1.jpg'
    ];

    const generatedFromUploads = uploadImages.map((name, idx) => ({
        id: 1000 + idx,
        titre: name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
        description: 'Annonce par défaut — ' + name.replace(/\.[^.]+$/, ''),
        categorie: 'animaux',
        prix: null,
        devise: 'XOF',
        localisation: 'Dakar',
        region: 'dakar',
        status: 'actif',
        image_principale: `uploads/images/${name}`,
        nom_vendeur: 'Sénégal Élevage',
        prix_negociable: false,
        annonce_urgente: false,
        views: 0,
        created_at: new Date(Date.now() - (idx + 5) * 24 * 60 * 60 * 1000).toISOString()
    }));

    return [
        ...generatedFromUploads,
        {
            id: 1,
            titre: "Abreuvoirs automatiques pour bétail",
            description: "Abreuvoirs de haute qualité, faciles à installer et à entretenir. Parfaits pour les élevages modernes.",
            categorie: "materiaux",
            type_annonce: "materiel",
            prix: 25000,
            devise: "XOF",
            localisation: "Dakar",
            region: "dakar",
            status: "actif",
            image_principale: "assets/images/abreuvoir.jpg",
            nom_vendeur: "Aliou Diop",
            prix_negociable: true,
            annonce_urgente: false,
            views: 15,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            titre: "Poules pondeuses de race",
            description: "Poules pondeuses saines et productives, race locale adaptée au climat sénégalais.",
            categorie: "animaux",
            prix: 3500,
            devise: "XOF",
            localisation: "Kaolack",
            region: "kaolack",
            status: "actif",
            image_principale: "assets/images/Poules pondeuses.jpg",
            nom_vendeur: "Mame Fatou",
            prix_negociable: false,
            annonce_urgente: true,
            views: 32,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 3,
            titre: "Lait fermier biologique",
            description: "Lait de qualité premium, collecté quotidiennement auprès d'éleveurs locaux.",
            categorie: "produits",
            prix: 500,
            devise: "XOF",
            localisation: "Saint-Louis",
            region: "saintlouis",
            status: "actif",
            image_principale: "assets/images/Lait fermier biologique.jpg",
            nom_vendeur: "Ibrahim Sall",
            prix_negociable: true,
            annonce_urgente: false,
            views: 8,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
}

// ============================================================================
// FONCTIONS DE TRANSPORT D'ANNONCES
// ============================================================================

/**
 * Vérifie si une nouvelle annonce vient d'être publiée ou transportée
 */
function checkForNewAnnouncement() {
    const transportedAnnouncement = localStorage.getItem('transported_announcement');
    const announcementRedirected = localStorage.getItem('announcement_redirected');

    const urlParams = new URLSearchParams(window.location.search);
    const transportedParam = urlParams.get('transported') === 'true';
    const announcementId = urlParams.get('id');
    const source = urlParams.get('source');

    // Priorité 1: Annonce transportée via localStorage
    if (transportedAnnouncement && announcementRedirected === 'true') {
        console.log('📦 Annonce transportée détectée !');

        try {
            const announcementData = JSON.parse(transportedAnnouncement);

            allAnnonces.unshift(announcementData);
            filteredAnnonces = [...allAnnonces];

            showNotification('🚀 Votre annonce a été transportée avec succès !');

            displayAnnonces();
            updatePagination();

            setTimeout(() => {
                highlightTransportedAnnouncement(announcementData.id);
            }, 300);

        } catch (error) {
            console.error('❌ Erreur lors du traitement de l\'annonce transportée:', error);
            showNotification('Erreur lors du transport de l\'annonce !');
        }

        localStorage.removeItem('transported_announcement');
        localStorage.removeItem('announcement_redirected');

        window.history.replaceState({}, '', window.location.pathname);
        return;
    }

    // Vérifier les annonces récentes
    const recentAnnonces = JSON.parse(localStorage.getItem('recent_annonces') || '[]');
    if (recentAnnonces.length > 0 && transportedParam && source === 'create') {
        console.log('📋 Récupération des annonces récentes...');

        recentAnnonces.forEach(annonce => {
            if (!allAnnonces.find(a => a.id === annonce.id)) {
                allAnnonces.unshift(annonce);
            }
        });

        filteredAnnonces = [...allAnnonces];
        displayAnnonces();
        updatePagination();

        if (announcementId) {
            setTimeout(() => {
                highlightTransportedAnnouncement(parseInt(announcementId));
            }, 500);
        }

        showNotification('📋 Annonces récentes chargées avec succès !');
    }

    // Ancien système pour compatibilité
    const newAnnouncement = localStorage.getItem('new_announcement');
    const justPublished = localStorage.getItem('just_published');
    const highlightId = localStorage.getItem('highlight_announcement_id');
    const highlightParam = urlParams.get('highlight');
    const isNewParam = urlParams.get('new') === 'true';

    if (newAnnouncement && justPublished === 'true') {
        console.log('📣 Ancien système: Nouvelle annonce publiée détectée !');

        try {
            const announcementData = JSON.parse(newAnnouncement);
            allAnnonces.unshift(announcementData);
            filteredAnnonces = [...allAnnonces];

            showNotification('🎉 Votre annonce a été publiée avec succès !');
            displayAnnonces();
            updatePagination();

            if (highlightId || highlightParam) {
                setTimeout(() => {
                    highlightAnnouncement(highlightId || highlightParam);
                }, 500);
            }

        } catch (error) {
            console.error('❌ Erreur lors du traitement de la nouvelle annonce:', error);
            showNotification('Nouvelle annonce disponible !');
        }

        localStorage.removeItem('new_announcement');
        localStorage.removeItem('just_published');
        localStorage.removeItem('highlight_announcement_id');
    }

    else if (highlightParam && isNewParam) {
        setTimeout(() => {
            highlightAnnouncement(highlightParam);
        }, 1000);
    }
}

/**
 * Met en évidence une annonce transportée spécifiquement
 */
function highlightTransportedAnnouncement(announcementId) {
    console.log(`🎯 Mise en évidence de l'annonce transportée: ${announcementId}`);

    setTimeout(() => {
        const cards = document.querySelectorAll('.listing-card');
        cards.forEach(card => {
            const cardId = card.dataset.id;
            const title = card.querySelector('.listing-title');

            if ((cardId && cardId == announcementId) ||
                (title && title.textContent.includes('NOUVEAU'))) {

                console.log('✅ Carte d\'annonce transportée trouvée');

                card.classList.add('transported-announcement');

                card.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                card.style.animation = 'transport-pulse 4s ease-in-out';

                showNotification('🚀 Votre annonce transportée est mise en évidence !');

                const badge = document.createElement('div');
                badge.className = 'transported-badge';
                badge.innerHTML = '🚀 TRANSPORTÉE';
                card.appendChild(badge);
            }
        });
    }, 200);
}

/**
 * Met en évidence une annonce spécifique
 */
function highlightAnnouncement(announcementId) {
    console.log(`🎯 Recherche de l'annonce à mettre en évidence: ${announcementId}`);

    const targetAnnonce = allAnnonces.find(annonce =>
        annonce.id == announcementId ||
        annonce.id == parseInt(announcementId)
    );

    if (targetAnnonce) {
        console.log(`✅ Annonce trouvée: ${targetAnnonce.titre}`);

        setTimeout(() => {
            const cards = document.querySelectorAll('.listing-card');
            cards.forEach(card => {
                const title = card.querySelector('.listing-title');
                if (title && title.textContent === targetAnnonce.titre) {
                    console.log('🎯 Mise en évidence de la carte trouvée');

                    card.classList.add('highlighted-announcement');

                    card.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    card.style.animation = 'pulse-highlight 3s ease-in-out';

                    showNotification('📍 Votre annonce est mise en évidence ci-dessous');

                    const newUrl = window.location.pathname;
                    window.history.replaceState({}, '', newUrl);
                }
            });
        }, 100);
    } else {
        console.warn(`⚠️ Annonce ID ${announcementId} non trouvée dans la liste`);
    }
}

/**
 * Affiche une notification à l'utilisateur
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-bell"></i>
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
 * Configure les événements pour les filtres
 */
function setupFilterEvents() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            updateFilter('search', e.target.value);
        });
    }

    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const filterType = e.target.dataset.filter;
            updateFilter(filterType, e.target.value);
        });
    });
}

/**
 * Configure le bouton "Charger plus"
 */
function setupLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-section button');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            displayAnnonces();
            updatePagination();

            const totalPages = Math.ceil(filteredAnnonces.length / annoncesPerPage);
            if (currentPage >= totalPages) {
                loadMoreBtn.style.display = 'none';
            }
        });
    }
}

// ============================================================================
// INITIALISATION
// ============================================================================

/**
 * Initialise la page des annonces
 */
async function initializePage() {
    console.log('🚀 Initialisation de la page des annonces...');

    try {
        // 1. Vérifier si une nouvelle annonce vient d'être publiée
        checkForNewAnnouncement();

        // 2. Récupérer les annonces depuis la base de données locale en priorité
        let localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        if (!localAnnonces || localAnnonces.length === 0) {
            // Si aucune annonce locale, initialiser avec les annonces par défaut (générées à partir des images)
            const defaults = getDefaultAnnonces();
            try {
                localStorage.setItem('local_annonces', JSON.stringify(defaults));
                console.log(`💾 Aucune annonce locale trouvée — initialisation avec ${defaults.length} annonces par défaut`);
            } catch (err) {
                console.warn('⚠️ Impossible d\'écrire dans localStorage:', err);
            }
            localAnnonces = defaults;
        } else {
            console.log(`💾 ${localAnnonces.length} annonces trouvées dans la base de données locale`);
        }
        allAnnonces = [...localAnnonces];

        // 3. Ajouter les annonces transportées récentes
        const recentAnnonces = JSON.parse(localStorage.getItem('recent_annonces') || '[]');
        if (recentAnnonces.length > 0) {
            console.log(`📦 ${recentAnnonces.length} annonces récentes trouvées`);

            // Fusionner avec les annonces locales sans doublons
            recentAnnonces.forEach(recentAnnonce => {
                if (!allAnnonces.find(a => a.id === recentAnnonce.id)) {
                    allAnnonces.unshift(recentAnnonce);
                }
            });
        }

        // 4. Essayer de récupérer depuis la base de données Supabase (si disponible)
        try {
            const dbAnnonces = await fetchAllAnnonces();
            if (dbAnnonces && dbAnnonces.length > 0) {
                console.log(`🗄️ ${dbAnnonces.length} annonces récupérées depuis la base de données Supabase`);

                // Fusionner avec les annonces locales
                dbAnnonces.forEach(dbAnnonce => {
                    if (!allAnnonces.find(a => a.id === dbAnnonce.id)) {
                        allAnnonces.push(dbAnnonce);
                    }
                });

                // Trier par date (plus récent d'abord)
                allAnnonces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
        } catch (dbError) {
            console.warn('⚠️ Erreur base de données Supabase, utilisation des annonces locales:', dbError);
        }

        // 5. Si toujours aucune annonce, utiliser les données par défaut
        if (allAnnonces.length === 0) {
            console.log('📋 Aucune annonce trouvée, utilisation des données par défaut');
            allAnnonces = getDefaultAnnonces();
        }

        filteredAnnonces = [...allAnnonces];

        // 5. Configurer les événements de filtrage
        setupFilterEvents();

        // 6. Afficher les annonces initiales
        displayAnnonces();
        updatePagination();

        // 7. Configurer le bouton "Charger plus"
        setupLoadMore();

        console.log(`✅ Page des annonces initialisée avec ${allAnnonces.length} annonces`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page:', error);
        const container = document.querySelector('.listings-grid');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erreur de chargement</h3>
                    <p>Impossible de charger les annonces. Veuillez réessayer plus tard.</p>
                    <button onclick="location.reload()" class="btn btn-primary">Réessayer</button>
                </div>
            `;
        }
    }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializePage);

/**
 * Synchronise les annonces locales avec la base de données (pour future utilisation)
 */
async function syncLocalAnnoncesWithDatabase() {
    if (!supabase) {
        console.log('⚠️ Base de données non disponible, synchronisation impossible');
        return false;
    }

    try {
        const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');

        if (localAnnonces.length === 0) {
            console.log('📋 Aucune annonce locale à synchroniser');
            return true;
        }

        console.log(`🔄 Synchronisation de ${localAnnonces.length} annonces locales avec la base de données...`);

        let syncedCount = 0;

        for (const annonce of localAnnonces) {
            if (annonce.source === 'local') {
                try {
                    // Insérer l'annonce dans la base de données
                    const { data, error } = await supabase
                        .from('annonces')
                        .insert([annonce])
                        .select();

                    if (error) throw error;

                    // Marquer comme synchronisée
                    annonce.source = 'database';
                    annonce.database_id = data[0].id;
                    syncedCount++;

                    console.log(`✅ Annonce synchronisée: ${annonce.titre}`);

                } catch (error) {
                    console.error(`❌ Erreur synchronisation de ${annonce.titre}:`, error);
                }
            }
        }

        // Mettre à jour le localStorage avec les annonces synchronisées
        localStorage.setItem('local_annonces', JSON.stringify(localAnnonces));

        console.log(`🎉 ${syncedCount}/${localAnnonces.length} annonces synchronisées avec succès`);

        if (syncedCount > 0) {
            showNotification(`🎉 ${syncedCount} annonce(s) synchronisée(s) avec la base de données !`);
        }

        return syncedCount > 0;

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
        showNotification('❌ Erreur lors de la synchronisation avec la base de données');
        return false;
    }
}

/**
 * Exporte les annonces locales vers un fichier JSON
 */
function exportLocalAnnonces() {
    const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');

    if (localAnnonces.length === 0) {
        showNotification('📋 Aucune annonce locale à exporter');
        return;
    }

    const dataStr = JSON.stringify(localAnnonces, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `annonces_locales_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    console.log(`📤 Export de ${localAnnonces.length} annonces locales`);
    showNotification(`📤 ${localAnnonces.length} annonces exportées`);
}

// Exporter des fonctions pour un usage global
window.AnnoncesManager = {
    refreshAnnonces: fetchAllAnnonces,
    updateFilter: updateFilter,
    getAnnonceById: (id) => allAnnonces.find(a => a.id == id),
    databaseStatus: () => supabase ? 'connecté' : 'hors ligne',
    syncWithDatabase: syncLocalAnnoncesWithDatabase,
    exportAnnonces: exportLocalAnnonces,
    getLocalAnnonces: () => JSON.parse(localStorage.getItem('local_annonces') || '[]'),
    clearLocalAnnonces: () => localStorage.removeItem('local_annonces')
};

console.log('✅ Script annonces.js chargé - Prêt pour la base de données');
