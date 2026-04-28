// File: annonces.js
// Description: Script pour la page des annonces de Sénégal Élevage
// Gestion de l'affichage, du filtrage, de la recherche et de la pagination des annonces

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Définition directe des variables Supabase pour plus de fiabilité
// Configuration de la connexion à la base de données Supabase
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co'; // URL du projet Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag'; // Clé publique pour l'accès anonyme

// MODIFICATION 2: Initialisation plus robuste du client Supabase
// Le client est initialisé directement avec nos variables
let supabase = null;

// Initialisation du client Supabase
try {
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
        supabase = window.supabaseClient;
        console.log('✅ Connexion à la base de données via client centralisé');
    } else if (typeof supabase !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Connexion à la base de données via création directe');
    } else {
        console.warn('⚠️ Client Supabase non trouvé. Vérifiez l\'inclusion de la bibliothèque Supabase.');
    }
} catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du client Supabase:', error);
}

// MODIFICATION 3: Ajout d'une fonction pour vérifier l'état de la connexion
function isSupabaseAvailable() {
    return supabase !== null;
}

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

// Variables pour la gestion des annonces
let allAnnonces = [];
let filteredAnnonces = [];
let currentPage = 1;
let annoncesPerPage = 12;
let isLoading = false;

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

// MODIFICATION 4: Amélioration de la fonction fetchAllAnnonces
/**
 * Récupère toutes les annonces actives depuis la base de données Supabase
 */
async function fetchAllAnnonces() {
    if (!isSupabaseAvailable()) {
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
        
        // MODIFICATION 5: Transformation des données pour compatibilité
        // Assurer la compatibilité avec les noms de champs existants
        const transformedData = data.map(annonce => ({
            ...annonce,
            // S'assurer que les champs attendus existent
            titre: annonce.titre || annonce.title,
            description: annonce.description || '',
            prix: annonce.prix || annonce.price,
            devise: annonce.devise || 'XOF',
            localisation: annonce.localisation || annonce.location,
            region: annonce.region,
            categorie: annonce.categorie,
            image_principale: annonce.image_principale || annonce.main_image,
            nom_vendeur: annonce.nom_vendeur || annonce.seller_name,
            created_at: annonce.created_at,
            views: annonce.views || 0
        }));
        
        return transformedData || [];

    } catch (error) {
        console.error('❌ Exception lors de l\'accès à la base de données:', error);
        return getDefaultAnnonces();
    }
}

// MODIFICATION 6: Nouvelle fonction pour insérer une annonce dans Supabase
/**
 * Insère une nouvelle annonce dans la base de données Supabase
 * @param {Object} annonceData - Données de l'annonce à insérer
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function insertAnnonceInSupabase(annonceData) {
    if (!isSupabaseAvailable()) {
        console.warn('⚠️ Supabase non disponible, insertion locale uniquement');
        return { success: false, error: 'Base de données non disponible' };
    }

    try {
        console.log('📝 Insertion de l\'annonce dans Supabase...');
        
        const { data, error } = await supabase
            .from('annonces')
            .insert([{
                titre: annonceData.titre,
                description: annonceData.description,
                prix: annonceData.prix,
                devise: annonceData.devise || 'XOF',
                categorie: annonceData.categorie,
                localisation: annonceData.localisation,
                region: annonceData.region,
                image_principale: annonceData.image_principale,
                nom_vendeur: annonceData.nom_vendeur,
                telephone: annonceData.telephone,
                status: 'actif',
                views: 0,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        
        console.log('✅ Annonce insérée avec succès dans Supabase');
        return { success: true, data: data[0] };
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion:', error);
        return { success: false, error: error.message };
    }
}

// MODIFICATION 7: Nouvelle fonction pour mettre à jour une annonce
/**
 * Met à jour une annonce dans Supabase
 * @param {number} annonceId - ID de l'annonce
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function updateAnnonceInSupabase(annonceId, updateData) {
    if (!isSupabaseAvailable()) {
        return { success: false, error: 'Base de données non disponible' };
    }

    try {
        const { data, error } = await supabase
            .from('annonces')
            .update(updateData)
            .eq('id', annonceId)
            .select();

        if (error) throw error;
        
        console.log(`✅ Annonce ${annonceId} mise à jour dans Supabase`);
        return { success: true, data: data[0] };
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        return { success: false, error: error.message };
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
            (annonce.titre || '').toLowerCase().includes(searchTerm) ||
            (annonce.description || '').toLowerCase().includes(searchTerm) ||
            (annonce.localisation || '').toLowerCase().includes(searchTerm) ||
            (annonce.region || '').toLowerCase().includes(searchTerm)
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
    
    // MODIFICATION 8: Amélioration de la gestion des images
    let imageUrl = annonce.image_principale || annonce.image || 'assets/images/placeholder.svg';
    // Vérifier si l'URL est valide
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/') && !imageUrl.startsWith('assets')) {
        imageUrl = 'assets/images/placeholder.svg';
    }

    card.innerHTML = `
        <img src="${imageUrl}" 
             alt="${annonce.titre || 'Annonce'}" 
             class="listing-image"
             onerror="this.src='assets/images/placeholder.svg'">
        
        <div class="listing-content">
            <h3 class="listing-title">${annonce.titre || 'Sans titre'}</h3>
            <p class="listing-description">${truncateText(annonce.description || '', 80)}</p>
            
            <div class="listing-meta">
                <span><i class="fas fa-map-marker-alt"></i> ${annonce.localisation || 'Sénégal'}</span>
                <span><i class="fas fa-tag"></i> ${prix}</span>
            </div>

            <div class="listing-tags">
                <span class="tag tag-type">${icon} ${getCategorieLabel(annonce.categorie)}</span>
                <span class="tag tag-status">${annonce.status || 'actif'}</span>
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        'materiel': 'Matériel',
        'bétail': 'Bétail',
        'volaille': 'Volaille',
        'équipement': 'Équipement'
    };
    return labels[categorie] || categorie || 'Autre';
}

// MODIFICATION 9: Amélioration des données par défaut
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
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                updateFilter('search', e.target.value);
            }, 300);
        });
    }

    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', (e) => {
            const filterType = e.target.dataset.filter;
            if (filterType) {
                updateFilter(filterType, e.target.value);
            }
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
        // 1. Afficher un indicateur de chargement
        const container = document.querySelector('.listings-grid');
        if (container) {
            container.innerHTML = `
                <div class="loading-state" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 40px;"></i>
                    <p>Chargement des annonces...</p>
                </div>
            `;
        }

        // 2. Vérifier si une nouvelle annonce vient d'être publiée
        checkForNewAnnouncement();

        // 3. Essayer de récupérer depuis la base de données Supabase (si disponible)
        let dbAnnonces = [];
        if (isSupabaseAvailable()) {
            try {
                dbAnnonces = await fetchAllAnnonces();
                if (dbAnnonces && dbAnnonces.length > 0) {
                    console.log(`🗄️ ${dbAnnonces.length} annonces récupérées depuis Supabase`);
                }
            } catch (dbError) {
                console.warn('⚠️ Erreur base de données Supabase, utilisation des annonces locales:', dbError);
            }
        }

        // 4. Récupérer les annonces locales
        let localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        
        // 5. Fusionner les annonces (Supabase d'abord, puis locales sans doublons)
        if (dbAnnonces && dbAnnonces.length > 0) {
            allAnnonces = [...dbAnnonces];
            
            // Ajouter les annonces locales qui n'existent pas dans Supabase
            localAnnonces.forEach(localAnnonce => {
                if (!allAnnonces.find(a => a.id === localAnnonce.id)) {
                    allAnnonces.push(localAnnonce);
                }
            });
        } else if (localAnnonces.length > 0) {
            allAnnonces = [...localAnnonces];
            console.log(`💾 ${allAnnonces.length} annonces trouvées dans la base de données locale`);
        } else {
            // Si aucune annonce, utiliser les données par défaut
            console.log('📋 Aucune annonce trouvée, utilisation des données par défaut');
            allAnnonces = getDefaultAnnonces();
            // Sauvegarder les annonces par défaut dans localStorage
            localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
        }

        // 6. Ajouter les annonces transportées récentes
        const recentAnnonces = JSON.parse(localStorage.getItem('recent_annonces') || '[]');
        if (recentAnnonces.length > 0) {
            console.log(`📦 ${recentAnnonces.length} annonces récentes trouvées`);
            
            recentAnnonces.forEach(recentAnnonce => {
                if (!allAnnonces.find(a => a.id === recentAnnonce.id)) {
                    allAnnonces.unshift(recentAnnonce);
                }
            });
        }

        // 7. Trier par date (plus récent d'abord)
        allAnnonces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        filteredAnnonces = [...allAnnonces];

        // 8. Configurer les événements de filtrage
        setupFilterEvents();

        // 9. Afficher les annonces initiales
        displayAnnonces();
        updatePagination();

        // 10. Configurer le bouton "Charger plus"
        setupLoadMore();

        console.log(`✅ Page des annonces initialisée avec ${allAnnonces.length} annonces`);
        console.log(`📡 Statut Supabase: ${isSupabaseAvailable() ? 'Connecté' : 'Hors ligne'}`);

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
    if (!isSupabaseAvailable()) {
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
            if (annonce.source === 'local' || !annonce.id_supabase) {
                try {
                    const result = await insertAnnonceInSupabase(annonce);
                    if (result.success) {
                        annonce.source = 'database';
                        annonce.id_supabase = result.data.id;
                        syncedCount++;
                        console.log(`✅ Annonce synchronisée: ${annonce.titre}`);
                    }
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

// MODIFICATION 10: Sauvegarde périodique dans Supabase
/**
 * Sauvegarde périodique des nouvelles annonces dans Supabase
 */
async function periodicSyncToSupabase() {
    // Vérifier toutes les 5 minutes
    setInterval(async () => {
        if (isSupabaseAvailable()) {
            await syncLocalAnnoncesWithDatabase();
        }
    }, 5 * 60 * 1000);
}

// Démarrer la synchronisation périodique après initialisation
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        periodicSyncToSupabase();
    }, 10000); // Attendre 10 secondes après le chargement
});

// Exporter des fonctions pour un usage global
window.AnnoncesManager = {
    refreshAnnonces: fetchAllAnnonces,
    updateFilter: updateFilter,
    getAnnonceById: (id) => allAnnonces.find(a => a.id == id),
    databaseStatus: () => isSupabaseAvailable() ? 'connecté' : 'hors ligne',
    syncWithDatabase: syncLocalAnnoncesWithDatabase,
    exportAnnonces: exportLocalAnnonces,
    getLocalAnnonces: () => JSON.parse(localStorage.getItem('local_annonces') || '[]'),
    clearLocalAnnonces: () => localStorage.removeItem('local_annonces'),
    insertAnnonce: insertAnnonceInSupabase,
    updateAnnonce: updateAnnonceInSupabase
};

console.log('✅ Script annonces.js chargé - Prêt pour la base de données');
console.log('🔗 Connexion Supabase configurée avec l\'URL:', SUPABASE_URL);