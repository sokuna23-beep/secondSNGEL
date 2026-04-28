/**
 * Fichier: supabase-config.js
 * Description: Configuration centralisée de Supabase pour Sénégal Élevage
 * Version: 2.0.0
 * 
 * ⚠️ INSTRUCTIONS:
 * 1. Ce fichier contient maintenant les vraies clés de connexion
 * 2. Il est compatible avec tous les scripts du projet
 * 3. Le mode hors-ligne est automatiquement géré
 */

// ============================================================================
// 🔑 VOS CLÉS SUPABASE (CONFIGURÉES)
// ============================================================================

// MODIFICATION 1: Remplacement des placeholders par les vraies valeurs
const SUPABASE_URL = 'https://mykmnwdeqwtpnnsvnlkf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15a21ud2RlcXd0cG5uc3ZubGtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5Mjg5NzEsImV4cCI6MjA5MjUwNDk3MX0.Im2wNcNeRIH4ToI694EWvVQ4N5pW5FcukP_kFjuUHag';

// Configuration supplémentaire
const SUPABASE_STORAGE_BUCKET = 'annonces-images';
const SUPABASE_TABLES = {
    annonces: 'annonces',
    eleveurs: 'eleveurs',
    messages: 'messages',
    favoris: 'favoris',
    services: 'services'
};

// ============================================================================
// INITIALISATION DU CLIENT SUPABASE
// ============================================================================

let supabase = null;
let isInitialized = false;

/**
 * Initialise le client Supabase
 * @returns {boolean} true si l'initialisation a réussi
 */
function initSupabaseClient() {
    try {
        // Vérifier que la librairie Supabase est chargée
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            console.warn('⚠️ Librairie Supabase non chargée. Mode hors-ligne activé.');
            console.warn('💡 Assurez-vous d\'inclure: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
            return false;
        }

        // Vérifier que les clés sont configurées
        if (SUPABASE_URL.includes('mykmnwdeqwtpnnsvnlkf') === false) {
            console.warn('⚠️ URL Supabase non valide');
            return false;
        }

        // Créer le client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                storage: localStorage,
                autoRefreshToken: true
            }
        });
        
        isInitialized = true;
        console.log('✅ Supabase connecté avec succès');
        console.log(`📡 URL: ${SUPABASE_URL}`);
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
    return supabase !== null && isInitialized;
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {Promise<boolean>}
 */
async function isUserLoggedIn() {
    if (!supabase) return false;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session !== null;
    } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        return false;
    }
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
 * @returns {Object} Subscription object
 */
function onAuthStateChange(callback) {
    if (!supabase) return { unsubscribe: () => {} };
    return supabase.auth.onAuthStateChange((event, session) => {
        console.log(`🔄 Auth event: ${event}`);
        callback(event, session);
    });
}

// ============================================================================
// FONCTIONS STORAGE (Upload d'images)
// ============================================================================

/**
 * Upload une image sur Supabase Storage
 * @param {File} file - Le fichier image
 * @param {string} folder - Dossier de destination (par défaut: 'annonces')
 * @returns {Promise<string|null>} URL publique de l'image ou null
 */
async function uploadImage(file, folder = 'annonces') {
    if (!supabase) {
        console.warn('⚠️ Supabase non connecté. Image non uploadée.');
        return null;
    }

    try {
        // Vérifier que le bucket existe
        await ensureStorageBucket();
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(fileName);

        console.log('✅ Image uploadée:', publicUrl);
        return publicUrl;

    } catch (error) {
        console.error('❌ Erreur lors de l\'upload:', error.message);
        return null;
    }
}

/**
 * Vérifie et crée le bucket de stockage si nécessaire
 */
async function ensureStorageBucket() {
    if (!supabase) return;
    
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.warn('⚠️ Impossible de lister les buckets:', error);
            return;
        }
        
        const bucketExists = buckets?.some(b => b.name === SUPABASE_STORAGE_BUCKET);
        
        if (!bucketExists) {
            const { error: createError } = await supabase.storage.createBucket(
                SUPABASE_STORAGE_BUCKET,
                { public: true, fileSizeLimit: 5242880 } // 5MB
            );
            
            if (createError) {
                console.error('❌ Erreur création bucket:', createError);
            } else {
                console.log(`✅ Bucket "${SUPABASE_STORAGE_BUCKET}" créé`);
            }
        }
    } catch (error) {
        console.error('❌ Erreur vérification bucket:', error);
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
            .from(SUPABASE_TABLES.annonces)
            .insert([{
                ...annonceData,
                created_at: new Date().toISOString(),
                status: 'actif',
                views: 0
            }])
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Annonce créée dans Supabase:', data.id);
        return data;

    } catch (error) {
        console.error('❌ Erreur création annonce:', error.message);
        saveToLocalStorage('local_annonces', annonceData);
        return null;
    }
}

/**
 * Récupérer toutes les annonces actives
 * @param {Object} filters - Filtres optionnels { categorie, region, search, limit }
 * @returns {Promise<Array>} Liste des annonces
 */
async function getAnnonces(filters = {}) {
    if (!supabase) {
        console.warn('⚠️ Mode hors-ligne: chargement depuis localStorage');
        return JSON.parse(localStorage.getItem('local_annonces') || '[]');
    }

    try {
        let query = supabase
            .from(SUPABASE_TABLES.annonces)
            .select('*')
            .eq('status', 'actif')
            .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (filters.categorie && filters.categorie !== 'all') {
            query = query.eq('categorie', filters.categorie);
        }
        if (filters.sous_categorie) {
            query = query.eq('sous_categorie', filters.sous_categorie);
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
            .from(SUPABASE_TABLES.annonces)
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
            .from(SUPABASE_TABLES.annonces)
            .update({ ...updates, updated_at: new Date().toISOString() })
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
            .from(SUPABASE_TABLES.annonces)
            .update({ status: 'supprime', updated_at: new Date().toISOString() })
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
// FONCTIONS POUR LES SERVICES
// ============================================================================

/**
 * Récupérer tous les services actifs
 * @param {Object} filters - Filtres optionnels
 * @returns {Promise<Array>}
 */
async function getServices(filters = {}) {
    if (!supabase) {
        return JSON.parse(localStorage.getItem('services_data') || '[]');
    }

    try {
        let query = supabase
            .from(SUPABASE_TABLES.services || 'services')
            .select('*')
            .eq('status', 'actif')
            .order('created_at', { ascending: false });

        if (filters.category && filters.category !== 'all') {
            query = query.eq('categorie', filters.category);
        }
        if (filters.region) {
            query = query.eq('region', filters.region);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];

    } catch (error) {
        console.error('❌ Erreur chargement services:', error.message);
        return [];
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
                data: {
                    nom_complet: metadata.nom || metadata.name || '',
                    telephone: metadata.telephone || ''
                }
            }
        });

        if (error) throw error;

        // Créer le profil dans la table eleveurs
        if (data.user) {
            const { error: profileError } = await supabase
                .from(SUPABASE_TABLES.eleveurs)
                .insert([{
                    user_id: data.user.id,
                    nom_complet: metadata.nom || metadata.name || '',
                    telephone: metadata.telephone || '',
                    email: email,
                    role: 'eleveur',
                    status: 'actif'
                }]);

            if (profileError) {
                console.warn('⚠️ Erreur création profil:', profileError.message);
            }
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
    if (!supabase) {
        // Nettoyer localStorage même hors ligne
        localStorage.removeItem('user_session');
        localStorage.removeItem('user_data');
        return true;
    }

    try {
        await supabase.auth.signOut();
        localStorage.removeItem('user_session');
        localStorage.removeItem('user_data');
        console.log('✅ Déconnexion réussie');
        return true;
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error.message);
        return false;
    }
}

// ============================================================================
// FONCTIONS POUR LES MESSAGES DE CONTACT
// ============================================================================

/**
 * Envoyer un message de contact
 * @param {Object} messageData - Données du message
 * @returns {Promise<Object>}
 */
async function sendContactMessage(messageData) {
    if (!supabase) {
        saveToLocalStorage('contact_messages', messageData);
        return { success: true, local: true };
    }

    try {
        const { data, error } = await supabase
            .from(SUPABASE_TABLES.messages)
            .insert([{
                nom: messageData.name,
                email: messageData.email,
                telephone: messageData.phone,
                sujet: messageData.subject,
                message: messageData.message,
                status: 'non_lu'
            }])
            .select();

        if (error) throw error;
        
        console.log('✅ Message envoyé via Supabase');
        return { success: true, data: data[0] };

    } catch (error) {
        console.error('❌ Erreur envoi message:', error.message);
        saveToLocalStorage('contact_messages', messageData);
        return { success: true, local: true };
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
        const newData = {
            ...data,
            id: data.id || Date.now(),
            created_at: data.created_at || new Date().toISOString()
        };
        existing.unshift(newData);
        
        // Garder seulement les 100 derniers
        if (existing.length > 100) existing.splice(100);
        
        localStorage.setItem(key, JSON.stringify(existing));
        console.log(`💾 Données sauvegardées localement (${key})`);
    } catch (error) {
        console.error('❌ Erreur localStorage:', error);
    }
}

/**
 * Initialiser la session utilisateur depuis localStorage
 * @returns {Object|null} Session utilisateur
 */
function initUserSession() {
    try {
        const session = localStorage.getItem('user_session');
        if (session) {
            const sessionData = JSON.parse(session);
            const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
            if (sessionAge < 24 * 60 * 60 * 1000) {
                return sessionData.user;
            }
        }
    } catch (e) {
        console.warn('Erreur lecture session:', e);
    }
    return null;
}

// ============================================================================
// INITIALISATION AUTOMATIQUE
// ============================================================================

// Initialiser dès que le script est chargé
const supabaseReady = initSupabaseClient();

// Exporter les variables globales pour les autres scripts
window.supabaseClient = supabase;
window.isSupabaseConnected = isSupabaseConnected;

// Export global pour les autres scripts (API complète)
window.SupabaseAPI = {
    // État
    isConnected: isSupabaseConnected,
    isUserLoggedIn,
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
    
    // Services
    getServices,
    
    // Messages
    sendContactMessage,
    
    // Storage
    uploadImage,
    
    // Utils
    saveToLocalStorage,
    initUserSession
};

// Exporter également les constantes
window.SUPABASE_CONFIG = {
    URL: SUPABASE_URL,
    STORAGE_BUCKET: SUPABASE_STORAGE_BUCKET,
    TABLES: SUPABASE_TABLES
};

console.log('📦 supabase-config.js chargé — API disponible');
console.log(`📡 Statut: ${supabaseReady ? 'Connecté à Supabase' : 'Mode hors-ligne'}`);