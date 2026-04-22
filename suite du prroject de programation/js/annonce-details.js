/**
 * Fichier: annonce-details.js
 * Description: Script pour la page de détails d'annonce de Sénégal Élevage
 * Gestion de l'affichage des détails, du contact et du partage
 * Version: 1.0.0
 * Auteur: Sénégal Élevage Team
 */

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
function initializeDetailsPage() {
    console.log('🚀 Initialisation de la page détails annonce...');

    try {
        // 1. Récupérer l'ID de l'annonce depuis l'URL
        const announcementId = getAnnouncementIdFromUrl();

        if (!announcementId) {
            showError('Aucune annonce spécifiée');
            return;
        }

        // 2. Charger les données
        loadAnnoncesData();

        // 3. Trouver et afficher l'annonce
        loadAnnouncementDetails(announcementId);

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

/**
 * Récupère l'ID de l'annonce depuis les paramètres URL
 * @returns {string|null} ID de l'annonce
 */
function getAnnouncementIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('annonce');
}

/**
 * Charge les données des annonces depuis localStorage
 */
function loadAnnoncesData() {
    try {
        // Récupérer depuis la base de données locale
        const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');

        // Récupérer depuis les annonces récentes
        const recentAnnonces = JSON.parse(localStorage.getItem('recent_annonces') || '[]');

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
function loadAnnouncementDetails(announcementId) {
    console.log(`🔍 Recherche de l'annonce ID: ${announcementId}`);

    // Masquer l'état de chargement
    document.getElementById('loading-state').style.display = 'none';

    // Trouver l'annonce
    currentAnnouncement = allAnnonces.find(annonce =>
        annonce.id == announcementId ||
        annonce.id == parseInt(announcementId)
    );

    if (!currentAnnouncement) {
        // Afficher l'état d'erreur
        document.getElementById('error-state').style.display = 'block';
        return;
    }

    // Afficher les détails
    displayAnnouncementDetails();

    // Charger les annonces similaires
    loadSimilarAnnonces();

    // Vérifier si c'est un favori
    checkFavoriteStatus();

    // Incrémenter le nombre de vues
    incrementViews();

    console.log('✅ Détails de l\'annonce affichés:', currentAnnouncement.title);
}

/**
 * Affiche les détails de l'annonce dans la page
 */
function displayAnnouncementDetails() {
    if (!currentAnnouncement) return;

    // Afficher la section des détails
    document.getElementById('error-state').style.display = 'none';
    document.getElementById('announcement-details').style.display = 'block';

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
    const category = currentAnnouncement.categorie || 'Autre';
    const title = currentAnnouncement.titre;

    document.getElementById('breadcrumb-category').textContent = category;
    document.getElementById('breadcrumb-title').textContent = title;

    // Mettre à jour le titre de la page
    document.title = `${title} - Sénégal Élevage`;
}

/**
 * Met à jour les informations principales
 */
function updateMainInfo() {
    document.getElementById('announcement-title').textContent = currentAnnouncement.titre;
    document.getElementById('announcement-price').textContent =
        `${currentAnnouncement.prix.toLocaleString()} ${currentAnnouncement.devise || 'XOF'}`;

    // Afficher les badges si applicable
    const negotiableElement = document.getElementById('price-negotiable');
    const urgentElement = document.getElementById('announcement-urgent');

    if (currentAnnouncement.prix_negociable) {
        negotiableElement.style.display = 'inline-flex';
    } else {
        negotiableElement.style.display = 'none';
    }

    if (currentAnnouncement.annonce_urgente) {
        urgentElement.style.display = 'inline-flex';
    } else {
        urgentElement.style.display = 'none';
    }
}

/**
 * Met à jour les images
 */
function updateImages() {
    // Préparer toutes les images
    allImages = [];

    // Image principale
    if (currentAnnouncement.image_principale) {
        allImages.push(currentAnnouncement.image_principale);
    }

    // Images additionnelles
    if (currentAnnouncement.images && Array.isArray(currentAnnouncement.images)) {
        allImages.push(...currentAnnouncement.images);
    }

    // S'il n'y a pas d'images, utiliser une image par défaut
    if (allImages.length === 0) {
        allImages.push('placeholder.jpg');
    }

    // Afficher l'image principale
    const mainImage = document.getElementById('main-image');
    mainImage.src = allImages[0];
    mainImage.alt = currentAnnouncement.titre;

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
    mainImage.src = allImages[index];

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
    // Informations rapides
    document.getElementById('info-category').textContent =
        getCategoryLabel(currentAnnouncement.categorie);
    document.getElementById('info-location').textContent =
        `${currentAnnouncement.localisation}, ${currentAnnouncement.region}`;
    document.getElementById('info-date').textContent =
        formatDate(currentAnnouncement.created_at);
    document.getElementById('info-views').textContent =
        (currentAnnouncement.views || 0).toLocaleString();

    // Description
    document.getElementById('announcement-description').textContent =
        currentAnnouncement.description || 'Aucune description disponible.';

    // Informations additionnelles
    document.getElementById('info-condition').textContent =
        currentAnnouncement.etat_produit || 'Non spécifié';
    document.getElementById('info-delivery').textContent =
        currentAnnouncement.livraison_possible ? 'Disponible' : 'Non disponible';
    document.getElementById('info-type').textContent =
        currentAnnouncement.type_annonce || 'Standard';
    document.getElementById('info-id').textContent =
        currentAnnouncement.id;
}

/**
 * Met à jour les informations du vendeur
 */
function updateSellerInfo() {
    document.getElementById('seller-name').textContent =
        currentAnnouncement.nom_vendeur || 'Vendeur';
    document.getElementById('seller-phone').textContent =
        currentAnnouncement.telephone || 'Non disponible';
    document.getElementById('seller-location').textContent =
        currentAnnouncement.localisation || 'Non spécifié';

    // Note fictive pour l'exemple
    const rating = 4.5;
    const reviews = 23;

    document.getElementById('seller-rating').innerHTML = generateStars(rating);
    document.getElementById('seller-reviews').textContent = `(${reviews} avis)`;
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
        'materiel': 'Matériel'
    };
    return labels[category] || category || 'Autre';
}

/**
 * Formate une date
 * @param {string} dateString - Date à formater
 * @returns {string} Date formatée
 */
function formatDate(dateString) {
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

        // Même catégorie
        if (annonce.categorie === currentAnnouncement.categorie) return true;

        // Même région
        if (annonce.region === currentAnnouncement.region) return true;

        // Même plage de prix (±30%)
        const priceRange = currentAnnouncement.prix * 0.3;
        if (Math.abs(annonce.prix - currentAnnouncement.prix) <= priceRange) return true;

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

    card.innerHTML = `
        <img src="${annonce.image_principale || 'placeholder.jpg'}" 
             alt="${annonce.titre}" class="similar-image">
        <div class="similar-info">
            <h4 class="similar-title">${annonce.titre}</h4>
            <div class="similar-price">${annonce.prix.toLocaleString()} ${annonce.devise || 'XOF'}</div>
            <div class="similar-location">
                <i class="fas fa-map-marker-alt"></i> ${annonce.localisation}
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `annonce-details.html?id=${annonce.id}`;
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
                title: currentAnnouncement.titre,
                price: currentAnnouncement.prix,
                image: currentAnnouncement.image_principale,
                location: currentAnnouncement.localisation,
                category: currentAnnouncement.categorie,
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

    const phone = currentAnnouncement.telephone || '221770000000';
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : '221' + cleanPhone;

    const message = encodeURIComponent(
        `Bonjour, je suis intéressé(e) par votre annonce "${currentAnnouncement.titre}" à ${currentAnnouncement.prix.toLocaleString()} ${currentAnnouncement.devise || 'XOF'} sur Sénégal Élevage. Est-ce toujours disponible ?`
    );

    window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
    console.log(`📱 WhatsApp ouvert pour: ${currentAnnouncement.titre}`);
}

/**
 * Affiche le modal de partage
 */
function showShareModal() {
    const modal = document.getElementById('share-modal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
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
    const title = currentAnnouncement.titre;
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
        announcementTitle: currentAnnouncement.titre,
        sellerName: currentAnnouncement.nom_vendeur,
        sellerPhone: currentAnnouncement.telephone,
        contactName: document.getElementById('contact-name').value,
        contactPhone: document.getElementById('contact-phone').value,
        contactEmail: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value,
        timestamp: new Date().toISOString()
    };

    // Sauvegarder la demande
    saveContactRequest(formData);

    // Afficher une confirmation
    showNotification('📧 Message envoyé avec succès ! Le vendeur vous contactera rapidement.');

    // Fermer le modal
    closeModals();

    // Réinitialiser le formulaire
    e.target.reset();
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

/**
 * Incrémente le nombre de vues de l'annonce
 */
function incrementViews() {
    try {
        if (!currentAnnouncement) return;

        // Incrémenter localement
        currentAnnouncement.views = (currentAnnouncement.views || 0) + 1;

        // Mettre à jour dans localStorage
        const localAnnonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        const index = localAnnonces.findIndex(a => a.id === currentAnnouncement.id);

        if (index !== -1) {
            localAnnonces[index].views = currentAnnouncement.views;
            localStorage.setItem('local_annonces', JSON.stringify(localAnnonces));
        }

        // Mettre à jour l'affichage
        document.getElementById('info-views').textContent =
            currentAnnouncement.views.toLocaleString();

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
    const mainImage = document.getElementById('main-image');
    const zoomBtn = document.getElementById('image-zoom');

    if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
            // Ouvrir l'image dans un nouvel onglet
            window.open(allImages[currentImageIndex], '_blank');
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
    refreshDetails: () => loadAnnouncementDetails(currentAnnouncement.id)
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeDetailsPage);

console.log('✅ Script annonce-details.js chargé - Prêt pour la page détails');
