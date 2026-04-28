/**
 * Fichier: annonce-details.js
 * Description: Script pour la page de détails d'annonce de Sénégal Élevage
 * Gestion de l'affichage des détails, du contact et du partage
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// MODIFICATION 1: Ajout de la configuration Supabase pour les annonces
// Configuration de la connexion à la base de données Supabase
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co'; // URL du projet Supabase
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag'; // Clé publique pour l'accès anonyme

// MODIFICATION 2: Variable globale pour le client Supabase
let supabaseClient = null;

// ============================================================================
// VARIABLES GLOBALES ET CONFIGURATION
// ============================================================================

// Variables pour la gestion de l'annonce
let currentAnnouncement = null;
let allAnnonces = [];
let similarAnnonces = [];
let isFavorite = false;

// Variables pour l'affichage des images
let currentImageIndex = 0;
let allImages = [];

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise la page de détails d'annonce
 */
async function initializeDetailsPage() {
    console.log('🚀 Initialisation de la page détails annonce...');

    try {
        // MODIFICATION 3: Initialiser Supabase d'abord
        // 0. Initialiser la connexion à Supabase
        await initSupabase();

        // 1. Récupérer l'ID de l'annonce depuis l'URL
        const announcementId = getAnnouncementIdFromUrl();

        if (!announcementId) {
            showError('Aucune annonce spécifiée');
            return;
        }

        // 2. Charger les données
        await loadAnnoncesData();

        // 3. Trouver et afficher l'annonce
        await loadAnnouncementDetails(announcementId);

        // 4. Configurer les événements
        setupModalEvents();
        setupImageEvents();
        setupActionEvents();

        console.log('✅ Page détails annonce initialisée');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showError('Erreur lors du chargement de l\'annonce');
    }
}

// MODIFICATION 4: Nouvelle fonction pour initialiser Supabase
/**
 * Initialise la connexion à la base de données Supabase
 * @returns {boolean} True si l'initialisation a réussi
 */
async function initSupabase() {
    try {
        // Vérifier si le client Supabase est disponible (script chargé)
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion à la base de données Supabase établie pour les annonces');
            return true;
        } else {
            console.warn('⚠️ Client Supabase non chargé, utilisation du localStorage uniquement');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        return false;
    }
}

/**
 * Récupère l'ID de l'annonce depuis les paramètres URL
 * @returns {string|null} ID de l'annonce
 */
function getAnnouncementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('annonce');
}

// MODIFICATION 5: Chargement des données depuis Supabase
/**
 * Charge les données des annonces depuis Supabase ou localStorage
 */
async function loadAnnoncesData() {
    try {
        let localAnnonces = [];
        let recentAnnonces = [];

        // Tenter de charger depuis Supabase d'abord
        if (supabaseClient) {
            console.log('📡 Chargement des annonces depuis Supabase...');
            const { data: supabaseData, error: supabaseError } = await supabaseClient
                .from('annonces')
                .select('*')
                .eq('status', 'actif')
                .order('created_at', { ascending: false });

            if (!supabaseError && supabaseData) {
                allAnnonces = supabaseData;
                console.log(`✅ ${allAnnonces.length} annonces chargées depuis Supabase`);
                
                // Mettre à jour localStorage pour le fallback
                localStorage.setItem('local_annonces', JSON.stringify(allAnnonces));
                return;
            } else {
                console.warn('⚠️ Erreur Supabase, fallback localStorage:', supabaseError);
            }
        }

        // Fallback: Charger depuis localStorage
        console.log('📦 Chargement des annonces depuis localStorage...');
        localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        recentAnnonces = JSON.parse(localStorage.getItem('recent_annonces') || '[]');

        // Fusionner les annonces sans doublons
        allAnnonces = [...localAnnonces];
        recentAnnonces.forEach(recent => {
            if (!allAnnonces.find(a => a.id === recent.id)) {
                allAnnonces.push(recent);
            }
        });

        // Trier par date
        allAnnonces.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        console.log(`📋 ${allAnnonces.length} annonces chargées depuis localStorage`);

    } catch (error) {
        console.error('❌ Erreur lors du chargement des annonces:', error);
        allAnnonces = [];
    }
}

/**
 * Charge et affiche les détails d'une annonce
 * @param {string} announcementId - ID de l'annonce à charger
 */
async function loadAnnouncementDetails(announcementId) {
    console.log(`🔍 Recherche de l'annonce ID: ${announcementId}`);

    // Masquer l'état de chargement
    const loadingState = document.getElementById('loading-state');
    if (loadingState) loadingState.style.display = 'none';

    // Trouver l'annonce
    currentAnnouncement = allAnnonces.find(annonce =>
        annonce.id == announcementId ||
        annonce.id == parseInt(announcementId)
    );

    if (!currentAnnouncement) {
        // Afficher l'état d'erreur
        const errorState = document.getElementById('error-state');
        if (errorState) errorState.style.display = 'block';
        return;
    }

    // Afficher les détails
    displayAnnouncementDetails();

    // Charger les annonces similaires
    loadSimilarAnnonces();

    // Vérifier si c'est un favori
    checkFavoriteStatus();

    // Incrémenter le nombre de vues
    await incrementViews();

    console.log('✅ Détails de l\'annonce affichés:', currentAnnouncement.titre || currentAnnouncement.title);
}

/**
 * Affiche les détails de l'annonce dans la page
 */
function displayAnnouncementDetails() {
    if (!currentAnnouncement) return;

    // Afficher la section des détails
    const errorState = document.getElementById('error-state');
    const detailsSection = document.getElementById('announcement-details');
    
    if (errorState) errorState.style.display = 'none';
    if (detailsSection) detailsSection.style.display = 'block';

    // Mettre à jour le fil d'Ariane
    updateBreadcrumb();

    // Mettre à jour les informations principales
    updateMainInfo();

    // Mettre à jour les images
    updateImages();

    // Mettre à jour les informations complémentaires
    updateAdditionalInfo();

    // Mettre à jour les informations du vendeur
    updateSellerInfo();
}

/**
 * Met à jour le fil d'Ariane
 */
function updateBreadcrumb() {
    const category = currentAnnouncement.categorie || currentAnnouncement.category || 'Autre';
    const title = currentAnnouncement.titre || currentAnnouncement.title || 'Annonce';

    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    const breadcrumbTitle = document.getElementById('breadcrumb-title');
    
    if (breadcrumbCategory) breadcrumbCategory.textContent = category;
    if (breadcrumbTitle) breadcrumbTitle.textContent = title;

    // Mettre à jour le titre de la page
    document.title = `${title} - Sénégal Élevage`;
}

/**
 * Met à jour les informations principales
 */
function updateMainInfo() {
    const titleElement = document.getElementById('announcement-title');
    const priceElement = document.getElementById('announcement-price');
    const negotiableElement = document.getElementById('price-negotiable');
    const urgentElement = document.getElementById('announcement-urgent');

    const title = currentAnnouncement.titre || currentAnnouncement.title || 'Sans titre';
    const price = currentAnnouncement.prix || currentAnnouncement.price || 0;
    const currency = currentAnnouncement.devise || currentAnnouncement.currency || 'XOF';
    const isNegotiable = currentAnnouncement.prix_negociable || currentAnnouncement.negotiable || false;
    const isUrgent = currentAnnouncement.annonce_urgente || currentAnnouncement.urgent || false;

    if (titleElement) titleElement.textContent = title;
    if (priceElement) priceElement.textContent = `${price.toLocaleString()} ${currency}`;

    if (negotiableElement) {
        negotiableElement.style.display = isNegotiable ? 'inline-flex' : 'none';
    }

    if (urgentElement) {
        urgentElement.style.display = isUrgent ? 'inline-flex' : 'none';
    }
}

/**
 * Met à jour les images
 */
function updateImages() {
    // Préparer toutes les images
    allImages = [];

    // Image principale
    const mainImagePath = currentAnnouncement.image_principale || 
                          currentAnnouncement.main_image || 
                          currentAnnouncement.image;
    
    if (mainImagePath) {
        allImages.push(mainImagePath);
    }

    // Images additionnelles
    const additionalImages = currentAnnouncement.images || 
                            currentAnnouncement.additional_images || 
                            [];
    
    if (Array.isArray(additionalImages)) {
        allImages.push(...additionalImages);
    }

    // S'il n'y a pas d'images, utiliser une image par défaut
    if (allImages.length === 0) {
        allImages.push('https://placehold.co/600x400?text=S%C3%A9n%C3%A9gal+%C3%89levage');
    }

    // Afficher l'image principale
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = allImages[0];
        mainImage.alt = currentAnnouncement.titre || currentAnnouncement.title || 'Image de l\'annonce';
    }

    // Créer les vignettes
    createThumbnails();

    // Réinitialiser l'index
    currentImageIndex = 0;
}

/**
 * Crée les vignettes des images
 */
function createThumbnails() {
    const container = document.getElementById('thumbnail-container');
    if (!container) return;
    
    container.innerHTML = '';

    allImages.forEach((image, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.src = image;
        thumbnail.alt = `Image ${index + 1}`;
        thumbnail.className = 'thumbnail';
        if (index === 0) {
            thumbnail.classList.add('active');
        }

        thumbnail.addEventListener('click', () => selectImage(index));
        container.appendChild(thumbnail);
    });
}

/**
 * Sélectionne une image spécifique
 * @param {number} index - Index de l'image à sélectionner
 */
function selectImage(index) {
    if (index < 0 || index >= allImages.length) return;

    currentImageIndex = index;
    const mainImage = document.getElementById('main-image');
    if (mainImage) mainImage.src = allImages[index];

    // Mettre à jour les classes des vignettes
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

/**
 * Met à jour les informations complémentaires
 */
function updateAdditionalInfo() {
    const category = currentAnnouncement.categorie || currentAnnouncement.category || 'Autre';
    const location = currentAnnouncement.localisation || currentAnnouncement.location || 'Non spécifié';
    const region = currentAnnouncement.region || 'Non spécifiée';
    const createdAt = currentAnnouncement.created_at || currentAnnouncement.createdAt || new Date().toISOString();
    const views = currentAnnouncement.views || 0;
    const description = currentAnnouncement.description || 'Aucune description disponible.';
    const condition = currentAnnouncement.etat_produit || currentAnnouncement.condition || 'Non spécifié';
    const delivery = currentAnnouncement.livraison_possible || currentAnnouncement.delivery_available || false;
    const type = currentAnnouncement.type_annonce || currentAnnouncement.ad_type || 'Standard';
    const id = currentAnnouncement.id || 'N/A';

    // Informations rapides
    const infoCategory = document.getElementById('info-category');
    const infoLocation = document.getElementById('info-location');
    const infoDate = document.getElementById('info-date');
    const infoViews = document.getElementById('info-views');
    
    if (infoCategory) infoCategory.textContent = getCategoryLabel(category);
    if (infoLocation) infoLocation.textContent = `${location}, ${region}`;
    if (infoDate) infoDate.textContent = formatDate(createdAt);
    if (infoViews) infoViews.textContent = views.toLocaleString();

    // Description
    const descriptionElement = document.getElementById('announcement-description');
    if (descriptionElement) descriptionElement.textContent = description;

    // Informations additionnelles
    const infoCondition = document.getElementById('info-condition');
    const infoDelivery = document.getElementById('info-delivery');
    const infoType = document.getElementById('info-type');
    const infoId = document.getElementById('info-id');
    
    if (infoCondition) infoCondition.textContent = condition;
    if (infoDelivery) infoDelivery.textContent = delivery ? 'Disponible' : 'Non disponible';
    if (infoType) infoType.textContent = type;
    if (infoId) infoId.textContent = id;
}

/**
 * Met à jour les informations du vendeur
 */
function updateSellerInfo() {
    const sellerName = currentAnnouncement.nom_vendeur || 
                       currentAnnouncement.seller_name || 
                       currentAnnouncement.nom || 
                       'Vendeur';
    
    const sellerPhone = currentAnnouncement.telephone || 
                        currentAnnouncement.phone || 
                        'Non disponible';
    
    const sellerLocation = currentAnnouncement.localisation || 
                           currentAnnouncement.location || 
                           'Non spécifié';

    const sellerNameElement = document.getElementById('seller-name');
    const sellerPhoneElement = document.getElementById('seller-phone');
    const sellerLocationElement = document.getElementById('seller-location');
    
    if (sellerNameElement) sellerNameElement.textContent = sellerName;
    if (sellerPhoneElement) sellerPhoneElement.textContent = sellerPhone;
    if (sellerLocationElement) sellerLocationElement.textContent = sellerLocation;

    // Note fictive pour l'exemple
    const rating = 4.5;
    const reviews = 23;

    const sellerRating = document.getElementById('seller-rating');
    const sellerReviews = document.getElementById('seller-reviews');
    
    if (sellerRating) sellerRating.innerHTML = generateStars(rating);
    if (sellerReviews) sellerReviews.textContent = `(${reviews} avis)`;
}

/**
 * Retourne le libellé d'une catégorie
 * @param {string} category - Catégorie
 * @returns {string} Libellé formaté
 */
function getCategoryLabel(category) {
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
    return labels[category] || category || 'Autre';
}

/**
 * Formate une date
 * @param {string} dateString - Date à formater
 * @returns {string} Date formatée
 */
function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Génère les étoiles de notation
 * @param {number} rating - Note
 * @returns {string} HTML des étoiles
 */
function generateStars(rating) {
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

// ============================================================================
// FONCTIONS DES ANNONCES SIMILAIRES
// ============================================================================

/**
 * Charge les annonces similaires
 */
function loadSimilarAnnonces() {
    if (!currentAnnouncement) return;

    // Filtrer les annonces similaires
    similarAnnonces = allAnnonces.filter(annonce => {
        // Exclure l'annonce actuelle
        if (annonce.id === currentAnnouncement.id) return false;

        const currentCategory = currentAnnouncement.categorie || currentAnnouncement.category;
        const annonceCategory = annonce.categorie || annonce.category;
        const currentRegion = currentAnnouncement.region;
        const annonceRegion = annonce.region;
        const currentPrice = currentAnnouncement.prix || currentAnnouncement.price || 0;
        const annoncePrice = annonce.prix || annonce.price || 0;

        // Même catégorie
        if (annonceCategory === currentCategory) return true;

        // Même région
        if (annonceRegion === currentRegion) return true;

        // Même plage de prix (±30%)
        const priceRange = currentPrice * 0.3;
        if (Math.abs(annoncePrice - currentPrice) <= priceRange) return true;

        return false;
    });

    // Limiter à 6 annonces similaires
    similarAnnonces = similarAnnonces.slice(0, 6);

    // Afficher les annonces similaires
    displaySimilarAnnonces();

    console.log(`🔗 ${similarAnnonces.length} annonces similaires trouvées`);
}

/**
 * Affiche les annonces similaires
 */
function displaySimilarAnnonces() {
    const container = document.getElementById('similar-grid');
    if (!container) return;
    
    container.innerHTML = '';

    if (similarAnnonces.length === 0) {
        container.innerHTML = '<p>Aucune annonce similaire trouvée.</p>';
        return;
    }

    similarAnnonces.forEach(annonce => {
        const card = createSimilarCard(annonce);
        container.appendChild(card);
    });
}

/**
 * Crée une carte d'annonce similaire
 * @param {Object} annonce - Données de l'annonce
 * @returns {HTMLElement} Carte de l'annonce
 */
function createSimilarCard(annonce) {
    const card = document.createElement('div');
    card.className = 'similar-card';

    const title = annonce.titre || annonce.title || 'Annonce';
    const price = annonce.prix || annonce.price || 0;
    const currency = annonce.devise || annonce.currency || 'XOF';
    const location = annonce.localisation || annonce.location || 'Sénégal';
    const image = annonce.image_principale || annonce.main_image || annonce.image || 'https://placehold.co/300x200?text=S%C3%A9n%C3%A9gal+%C3%89levage';
    const id = annonce.id;

    card.innerHTML = `
        <img src="${image}" 
             alt="${title}" class="similar-image">
        <div class="similar-info">
            <h4 class="similar-title">${title}</h4>
            <div class="similar-price">${price.toLocaleString()} ${currency}</div>
            <div class="similar-location">
                <i class="fas fa-map-marker-alt"></i> ${location}
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `annonce-details.html?id=${id}`;
    });

    return card;
}

// ============================================================================
// FONCTIONS DE GESTION DES FAVORIS
// ============================================================================

/**
 * Vérifie si l'annonce est dans les favoris
 */
function checkFavoriteStatus() {
    try {
        const favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');
        isFavorite = favorites.some(fav => fav.id === currentAnnouncement.id);

        updateFavoriteButton();

    } catch (error) {
        console.error('❌ Erreur lors de la vérification des favoris:', error);
    }
}

/**
 * Met à jour le bouton des favoris
 */
function updateFavoriteButton() {
    const favoriteBtn = document.getElementById('add-favorite');
    if (!favoriteBtn) return;

    if (isFavorite) {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Retirer des favoris';
        favoriteBtn.classList.add('favorited');
    } else {
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Ajouter aux favoris';
        favoriteBtn.classList.remove('favorited');
    }
}

/**
 * Bascule le statut de favori
 */
function toggleFavorite() {
    try {
        let favorites = JSON.parse(localStorage.getItem('user_favorites') || '[]');

        if (isFavorite) {
            // Retirer des favoris
            favorites = favorites.filter(fav => fav.id !== currentAnnouncement.id);
            showNotification('💔 Retiré des favoris');
        } else {
            // Ajouter aux favoris
            favorites.push({
                id: currentAnnouncement.id,
                title: currentAnnouncement.titre || currentAnnouncement.title,
                price: currentAnnouncement.prix || currentAnnouncement.price,
                image: currentAnnouncement.image_principale || currentAnnouncement.main_image,
                location: currentAnnouncement.localisation || currentAnnouncement.location,
                category: currentAnnouncement.categorie || currentAnnouncement.category,
                added_at: new Date().toISOString()
            });
            showNotification('❤️ Ajouté aux favoris');
        }

        localStorage.setItem('user_favorites', JSON.stringify(favorites));

        isFavorite = !isFavorite;
        updateFavoriteButton();

    } catch (error) {
        console.error('❌ Erreur lors de la gestion des favoris:', error);
        showError('Erreur lors de la gestion des favoris');
    }
}

// ============================================================================
// FONCTIONS DE CONTACT ET PARTAGE
// ============================================================================

/**
 * Ouvre WhatsApp pour contacter le vendeur
 */
function showContactModal() {
    if (!currentAnnouncement) return;

    const phone = currentAnnouncement.telephone || 
                  currentAnnouncement.phone || 
                  '221770000000';
    
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone;
    
    const title = currentAnnouncement.titre || currentAnnouncement.title || 'cette annonce';
    const price = currentAnnouncement.prix || currentAnnouncement.price || 0;
    const currency = currentAnnouncement.devise || currentAnnouncement.currency || 'XOF';

    const message = encodeURIComponent(
        `Bonjour, je suis intéressé(e) par votre annonce "${title}" à ${price.toLocaleString()} ${currency} sur Sénégal Élevage. Est-ce toujours disponible ?`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    console.log(`📱 WhatsApp ouvert pour: ${title}`);
}

/**
 * Affiche le modal de partage
 */
function showShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Ferme tous les modals
 */
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

/**
 * Partage l'annonce sur une plateforme
 * @param {string} platform - Plateforme de partage
 */
function shareAnnouncement(platform) {
    const url = window.location.href;
    const title = currentAnnouncement.titre || currentAnnouncement.title || 'une annonce';
    const text = `Découvrez cette annonce: ${title} - ${url}`;

    let shareUrl = '';

    switch (platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                showNotification('📋 Lien copié dans le presse-papiers');
            });
            return;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

/**
 * Gère la soumission du formulaire de contact
 * @param {Event} e - Événement de soumission
 */
function handleContactSubmit(e) {
    e.preventDefault();

    const formData = {
        announcementId: currentAnnouncement.id,
        announcementTitle: currentAnnouncement.titre || currentAnnouncement.title,
        sellerName: currentAnnouncement.nom_vendeur || currentAnnouncement.seller_name,
        sellerPhone: currentAnnouncement.telephone || currentAnnouncement.phone,
        contactName: document.getElementById('contact-name')?.value || '',
        contactPhone: document.getElementById('contact-phone')?.value || '',
        contactEmail: document.getElementById('contact-email')?.value || '',
        message: document.getElementById('contact-message')?.value || '',
        timestamp: new Date().toISOString()
    };

    // Sauvegarder la demande
    saveContactRequest(formData);

    // Afficher une confirmation
    showNotification('📧 Message envoyé avec succès ! Le vendeur vous contactera rapidement.');

    // Fermer le modal
    closeModals();

    // Réinitialiser le formulaire
    if (e.target) e.target.reset();
}

/**
 * Sauvegarde une demande de contact
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
        console.log('💾 Demande de contact sauvegardée:', requestData);

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de la demande:', error);
    }
}

// MODIFICATION 6: Incrémentation des vues avec Supabase
/**
 * Incrémente le nombre de vues de l'annonce
 */
async function incrementViews() {
    try {
        if (!currentAnnouncement) return;

        // Incrémenter localement
        currentAnnouncement.views = (currentAnnouncement.views || 0) + 1;
        const newViewCount = currentAnnouncement.views;

        // Mettre à jour dans Supabase si disponible
        if (supabaseClient && currentAnnouncement.id) {
            const { error } = await supabaseClient
                .from('annonces')
                .update({ views: newViewCount })
                .eq('id', currentAnnouncement.id);
            
            if (error) {
                console.warn('⚠️ Erreur mise à jour Supabase:', error);
            } else {
                console.log('✅ Vue incrémentée dans Supabase');
            }
        }

        // Mettre à jour dans localStorage (fallback)
        const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        const index = localAnnonces.findIndex(a => a.id === currentAnnouncement.id);

        if (index !== -1) {
            localAnnonces[index].views = newViewCount;
            localStorage.setItem('local_annonces', JSON.stringify(localAnnonces));
        }

        // Mettre à jour l'affichage
        const infoViews = document.getElementById('info-views');
        if (infoViews) infoViews.textContent = newViewCount.toLocaleString();

    } catch (error) {
        console.error('❌ Erreur lors de l\'incrémentation des vues:', error);
    }
}

// ============================================================================
// FONCTIONS D'ÉVÉNEMENTS
// ============================================================================

/**
 * Configure les événements des modals
 */
function setupModalEvents() {
    // Boutons de fermeture
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Fermer en cliquant à l'extérieur
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });

    // Fermer avec la touche Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModals();
        }
    });

    // Formulaire de contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    console.log('✅ Événements des modals configurés');
}

/**
 * Configure les événements des images
 */
function setupImageEvents() {
    // Zoom sur l'image principale
    const zoomBtn = document.getElementById('image-zoom');

    if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
            // Ouvrir l'image dans un nouvel onglet
            if (allImages[currentImageIndex]) {
                window.open(allImages[currentImageIndex], '_blank');
            }
        });
    }

    // Navigation au clavier
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            selectImage(currentImageIndex - 1);
        } else if (e.key === 'ArrowRight') {
            selectImage(currentImageIndex + 1);
        }
    });

    console.log('✅ Événements des images configurés');
}

/**
 * Configure les événements des boutons d'action
 */
function setupActionEvents() {
    // Bouton de contact
    const contactBtn = document.getElementById('contact-seller');
    if (contactBtn) {
        contactBtn.addEventListener('click', showContactModal);
    }

    // Bouton favoris
    const favoriteBtn = document.getElementById('add-favorite');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', toggleFavorite);
    }

    // Bouton de partage
    const shareBtn = document.getElementById('share-announcement');
    if (shareBtn) {
        shareBtn.addEventListener('click', showShareModal);
    }

    // Boutons de partage dans le modal
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.dataset.platform;
            shareAnnouncement(platform);
            closeModals();
        });
    });

    console.log('✅ Événements des boutons configurés');
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

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
window.DetailsManager = {
    getCurrentAnnouncement: () => ({ ...currentAnnouncement }),
    getSimilarAnnonces: () => [...similarAnnonces],
    isFavorite: () => isFavorite,
    toggleFavorite: toggleFavorite,
    shareAnnouncement: shareAnnouncement,
    refreshDetails: () => loadAnnouncementDetails(currentAnnouncement?.id)
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeDetailsPage);

console.log('✅ Script annonce-details.js chargé - Prêt pour la page détails');
console.log('🔗 Connexion Supabase configurée avec l\'URL:', SUPABASE_URL);