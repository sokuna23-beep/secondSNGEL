// cette page de scrip est conçu uniquement organiser la base de donnée et pour remplir les lien et les url
// File: script.js (pour publier-annonce.html)
// Description: Script pour la création d'annonces avec enregistrement dans Supabase
// Gestion du formulaire, upload d'images et stockage en base

// ============================================================================
// CONFIGURATION SUPABASE (Base de données)
// ============================================================================

// URL et clé d'API pour la connexion à la base de données Supabase
// Ces identifiants permettent de communiquer avec votre base de données PostgreSQL
const SUPABASE_URL = 'https://votre-projet.supabase.co'; // URL de votre projet Supabase
const SUPABASE_ANON_KEY = 'votre_cle_anon_public'; // Clé publique pour l'accès anonyme
const SUPABASE_STORAGE_BUCKET = 'annonces-images'; // Bucket de stockage pour les images

// Variable globale pour le client Supabase
let supabase;

// Initialisation du client Supabase pour la connexion à la base de données
// Cette fonction établit la connexion avec votre base de données PostgreSQL
try {
    if (typeof supabaseClient !== 'undefined') {
        supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Connexion à la base de données Supabase établie');
    }
} catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
}

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

// Variables pour la gestion des images et des fichiers
let uploadedImages = []; // Tableau pour stocker les informations des images uploadées
let imageFiles = []; // Tableau pour stocker les objets fichiers sélectionnés

// Constantes de configuration
const MAX_IMAGES = 5; // Nombre maximum d'images autorisées par annonce
const MAX_FILE_SIZE = 5 * 1024 * 1024; // Taille maximale des fichiers (5MB en octets)

// ============================================================================
// GESTION DES IMAGES
// ============================================================================

/**
 * Configure le système d'upload d'images
 */
function setupImageUpload() {
    const fileInput = document.getElementById('fileInput');
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('uploadArea');

    // Gestion du clic sur le lien "parcourir"
    const browseLink = document.querySelector('.browse-link');
    if (browseLink) {
        browseLink.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }

    // Gestion des fichiers sélectionnés via input
    fileInput.addEventListener('change', handleFileSelect);
    if (imageInput) {
        imageInput.addEventListener('change', handleFileSelect);
    }

    // Gestion du drag and drop
    if (uploadArea) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }
}

/**
 * Gère la sélection de fichiers
 * @param {Event} e - Événement de sélection
 */
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

/**
 * Traite les fichiers sélectionnés
 * @param {FileList} files - Liste des fichiers
 */
function handleFiles(files) {
    console.log(`📁 ${files.length} fichier(s) sélectionné(s)`);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Vérifier si c'est une image
        if (!file.type.startsWith('image/')) {
            console.warn(`⚠️ Le fichier "${file.name}" n'est pas une image`);
            continue;
        }

        // Vérifier la taille (5MB max)
        if (file.size > MAX_FILE_SIZE) {
            console.warn(`⚠️ Le fichier "${file.name}" dépasse 5MB`);
            alert(`Le fichier "${file.name}" dépasse la taille maximale de 5MB`);
            continue;
        }

        // Vérifier le nombre maximum d'images
        if (uploadedImages.length >= MAX_IMAGES) {
            console.warn(`⚠️ Nombre maximum d'images atteint (${MAX_IMAGES})`);
            alert(`Vous ne pouvez ajouter que ${MAX_IMAGES} images maximum`);
            break;
        }

        // Ajouter l'image à la liste
        const imageData = {
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            id: Date.now() + '_' + i
        };

        uploadedImages.push(imageData);
        imageFiles.push(file);

        console.log(`✅ Image ajoutée: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }

    // Mettre à jour les aperçus
    updateImagePreviews();

    // Vider l'input pour permettre de sélectionner les mêmes fichiers
    if (e.target) {
        e.target.value = '';
    }
}

/**
 * Met à jour les aperçus d'images
 */
function updateImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    if (!container) return;

    // Vider le conteneur
    container.innerHTML = '';

    if (uploadedImages.length === 0) {
        container.innerHTML = '<p class="no-images">Aucune image sélectionnée</p>';
        return;
    }

    // Créer les aperçus
    uploadedImages.forEach((image, index) => {
        const previewDiv = createImagePreview(image, index);
        container.appendChild(previewDiv);
    });

    console.log(`🖼️ ${uploadedImages.length} aperçu(s) d'image(s) affiché(s)`);

    // Update Live Preview Image
    const previewImage = document.getElementById('preview-image');
    if (previewImage) {
        if (uploadedImages.length > 0) {
            previewImage.src = uploadedImages[0].url;
        } else {
            previewImage.src = 'https://via.placeholder.com/400x300?text=Votre+Image';
        }
    }
}

/**
 * Crée un aperçu d'image
 * @param {Object} imageData - Données de l'image
 * @param {number} index - Index de l'image
 * @returns {HTMLElement} Élément de l'aperçu
 */
function createImagePreview(imageData, index) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'image-preview';
    previewDiv.dataset.index = index;

    previewDiv.innerHTML = `
        <img src="${imageData.url}" alt="${imageData.name}" class="preview-image">
        <div class="preview-info">
            <span class="preview-name">${imageData.name}</span>
            <span class="preview-size">${formatFileSize(imageData.size)}</span>
        </div>
        <button type="button" class="remove-image" data-index="${index}">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Gérer la suppression de l'image
    const removeBtn = previewDiv.querySelector('.remove-image');
    removeBtn.addEventListener('click', () => removeImage(index));

    return previewDiv;
}

/**
 * Supprime une image
 * @param {number} index - Index de l'image à supprimer
 */
function removeImage(index) {
    const image = uploadedImages[index];

    // Libérer l'URL de l'objet
    if (image.url) {
        URL.revokeObjectURL(image.url);
    }

    // Supprimer des tableaux 
    uploadedImages.splice(index, 1);
    imageFiles.splice(index, 1);

    // Mettre à jour les aperçus
    updateImagePreviews();

    console.log(`🗑️ Image supprimée: ${image.name}`);
}

/**
 * Formate la taille d'un fichier
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// GESTION DU FORMULAIRE
// ============================================================================

/**
 * Configure les événements du formulaire
 */
function setupFormEvents() {
    const form = document.getElementById('annoncesForm');
    const resetBtn = document.getElementById('resetBtn');
    const descriptionTextarea = document.getElementById('description');
    const charCount = document.getElementById('charCount');

    // Gestion de la soumission du formulaire
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Gestion du bouton de réinitialisation
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment réinitialiser le formulaire ?')) {
                resetForm();
            }
        });
    }

    // Gestion du compteur de caractères
    if (descriptionTextarea && charCount) {
        descriptionTextarea.addEventListener('input', () => {
            const count = descriptionTextarea.value.length;
            charCount.textContent = count;

            // Changer la couleur si on approche de la limite
            if (count > 450) {
                charCount.style.color = '#dc3545';
            } else if (count > 400) {
                charCount.style.color = '#ffc107';
            } else {
                charCount.style.color = '#6c757d';
            }
        });
    }
}

/**
 * Gère la soumission du formulaire
 * @param {Event} e - Événement de soumission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    console.log('📝 Soumission du formulaire d\'annonce...');

    // Valider le formulaire
    const formData = getFormData();
    const validation = validateFormData(formData);

    if (!validation.isValid) {
        showMessage('error', validation.errors.join(', '));
        return;
    }

    // Afficher l'indicateur de chargement
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication en cours...';
    submitBtn.disabled = true;

    try {
        // Upload des images si nécessaire
        let imageUrls = [];
        if (uploadedImages.length > 0) {
            if (supabase) {
                imageUrls = await uploadImagesToSupabase();
            } else {
                // Mode hors ligne : utiliser les URLs locales
                imageUrls = uploadedImages.map(img => img.url);
            }
        }

        // Préparer les données de l'annonce
        const announcementData = prepareAnnouncementData(formData, imageUrls);

        // Enregistrer l'annonce
        let savedData = null;
        if (supabase) {
            // Enregistrement dans la base de données
            const { data, error } = await supabase
                .from('annonces')
                .insert([announcementData])
                .select();

            if (error) throw error;
            savedData = data[0];
            console.log('✅ Annonce enregistrée dans la base de données:', savedData);
        } else {
            // Mode hors ligne
            savedData = {
                ...announcementData,
                id: Date.now(),
                mode_hors_ligne: true
            };
            saveAnnouncementOffline(savedData);
            registerLocalAnnouncement(savedData);
            console.log('💾 Annonce sauvegardée localement et enregistrée pour affichage:', savedData);
        }

        // Afficher le message de succès
        showMessage('success', 'Votre annonce a été publiée avec succès !');

        // Rediriger après 2 secondes
        setTimeout(() => {
            window.location.href = 'annonces.html';
        }, 2000);

    } catch (error) {
        console.error('❌ Erreur lors de la publication:', error);
        showMessage('error', 'Erreur lors de la publication. Veuillez réessayer.');

        // Restaurer le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Récupère les données du formulaire
 * @returns {Object} Données du formulaire
 */
function getFormData() {
    return {
        titre: document.getElementById('titre').value,
        description: document.getElementById('description').value,
        categorie: document.getElementById('categorie').value,
        etat: document.getElementById('etat').value,
        prix: document.getElementById('prix').value,
        devise: document.getElementById('devise').value,
        localisation: document.getElementById('localisation').value,
        region: document.getElementById('region').value,
        nom: document.getElementById('nom').value,
        telephone: document.getElementById('telephone').value,
        email: document.getElementById('email').value,
        entreprise: document.getElementById('entreprise').value
    };
}

/**
 * Valide les données du formulaire
 * @param {Object} formData - Données à valider
 * @returns {Object} Résultat de la validation
 */
function validateFormData(formData) {
    const errors = [];

    // Validation du titre
    if (!formData.titre || formData.titre.trim().length < 5) {
        errors.push('Le titre doit contenir au moins 5 caractères');
    }

    // Validation de la description
    if (!formData.description || formData.description.trim().length < 20) {
        errors.push('La description doit contenir au moins 20 caractères');
    }

    // Validation de la catégorie
    if (!formData.categorie) {
        errors.push('Veuillez sélectionner une catégorie');
    }

    // Validation de l'état
    if (!formData.etat) {
        errors.push('Veuillez sélectionner l\'état du produit');
    }

    // Validation du prix
    if (!formData.prix || parseFloat(formData.prix) <= 0) {
        errors.push('Le prix doit être supérieur à 0');
    }

    // Validation de la localisation
    if (!formData.localisation || formData.localisation.trim().length < 2) {
        errors.push('Veuillez indiquer votre localisation');
    }

    // Validation de la région
    if (!formData.region) {
        errors.push('Veuillez sélectionner une région');
    }

    // Validation du nom
    if (!formData.nom || formData.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }

    // Validation du téléphone
    if (!formData.telephone || !/^\+?[\d\s\-\(\)]{8,}$/.test(formData.telephone)) {
        errors.push('Numéro de téléphone invalide');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Affiche un message à l'utilisateur
 * @param {string} type - Type de message (success, error)
 * @param {string} message - Message à afficher
 */
function showMessage(type, message) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');

    // Masquer tous les messages
    successDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    // Afficher le message approprié
    if (type === 'success') {
        successDiv.querySelector('p').textContent = message;
        successDiv.style.display = 'flex';
    } else if (type === 'error') {
        errorDiv.querySelector('p').textContent = message;
        errorDiv.style.display = 'flex';
    }

    // Masquer le message après 5 secondes
    setTimeout(() => {
        successDiv.style.display = 'none';
        errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Réinitialise le formulaire
 */
function resetForm() {
    // Réinitialiser les champs
    document.getElementById('annoncesForm').reset();

    // Vider les images
    uploadedImages = [];
    imageFiles = [];
    updateImagePreviews();

    // Réinitialiser le compteur de caractères
    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#6c757d';
    }

    // Masquer les messages
    showMessage('success', '');

    console.log('🔄 Formulaire réinitialisé');
}

/**
 * Sauvegarde une annonce hors ligne
 * @param {Object} announcement - Données de l'annonce
 */
function saveAnnouncementOffline(announcement) {
    const offlineAnnouncements = JSON.parse(
        localStorage.getItem('offline_announcements') || '[]'
    );
    offlineAnnouncements.push(announcement);
    localStorage.setItem('offline_announcements', JSON.stringify(offlineAnnouncements));
}

/**
 * Synchronise les annonces hors ligne avec la base de données
 */
async function syncOfflineAnnouncements() {
    if (!supabase) return;

    try {
        const offlineAnnouncements = JSON.parse(
            localStorage.getItem('offline_announcements') || '[]'
        );

        if (offlineAnnouncements.length === 0) return;

        console.log(`🔄 Synchronisation de ${offlineAnnouncements.length} annonce(s) hors ligne...`);

        for (const announcement of offlineAnnouncements) {
            const { mode_hors_ligne, id: tempId, ...cleanAnnouncement } = announcement;

            const { error } = await supabase
                .from('annonces')
                .insert([cleanAnnouncement]);

            if (error) {
                console.error('❌ Erreur de synchronisation:', error);
            }
        }

        // Vider le cache local
        localStorage.removeItem('offline_announcements');
        console.log('✅ Synchronisation terminée');

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
    }
}

/**
 * Prépare les données de l'annonce pour l'insertion
 * @param {Object} formData - Données du formulaire
 * @param {Array} imageUrls - URLs des images
 * @returns {Object} Données préparées
 */
function prepareAnnouncementData(formData, imageUrls) {
    const isMaterialAnnouncement = formData.categorie === 'materiaux';

    return {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        categorie: formData.categorie,
        prix: parseFloat(formData.prix),
        devise: formData.devise || 'XOF',
        localisation: formData.localisation.trim(),
        region: formData.region,
        etat_produit: formData.etat,
        nom_vendeur: formData.nom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email?.trim() || null,
        entreprise: formData.entreprise?.trim() || null,
        images: imageUrls,
        image_principale: imageUrls[0] || null,
        livraison_possible: document.getElementById('livraison').checked,
        prix_negociable: document.getElementById('negociation').checked,
        annonce_urgente: document.getElementById('urgent').checked,
        type_annonce: isMaterialAnnouncement ? 'materiel' : 'autre',
        categorie_materiel: isMaterialAnnouncement ? getMaterialCategory(formData.description) : null,
        status: 'actif',
        created_at: new Date().toISOString(),
        views: 0,
        user_id: getCurrentUserId()
    };
}

/**
 * Détermine la catégorie de matériel à partir de la description
 * @param {string} description - Description du produit
 * @returns {string} Catégorie de matériel
 */
function getMaterialCategory(description) {
    const keywords = {
        'alimentation': 'aliment',
        'abreuvoir': 'abreuvoir',
        'clôture': 'cloture',
        'médicament': 'medicament',
        'vaccin': 'vaccin',
        'transport': 'transport'
    };

    const desc = description.toLowerCase();
    for (const [keyword, category] of Object.entries(keywords)) {
        if (desc.includes(keyword)) {
            return category;
        }
    }

    return 'autre';
}

/**
 * Récupère l'ID de l'utilisateur actuel
 * @returns {string|null} ID de l'utilisateur
 */
function getCurrentUserId() {
    if (supabase && supabase.auth) {
        const user = supabase.auth.getUser();
        if (user && user.id) {
            return user.id;
        }
    }
    return null;
}

// ============================================================================
// UPLOAD DES IMAGES SUR SUPABASE STORAGE
// ============================================================================

/**
 * Upload les images sur Supabase Storage (Base de données de fichiers)
 * @returns {Promise<Array>} URLs des images uploadées
 */
async function uploadImagesToSupabase() {
    // Si Supabase n'est pas disponible ou aucune image à uploader
    if (!supabase || uploadedImages.length === 0) {
        return [];
    }

    const imageUrls = [];

    try {
        console.log(`📤 Upload de ${uploadedImages.length} image(s) vers la base de données...`);

        // Parcourir chaque image et l'uploader individuellement
        for (let i = 0; i < uploadedImages.length; i++) {
            const image = uploadedImages[i];
            // Générer un nom de fichier unique avec timestamp et index
            const fileName = `${Date.now()}_${i}_${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filePath = `${fileName}`;

            // Upload du fichier vers le bucket Supabase Storage
            const { data, error } = await supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .upload(filePath, image.file);

            if (error) throw error;

            // Récupérer l'URL publique de l'image uploadée
            const { data: { publicUrl } } = supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .getPublicUrl(filePath);

            imageUrls.push(publicUrl);
            console.log(`✅ Image ${i + 1}/${uploadedImages.length} uploadée: ${fileName}`);
        }

        console.log(`🎉 ${imageUrls.length} image(s) uploadées avec succès`);
        return imageUrls;

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload des images vers la base de données:', error);
        throw new Error('Échec de l\'upload des images. Veuillez réessayer.');
    }
}

// ============================================================================
// ENREGISTREMENT DE L'ANNONCE DANS SUPABASE
// ============================================================================

// ... (code inchangé)
/**
 * Initialise la page de création d'annonce
 */
function initializePage() {
    console.log('Initialisation de la page création d\'annonce...');

    // 1. Configurer les événements du formulaire
    setupFormEvents();

    // 2. Configurer l'upload d'images
    setupImageUpload();

    // 3. Initialiser les aperçus d'images
    updateImagePreviews();

    // 4. Vérifier et synchroniser les annonces hors ligne
    if (supabase && navigator.onLine) {
        syncOfflineAnnouncements();
    }

    // 5. Configurer les validations en temps réel
    setupRealTimeValidation();

    // 6. Configurer l'aperçu en direct
    setupLivePreview();

    console.log('Page création d\'annonce initialisée');
}

/**
 * Configure les validations en temps réel
 */
function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('.form-control[required]');

    inputs.forEach(input => {
        input.addEventListener('blur', () => {
            validateField(input);
        });

        input.addEventListener('input', () => {
            clearFieldError(input);
        });
    });
}

/**
 * Configure l'aperçu en direct
 */
function setupLivePreview() {
    const previewElements = {
        title: document.getElementById('preview-title'),
        price: document.getElementById('preview-price'),
        location: document.getElementById('preview-location'),
        category: document.getElementById('preview-category'),
        description: document.getElementById('preview-desc'),
        delivery: document.getElementById('preview-delivery'),
        badge: document.getElementById('preview-badge')
    };

    const inputs = {
        titre: document.getElementById('titre'),
        prix: document.getElementById('prix'),
        devise: document.getElementById('devise'),
        localisation: document.getElementById('localisation'),
        categorie: document.getElementById('categorie'),
        description: document.getElementById('description'),
        livraison: document.getElementById('livraison'),
        urgent: document.getElementById('urgent')
    };

    // Update Title
    if (inputs.titre) {
        inputs.titre.addEventListener('input', (e) => {
            previewElements.title.textContent = e.target.value || 'Titre de votre annonce';
        });
    }

    // Update Price
    const updatePrice = () => {
        const price = inputs.prix.value;
        const currency = inputs.devise.value;
        previewElements.price.textContent = price ? `${price} ${currency}` : '0 FCFA';
    };
    if (inputs.prix) inputs.prix.addEventListener('input', updatePrice);
    if (inputs.devise) inputs.devise.addEventListener('change', updatePrice);

    // Update Location
    if (inputs.localisation) {
        inputs.localisation.addEventListener('input', (e) => {
            previewElements.location.textContent = inputs.localisation.value ? ` ${inputs.localisation.value}` : ' Votre Ville';
            // Re-add icon if textContent wiped it (actually textContent wipes children, so let's handle it carefully or just set text)
            // Better: just update the text node or span if it existed? 
            // The HTML is: <div class="product-vendor"><i class="fas fa-map-marker-alt"></i> <span id="preview-location">Votre Ville</span></div>
            // So safe to update textContent of preview-location.
        });
    }

    // Update Category
    if (inputs.categorie) {
        inputs.categorie.addEventListener('change', (e) => {
            const selectedText = e.target.options[e.target.selectedIndex].text;
            previewElements.category.textContent = e.target.value ? selectedText.split('(')[0].trim().toUpperCase() : 'CATÉGORIE';
        });
    }

    // Update Description
    if (inputs.description) {
        inputs.description.addEventListener('input', (e) => {
            previewElements.description.textContent = e.target.value || 'La description de votre produit s\'affichera ici. Soyez précis pour attirer les acheteurs.';
        });
    }

    // Update Delivery Badge
    if (inputs.livraison) {
        inputs.livraison.addEventListener('change', (e) => {
            previewElements.delivery.style.display = e.target.checked ? 'flex' : 'none';
        });
    }

    // Update Urgent Badge
    if (inputs.urgent) {
        inputs.urgent.addEventListener('change', (e) => {
            previewElements.badge.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                previewElements.badge.textContent = 'Urgent';
                previewElements.badge.style.backgroundColor = 'var(--error)';
                previewElements.badge.style.color = 'white';
            }
        });
    }
}

/**
 * Valide un champ individuel
 * @param {HTMLElement} field - Champ à valider
 */
function validateField(field) {
    const value = field.value.trim();
    const fieldId = field.id;

    let isValid = true;
    let errorMessage = '';

    switch (fieldId) {
        case 'titre':
            if (value.length < 5) {
                isValid = false;
                errorMessage = 'Le titre doit contenir au moins 5 caractères';
            }
            break;

        case 'description':
            if (value.length < 20) {
                isValid = false;
                errorMessage = 'La description doit contenir au moins 20 caractères';
            }
            break;

        case 'prix':
            if (!value || parseFloat(value) <= 0) {
                isValid = false;
                errorMessage = 'Le prix doit être supérieur à 0';
            }
            break;

        case 'telephone':
            if (!/^\+?[\d\s\-\(\)]{8,}$/.test(value)) {
                isValid = false;
                errorMessage = 'Numéro de téléphone invalide';
            }
            break;

        case 'nom':
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'Le nom est requis';
            }
            break;
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
}

/**
 * Affiche une erreur sur un champ
 * @param {HTMLElement} field - Champ concerné
 * @param {string} message - Message d'erreur
 */
function showFieldError(field, message) {
    clearFieldError(field);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;

    field.parentNode.appendChild(errorDiv);
    field.classList.add('error');
}

/**
 * Efface l'erreur d'un champ
 * @param {HTMLElement} field - Champ concerné
 */
function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.classList.remove('error');
}

// ============================================================================
// EXÉCUTION
// ============================================================================

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializePage);

// Surveiller la connexion internet pour la synchronisation
window.addEventListener('online', () => {
    console.log('Connexion rétablie');
    if (supabase) {
        syncOfflineAnnouncements();
    }
});

/**
 * Ajoute l'annonce aux stockages locaux utilisés par la page `annonces.html`
 * afin qu'elle s'affiche immédiatement après redirection.
 * @param {Object} annonce
 */
function registerLocalAnnouncement(annonce) {
    try {
        // local_annonces : stockage principal utilisé par annonces.js
        const localList = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        localList.unshift(annonce);
        localStorage.setItem('local_annonces', JSON.stringify(localList));

        // recent_annonces : pour compatibilité avec le système de transport
        const recent = JSON.parse(localStorage.getItem('recent_annonces') || '[]');
        recent.unshift(annonce);
        // limiter la taille des récentes
        localStorage.setItem('recent_annonces', JSON.stringify(recent.slice(0, 20)));

        // indicateurs de nouvelle annonce pour annonces.js
        localStorage.setItem('just_published', 'true');
        localStorage.setItem('new_announcement', JSON.stringify(annonce));
        localStorage.setItem('highlight_announcement_id', annonce.id);

        console.log('✅ Annonce enregistrée dans localStorage pour affichage:', annonce);
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement local de l\'annonce:', err);
    }
}

// Exporter des fonctions pour un usage global
window.AnnouncementCreator = {
    validateForm: validateFormData,
    syncOfflineData: syncOfflineAnnouncements,
    getOfflineCount: () => {
        const data = JSON.parse(localStorage.getItem('offline_announcements') || '[]');
        return data.length;
    }
};

console.log('Script creation-annonce.js chargé');

/*Validation complète du formulaire

Upload d'images vers Supabase Storage

Enregistrement dans la table annonces

Mode hors ligne avec stockage local

Synchronisation automatique quand connexion rétablie

Catég orisation automatique des matériels*/
