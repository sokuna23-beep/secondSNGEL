/**
 * Fichier: supabase-config.js
 * Description: Configuration centralisée de Supabase pour Sénégal Élevage
 * 
 * ⚠️ INSTRUCTIONS:
 * 1. Allez sur https://supabase.com et créez un projet
 * 2. Copiez votre Project URL et anon key depuis Settings > API
 * 3. Remplacez les valeurs ci-dessous par les vôtres
 */

// ============================================================================
// 🔑 VOS CLÉS SUPABASE (à remplacer)
// ============================================================================

const SUPABASE_URL = 'https://VOTRE-PROJET-ID.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE-CLE-ANON-PUBLIQUE';

// ============================================================================
// INITIALISATION DU CLIENT SUPABASE
// ============================================================================

let supabase = null;

/**
 * Initialise le client Supabase
 * @returns {boolean} true si l'initialisation a réussi
 */
function initSupabaseClient() {
    try {
        // Vérifier que la librairie Supabase est chargée
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            console.warn('⚠️ Librairie Supabase non chargée. Mode hors-ligne activé.');
            return false;
        }

        // Vérifier que les clés sont configurées
        if (SUPABASE_URL.includes('VOTRE-PROJET-ID') || SUPABASE_ANON_KEY.includes('VOTRE-CLE')) {
            console.warn('⚠️ Clés Supabase non configurées. Modifiez supabase-config.js avec vos clés.');
            console.warn('📖 Suivez le guide: GUIDE_SUPABASE.md');
            return false;
        }

        // Créer le client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase connecté avec succès');
        return true;

    } catch (error) {
        console.error('❌ Erreur de connexion Supabase:', error.message);
        return false;
    }
}

// ============================================================================
// FONCTIONS D'AIDE (helpers)
// ============================================================================

/**
 * Vérifie si Supabase est connecté
 * @returns {boolean}
 */
function isSupabaseConnected() {
    return supabase !== null;
}

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns {Promise<Object|null>} L'utilisateur ou null
 */
async function getCurrentUser() {
    if (!supabase) return null;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('❌ Erreur getCurrentUser:', error);
        return null;
    }
}

/**
 * Écoute les changements d'état d'authentification
 * @param {Function} callback - Fonction appelée à chaque changement
 */
function onAuthStateChange(callback) {
    if (!supabase) return;
    supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

/**
 * Upload une image sur Supabase Storage
 * @param {File} file - Le fichier image
 * @param {string} bucket - Le nom du bucket (par défaut: 'annonces')
 * @returns {Promise<string|null>} URL publique de l'image ou null
 */
async function uploadImage(file, bucket = 'annonces') {
    if (!supabase) {
        console.warn('⚠️ Supabase non connecté. Image non uploadée.');
        return null;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

        if (error) {
            console.error('❌ Erreur upload image:', error.message);
            return null;
        }

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        console.log('✅ Image uploadée:', publicUrl);
        return publicUrl;

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error);
        return null;
    }
}

// ============================================================================
// FONCTIONS CRUD POUR LES ANNONCES
// ============================================================================

/**
 * Créer une nouvelle annonce dans Supabase
 * @param {Object} annonceData - Données de l'annonce
 * @returns {Promise<Object|null>} L'annonce créée ou null
 */
async function createAnnonce(annonceData) {
    if (!supabase) {
        console.warn('⚠️ Mode hors-ligne: annonce sauvegardée localement');
        saveToLocalStorage('local_annonces', annonceData);
        return annonceData;
    }

    try {
        const { data, error } = await supabase
            .from('annonces')
            .insert([annonceData])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Annonce créée dans Supabase:', data.id);
        return data;

    } catch (error) {
        console.error('❌ Erreur création annonce:', error.message);
        // Fallback: sauvegarder localement
        saveToLocalStorage('local_annonces', annonceData);
        return null;
    }
}

/**
 * Récupérer toutes les annonces actives
 * @param {Object} filters - Filtres optionnels { categorie, region, search }
 * @returns {Promise<Array>} Liste des annonces
 */
async function getAnnonces(filters = {}) {
    if (!supabase) {
        console.warn('⚠️ Mode hors-ligne: chargement depuis localStorage');
        return JSON.parse(localStorage.getItem('local_annonces') || '[]');
    }

    try {
        let query = supabase
            .from('annonces')
            .select('*')
            .eq('status', 'actif')
            .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (filters.categorie && filters.categorie !== 'all') {
            query = query.eq('categorie', filters.categorie);
        }
        if (filters.region) {
            query = query.eq('region', filters.region);
        }
        if (filters.search) {
            query = query.or(`titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        console.log(`✅ ${data.length} annonces chargées depuis Supabase`);
        return data;

    } catch (error) {
        console.error('❌ Erreur chargement annonces:', error.message);
        return JSON.parse(localStorage.getItem('local_annonces') || '[]');
    }
}

/**
 * Récupérer une annonce par son ID
 * @param {number|string} id - ID de l'annonce
 * @returns {Promise<Object|null>} L'annonce ou null
 */
async function getAnnonceById(id) {
    if (!supabase) {
        const annonces = JSON.parse(localStorage.getItem('local_annonces') || '[]');
        return annonces.find(a => a.id == id) || null;
    }

    try {
        const { data, error } = await supabase
            .from('annonces')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('❌ Erreur chargement annonce:', error.message);
        return null;
    }
}

/**
 * Mettre à jour une annonce
 * @param {number} id - ID de l'annonce
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object|null>}
 */
async function updateAnnonce(id, updates) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('annonces')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        console.log('✅ Annonce mise à jour:', id);
        return data;

    } catch (error) {
        console.error('❌ Erreur mise à jour:', error.message);
        return null;
    }
}

/**
 * Supprimer une annonce (soft delete)
 * @param {number} id - ID de l'annonce
 * @returns {Promise<boolean>}
 */
async function deleteAnnonce(id) {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('annonces')
            .update({ status: 'supprime' })
            .eq('id', id);

        if (error) throw error;
        console.log('✅ Annonce supprimée:', id);
        return true;

    } catch (error) {
        console.error('❌ Erreur suppression:', error.message);
        return false;
    }
}

// ============================================================================
// FONCTIONS D'AUTHENTIFICATION
// ============================================================================

/**
 * Inscription d'un nouvel utilisateur
 * @param {string} email
 * @param {string} password
 * @param {Object} metadata - Données supplémentaires (nom, telephone, etc.)
 * @returns {Promise<Object>} { user, error }
 */
async function signUp(email, password, metadata = {}) {
    if (!supabase) return { user: null, error: 'Supabase non connecté' };

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });

        if (error) throw error;

        // Créer le profil dans la table profils
        if (data.user) {
            await supabase.from('profils').insert([{
                id: data.user.id,
                nom: metadata.nom || '',
                telephone: metadata.telephone || '',
                role: metadata.role || 'eleveur'
            }]);
        }

        console.log('✅ Utilisateur inscrit:', email);
        return { user: data.user, error: null };

    } catch (error) {
        console.error('❌ Erreur inscription:', error.message);
        return { user: null, error: error.message };
    }
}

/**
 * Connexion d'un utilisateur
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} { user, session, error }
 */
async function signIn(email, password) {
    if (!supabase) return { user: null, session: null, error: 'Supabase non connecté' };

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        console.log('✅ Connexion réussie:', email);
        return { user: data.user, session: data.session, error: null };

    } catch (error) {
        console.error('❌ Erreur connexion:', error.message);
        return { user: null, session: null, error: error.message };
    }
}

/**
 * Déconnexion
 * @returns {Promise<boolean>}
 */
async function signOut() {
    if (!supabase) return false;

    try {
        await supabase.auth.signOut();
        console.log('✅ Déconnexion réussie');
        return true;
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error.message);
        return false;
    }
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Sauvegarde des données dans localStorage (fallback hors-ligne)
 * @param {string} key - Clé de stockage
 * @param {Object} data - Données à sauvegarder
 */
function saveToLocalStorage(key, data) {
    try {
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        data.id = data.id || Date.now();
        data.created_at = data.created_at || new Date().toISOString();
        existing.unshift(data);
        localStorage.setItem(key, JSON.stringify(existing));
        console.log(`💾 Données sauvegardées localement (${key})`);
    } catch (error) {
        console.error('❌ Erreur localStorage:', error);
    }
}

// ============================================================================
// INITIALISATION AUTOMATIQUE
// ============================================================================

// Initialiser dès que le script est chargé
const supabaseReady = initSupabaseClient();

// Export global pour les autres scripts
window.supabaseClient = supabase;
window.SupabaseAPI = {
    // État
    isConnected: isSupabaseConnected,
    client: () => supabase,

    // Auth
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    onAuthStateChange,

    // Annonces CRUD
    createAnnonce,
    getAnnonces,
    getAnnonceById,
    updateAnnonce,
    deleteAnnonce,

    // Storage
    uploadImage,

    // Utils
    saveToLocalStorage
};

console.log('📦 supabase-config.js chargé — API disponible via window.SupabaseAPI');
