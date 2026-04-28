// cette page de script est conçue uniquement pour organiser la base de données et pour remplir les liens et les url
// File: script.js (pour publier-annonce.html)
// Description: Script pour la création d'annonces avec enregistrement dans Supabase
// Gestion du formulaire, upload d'images et stockage en base
// Version: 2.0.0

// ============================================================================
// CONFIGURATION SUPABASE (Base de données)
// ============================================================================

// MODIFICATION 1: Remplacement des placeholders par les vraies valeurs Supabase
// URL et clé d'API pour la connexion à la base de données Supabase
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co'; // URL de votre projet Supabase (CORRIGÉE)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag'; // Clé publique pour l'accès anonyme (CORRIGÉE)
const SUPABASE_STORAGE_BUCKET = 'annonces-images'; // Bucket de stockage pour les images

// MODIFICATION 2: Variable globale pour le client Supabase
let supabase = null;
let isUsingSupabase = false;

// Initialisation du client Supabase pour la connexion à la base de données
async function initSupabase() {
    try {
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion à la base de données Supabase établie');
            isUsingSupabase = true;
            
            // Vérifier si le bucket de stockage existe, sinon le créer
            await ensureStorageBucket();
            return true;
        } else {
            console.warn('⚠️ Client Supabase non trouvé. Mode hors ligne activé.');
            isUsingSupabase = false;
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:', error);
        isUsingSupabase = false;
        return false;
    }
}

// MODIFICATION 3: Vérification/création du bucket de stockage
async function ensureStorageBucket() {
    if (!supabase) return;
    
    try {
        // Vérifier si le bucket existe
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.warn('⚠️ Impossible de lister les buckets:', listError);
            return;
        }
        
        const bucketExists = buckets?.some(b => b.name === SUPABASE_STORAGE_BUCKET);
        
        if (!bucketExists) {
            // Créer le bucket s'il n'existe pas
            const { error: createError } = await supabase.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
                public: true,
                fileSizeLimit: 5 * 1024 * 1024 // 5MB
            });
            
            if (createError) {
                console.error('❌ Erreur création du bucket:', createError);
            } else {
                console.log(`✅ Bucket "${SUPABASE_STORAGE_BUCKET}" créé avec succès`);
            }
        } else {
            console.log(`✅ Bucket "${SUPABASE_STORAGE_BUCKET}" existe déjà`);
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du bucket:', error);
    }
}

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

// Variables pour la gestion des images et des fichiers
let uploadedImages = [];
let imageFiles = [];
let currentUserId = null;

// Constantes de configuration
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
            if (fileInput) fileInput.click();
        });
    }

    // Gestion des fichiers sélectionnés via input
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
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

        if (!file.type.startsWith('image/')) {
            console.warn(`⚠️ Le fichier "${file.name}" n'est pas une image`);
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            console.warn(`⚠️ Le fichier "${file.name}" dépasse 5MB`);
            alert(`Le fichier "${file.name}" dépasse la taille maximale de 5MB`);
            continue;
        }

        if (uploadedImages.length >= MAX_IMAGES) {
            console.warn(`⚠️ Nombre maximum d'images atteint (${MAX_IMAGES})`);
            alert(`Vous ne pouvez ajouter que ${MAX_IMAGES} images maximum`);
            break;
        }

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

    updateImagePreviews();

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

    container.innerHTML = '';

    if (uploadedImages.length === 0) {
        container.innerHTML = '<p class="no-images">Aucune image sélectionnée</p>';
        return;
    }

    uploadedImages.forEach((image, index) => {
        const previewDiv = createImagePreview(image, index);
        container.appendChild(previewDiv);
    });

    console.log(`🖼️ ${uploadedImages.length} aperçu(s) d'image(s) affiché(s)`);

    const previewImage = document.getElementById('preview-image');
    if (previewImage) {
        if (uploadedImages.length > 0) {
            previewImage.src = uploadedImages[0].url;
        } else {
            previewImage.src = 'https://placehold.co/400x300?text=Votre+Image';
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

    if (image.url) {
        URL.revokeObjectURL(image.url);
    }

    uploadedImages.splice(index, 1);
    imageFiles.splice(index, 1);

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

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment réinitialiser le formulaire ?')) {
                resetForm();
            }
        });
    }

    if (descriptionTextarea && charCount) {
        descriptionTextarea.addEventListener('input', () => {
            const count = descriptionTextarea.value.length;
            charCount.textContent = count;

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

// MODIFICATION 4: Soumission avec gestion Supabase améliorée
/**
 * Gère la soumission du formulaire
 * @param {Event} e - Événement de soumission
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    console.log('📝 Soumission du formulaire d\'annonce...');

    const formData = getFormData();
    const validation = validateFormData(formData);

    if (!validation.isValid) {
        showMessage('error', validation.errors.join(', '));
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication en cours...';
    submitBtn.disabled = true;

    try {
        let imageUrls = [];
        
        if (uploadedImages.length > 0) {
            if (isUsingSupabase && supabase) {
                imageUrls = await uploadImagesToSupabase();
            } else {
                console.log('📴 Mode hors ligne: utilisation des URLs locales');
                imageUrls = uploadedImages.map(img => img.url);
            }
        }

        const announcementData = prepareAnnouncementData(formData, imageUrls);

        let savedData = null;
        
        if (isUsingSupabase && supabase) {
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
            console.log('💾 Annonce sauvegardée localement:', savedData);
        }

        showMessage('success', 'Votre annonce a été publiée avec succès !');

        setTimeout(() => {
            window.location.href = 'annonces.html';
        }, 2000);

    } catch (error) {
        console.error('❌ Erreur lors de la publication:', error);
        showMessage('error', 'Erreur lors de la publication. Veuillez réessayer.');

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
        titre: document.getElementById('titre')?.value || '',
        description: document.getElementById('description')?.value || '',
        categorie: document.getElementById('categorie')?.value || '',
        etat: document.getElementById('etat')?.value || '',
        prix: document.getElementById('prix')?.value || '0',
        devise: document.getElementById('devise')?.value || 'XOF',
        localisation: document.getElementById('localisation')?.value || '',
        region: document.getElementById('region')?.value || '',
        nom: document.getElementById('nom')?.value || '',
        telephone: document.getElementById('telephone')?.value || '',
        email: document.getElementById('email')?.value || '',
        entreprise: document.getElementById('entreprise')?.value || ''
    };
}

/**
 * Valide les données du formulaire
 * @param {Object} formData - Données à valider
 * @returns {Object} Résultat de la validation
 */
function validateFormData(formData) {
    const errors = [];

    if (!formData.titre || formData.titre.trim().length < 5) {
        errors.push('Le titre doit contenir au moins 5 caractères');
    }

    if (!formData.description || formData.description.trim().length < 20) {
        errors.push('La description doit contenir au moins 20 caractères');
    }

    if (!formData.categorie) {
        errors.push('Veuillez sélectionner une catégorie');
    }

    if (!formData.etat) {
        errors.push('Veuillez sélectionner l\'état du produit');
    }

    if (!formData.prix || parseFloat(formData.prix) <= 0) {
        errors.push('Le prix doit être supérieur à 0');
    }

    if (!formData.localisation || formData.localisation.trim().length < 2) {
        errors.push('Veuillez indiquer votre localisation');
    }

    if (!formData.region) {
        errors.push('Veuillez sélectionner une région');
    }

    if (!formData.nom || formData.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }

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

    if (successDiv) successDiv.style.display = 'none';
    if (errorDiv) errorDiv.style.display = 'none';

    if (type === 'success' && successDiv) {
        const p = successDiv.querySelector('p');
        if (p) p.textContent = message;
        successDiv.style.display = 'flex';
    } else if (type === 'error' && errorDiv) {
        const p = errorDiv.querySelector('p');
        if (p) p.textContent = message;
        errorDiv.style.display = 'flex';
    }

    setTimeout(() => {
        if (successDiv) successDiv.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';
    }, 5000);
}

/**
 * Réinitialise le formulaire
 */
function resetForm() {
    const form = document.getElementById('annoncesForm');
    if (form) form.reset();

    uploadedImages = [];
    imageFiles = [];
    updateImagePreviews();

    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#6c757d';
    }

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
    if (!isUsingSupabase || !supabase) return;

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

        localStorage.removeItem('offline_announcements');
        console.log('✅ Synchronisation terminée');

    } catch (error) {
        console.error('❌ Erreur lors de la synchronisation:', error);
    }
}

// MODIFICATION 5: Récupération de l'ID utilisateur depuis Supabase Auth
/**
 * Récupère l'ID de l'utilisateur actuel
 * @returns {Promise<string|null>} ID de l'utilisateur
 */
async function getCurrentUserId() {
    if (isUsingSupabase && supabase) {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (!error && user) {
                return user.id;
            }
        } catch (error) {
            console.warn('Erreur récupération utilisateur:', error);
        }
    }
    
    // Fallback: vérifier dans localStorage
    try {
        const session = localStorage.getItem('user_session');
        if (session) {
            const sessionData = JSON.parse(session);
            return sessionData.user?.id || null;
        }
    } catch (e) {
        console.warn('Erreur récupération session:', e);
    }
    
    return null;
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
        livraison_possible: document.getElementById('livraison')?.checked || false,
        prix_negociable: document.getElementById('negociation')?.checked || false,
        annonce_urgente: document.getElementById('urgent')?.checked || false,
        type_annonce: isMaterialAnnouncement ? 'materiel' : 'autre',
        categorie_materiel: isMaterialAnnouncement ? getMaterialCategory(formData.description) : null,
        status: 'actif',
        created_at: new Date().toISOString(),
        views: 0,
        user_id: currentUserId
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

// ============================================================================
// UPLOAD DES IMAGES SUR SUPABASE STORAGE
// ============================================================================

// MODIFICATION 6: Upload amélioré avec gestion d'erreurs
/**
 * Upload les images sur Supabase Storage
 * @returns {Promise<Array>} URLs des images uploadées
 */
async function uploadImagesToSupabase() {
    if (!supabase || uploadedImages.length === 0) {
        return [];
    }

    const imageUrls = [];

    try {
        console.log(`📤 Upload de ${uploadedImages.length} image(s) vers la base de données...`);

        for (let i = 0; i < uploadedImages.length; i++) {
            const image = uploadedImages[i];
            const fileName = `${Date.now()}_${i}_${image.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const filePath = `annonces/${fileName}`;

            const { error } = await supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .upload(filePath, image.file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(SUPABASE_STORAGE_BUCKET)
                .getPublicUrl(filePath);

            imageUrls.push(publicUrl);
            console.log(`✅ Image ${i + 1}/${uploadedImages.length} uploadée: ${fileName}`);
        }

        console.log(`🎉 ${imageUrls.length} image(s) uploadées avec succès`);
        return imageUrls;

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload des images:', error);
        throw new Error('Échec de l\'upload des images. Veuillez réessayer.');
    }
}

// ============================================================================
// ENREGISTREMENT LOCAL
// ============================================================================

/**
 * Ajoute l'annonce aux stockages locaux utilisés par la page `annonces.html`
 * @param {Object} annonce
 */
function registerLocalAnnouncement(annonce) {
    try {
        const localList = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        localList.unshift(annonce);
        localStorage.setItem('local_annonces', JSON.stringify(localList));

        const recent = JSON.parse(localStorage.getItem('recent_annonces') || '[]');
        recent.unshift(annonce);
        localStorage.setItem('recent_annonces', JSON.stringify(recent.slice(0, 20)));

        localStorage.setItem('just_published', 'true');
        localStorage.setItem('new_announcement', JSON.stringify(annonce));
        localStorage.setItem('highlight_announcement_id', annonce.id);

        console.log('✅ Annonce enregistrée dans localStorage pour affichage:', annonce);
    } catch (err) {
        console.error('Erreur lors de l\'enregistrement local de l\'annonce:', err);
    }
}

// ============================================================================
// VALIDATIONS TEMPS RÉEL ET APERÇU
// ============================================================================

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

    if (inputs.titre && previewElements.title) {
        inputs.titre.addEventListener('input', (e) => {
            previewElements.title.textContent = e.target.value || 'Titre de votre annonce';
        });
    }

    const updatePrice = () => {
        if (previewElements.price) {
            const price = inputs.prix?.value || '0';
            const currency = inputs.devise?.value || 'XOF';
            previewElements.price.textContent = price ? `${parseInt(price).toLocaleString()} ${currency}` : '0 FCFA';
        }
    };
    
    if (inputs.prix) inputs.prix.addEventListener('input', updatePrice);
    if (inputs.devise) inputs.devise.addEventListener('change', updatePrice);

    if (inputs.localisation && previewElements.location) {
        inputs.localisation.addEventListener('input', (e) => {
            previewElements.location.textContent = e.target.value || 'Votre Ville';
        });
    }

    if (inputs.categorie && previewElements.category) {
        inputs.categorie.addEventListener('change', (e) => {
            const selectedText = e.target.options[e.target.selectedIndex]?.text || '';
            previewElements.category.textContent = e.target.value ? selectedText.split('(')[0].trim().toUpperCase() : 'CATÉGORIE';
        });
    }

    if (inputs.description && previewElements.description) {
        inputs.description.addEventListener('input', (e) => {
            previewElements.description.textContent = e.target.value || 'La description de votre produit s\'affichera ici.';
        });
    }

    if (inputs.livraison && previewElements.delivery) {
        inputs.livraison.addEventListener('change', (e) => {
            previewElements.delivery.style.display = e.target.checked ? 'flex' : 'none';
        });
    }

    if (inputs.urgent && previewElements.badge) {
        inputs.urgent.addEventListener('change', (e) => {
            previewElements.badge.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                previewElements.badge.textContent = 'Urgent';
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

    field.parentNode?.appendChild(errorDiv);
    field.classList.add('error');
}

/**
 * Efface l'erreur d'un champ
 * @param {HTMLElement} field - Champ concerné
 */
function clearFieldError(field) {
    const existingError = field.parentNode?.querySelector('.field-error');
    if (existingError) existingError.remove();
    field.classList.remove('error');
}

// ============================================================================
// INITIALISATION
// ============================================================================

/**
 * Initialise la page de création d'annonce
 */
async function initializePage() {
    console.log('🚀 Initialisation de la page création d\'annonce...');
    
    // Initialiser Supabase
    await initSupabase();
    
    // Récupérer l'ID utilisateur
    currentUserId = await getCurrentUserId();
    
    if (currentUserId) {
        console.log('👤 Utilisateur connecté:', currentUserId);
    } else {
        console.log('⚠️ Aucun utilisateur connecté - publication en mode invité');
    }

    setupFormEvents();
    setupImageUpload();
    updateImagePreviews();

    if (isUsingSupabase && navigator.onLine) {
        await syncOfflineAnnouncements();
    }

    setupRealTimeValidation();
    setupLivePreview();

    console.log('✅ Page création d\'annonce initialisée');
    console.log(`📡 Statut Supabase: ${isUsingSupabase ? 'Connecté' : 'Hors ligne'}`);
}

// ============================================================================
// ÉVÉNEMENTS ET EXÉCUTION
// ============================================================================

document.addEventListener('DOMContentLoaded', initializePage);

window.addEventListener('online', () => {
    console.log('🟢 Connexion rétablie');
    if (isUsingSupabase) {
        syncOfflineAnnouncements();
    }
});

// Exporter des fonctions pour un usage global
window.AnnouncementCreator = {
    validateForm: validateFormData,
    syncOfflineData: syncOfflineAnnouncements,
    getOfflineCount: () => {
        const data = JSON.parse(localStorage.getItem('offline_announcements') || '[]');
        return data.length;
    },
    isOnline: () => isUsingSupabase
};

console.log('✅ Script creation-annonce.js chargé');