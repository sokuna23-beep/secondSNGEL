/**
 * Fichier: authentification.js
 * Description: Script unifié pour la page d'authentification de Sénégal Élevage
 * Gère la connexion, l'inscription et les fonctionnalités associées
 * Version: 2.0.0
 * Auteur: Sénégal Élevage Team
 */

// ============================================================================
// CONFIGURATION SUPABASE (Base de données PostgreSQL)
// ============================================================================

// Configuration de la connexion à la base de données Supabase
const SUPABASE_URL = 'https://votre-projet.supabase.co'; // URL de votre projet Supabase
const SUPABASE_ANON_KEY = 'votre_cle_anon_public'; // Clé publique pour l'accès anonyme

// Variable globale pour le client Supabase
let supabaseClient = null;

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

// Configuration des comptes de démonstration
const DEMO_ACCOUNTS = {
    eleveur: {
        email: 'eleveur@senegal-elevage.sn',
        password: 'demo123',
        name: 'Ibahima Sall',
        role: 'eleveur',
        phone: '+221 77 123 45 67',
        region: 'Dakar'
    },
    admin: {
        email: 'admin@senegal-elevage.sn',
        password: 'admin123',
        name: 'Administrateur',
        role: 'admin',
        phone: '+221 33 800 00 00',
        region: 'Dakar'
    }
};

// Variables pour la gestion de la session
let currentUser = null;
let rememberMe = false;

// ============================================================================
// FONCTIONS D'INITIALISATION
// ============================================================================

/**
 * Initialise la page d'authentification
 */
function initializeAuthPage() {
    console.log('🚀 Initialisation de la page d\'authentification...');
    
    try {
        // 1. Initialiser la connexion à la base de données
        const supabaseReady = initSupabase();
        
        if (!supabaseReady) {
            console.warn('⚠️ Base de données non initialisée, fonctionnement en mode local uniquement');
        }
        
        // 2. Vérifier si l'utilisateur est déjà connecté
        checkExistingSession();
        
        // 3. Configurer les événements du formulaire
        setupFormEvents();
        
        // 4. Configurer les événements de l'interface
        setupUIEvents();
        
        // 5. Configurer le toggle entre connexion et inscription
        setupAuthToggle();
        
        console.log('✅ Page d\'authentification initialisée');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showMessage('Erreur lors du chargement de la page d\'authentification', 'error');
    }
}

/**
 * Initialise la connexion à la base de données Supabase
 * @returns {boolean} True si l'initialisation a réussi
 */
function initSupabase() {
    try {
        // Vérifier si le client Supabase est disponible (script chargé)
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Connexion à la base de données Supabase établie');
            return true;
        } else {
            console.error('❌ Client Supabase non chargé. Vérifiez le script dans le HTML.');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        return false;
    }
}

/**
 * Vérifie si une session utilisateur existe déjà
 */
function checkExistingSession() {
    try {
        const savedSession = localStorage.getItem('user_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            
            // Vérifier si la session est encore valide (24h)
            const sessionAge = Date.now() - new Date(session.created_at).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 heures
            
            if (sessionAge < maxAge) {
                currentUser = session.user;
                console.log('👤 Session existante trouvée:', currentUser);
                
                // Rediriger vers le tableau de bord approprié
                redirectToDashboard();
            } else {
                // Session expirée, la supprimer
                localStorage.removeItem('user_session');
                console.log('⏰ Session expirée, supprimée');
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de session:', error);
    }
}

/**
 * Configure le toggle entre connexion et inscription
 */
function setupAuthToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetForm = this.getAttribute('data-form');
            
            // Mettre à jour les classes actives
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Afficher le formulaire correspondant avec animation
            if (targetForm === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
                loginForm.classList.add('fade-in');
            } else {
                registerForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
                registerForm.classList.add('fade-in');
            }
            
            // Nettoyer les messages
            clearMessages();
        });
    });
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Vérifie la force du mot de passe
 * @param {string} password - Mot de passe à vérifier
 * @returns {Object} { level: string, color: string, score: number }
 */
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Vérification de la longueur minimale
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Vérification des caractères divers
    if (/[a-z]/.test(password)) strength += 1; // minuscules
    if (/[A-Z]/.test(password)) strength += 1; // majuscules
    if (/\d/.test(password)) strength += 1;     // chiffres
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // caractères spéciaux
    
    // Détermination du niveau de force
    if (strength <= 2) {
        return { level: 'faible', color: '#dc3545', score: strength };
    } else if (strength <= 4) {
        return { level: 'moyen', color: '#ffc107', score: strength };
    } else {
        return { level: 'fort', color: '#28a745', score: strength };
    }
}

/**
 * Valide les données du formulaire d'inscription
 * @param {Object} formData - Données du formulaire
 * @returns {Array} Liste des erreurs de validation
 */
function validateRegistrationForm(formData) {
    const errors = [];
    
    // Validation du nom complet
    if (!formData.nom || formData.nom.trim().length < 2) {
        errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    // Validation du téléphone (format sénégalais)
    const phoneNumber = formData.telephone.replace(/\s/g, '');
    const prefix = phoneNumber.substring(0, 2);
    
    // Vérifier le préfixe sénégalais
    const validPrefixes = ['77', '76', '70', '78', '33'];
    if (!validPrefixes.includes(prefix)) {
        errors.push('Le numéro doit commencer par 77, 76, 70, 78 ou 33');
    }
    
    // Vérifier la longueur totale (9 chiffres pour le Sénégal)
    if (phoneNumber.length !== 9) {
        errors.push('Le numéro de téléphone doit contenir 9 chiffres');
    }
    
    // Vérifier que ce sont bien des chiffres
    if (!/^\d+$/.test(phoneNumber)) {
        errors.push('Le numéro de téléphone ne doit contenir que des chiffres');
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        errors.push('Veuillez entrer une adresse email valide');
    }
    
    // Validation du mot de passe
    if (formData.password.length < 8) {
        errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    
    if (formData.password !== formData.confirm_password) {
        errors.push('Les mots de passe ne correspondent pas');
    }
    
    // Validation des conditions
    if (!formData.conditions) {
        errors.push('Vous devez accepter les conditions d\'utilisation');
    }
    
    return errors;
}

/**
 * Valide les données de connexion
 * @param {Object} loginData - Données de connexion
 * @returns {boolean} True si valide
 */
function validateLoginForm(loginData) {
    // Validation de l'email
    if (!loginData.email) {
        showMessage('Veuillez entrer votre adresse email', 'error');
        return false;
    }
    
    if (!isValidEmail(loginData.email)) {
        showMessage('Veuillez entrer une adresse email valide', 'error');
        return false;
    }
    
    // Validation du mot de passe
    if (!loginData.password) {
        showMessage('Veuillez entrer votre mot de passe', 'error');
        return false;
    }
    
    if (loginData.password.length < 6) {
        showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
        return false;
    }
    
    return true;
}

/**
 * Vérifie si une adresse email est valide
 * @param {string} email - Email à vérifier
 * @returns {boolean} True si valide
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ============================================================================
// FONCTIONS D'INTERACTION AVEC LA BASE DE DONNÉES
// ============================================================================

/**
 * Formate les données pour l'insertion dans la base de données Supabase
 * @param {Object} formData - Données brutes du formulaire
 * @returns {Object} Données formatées pour la base de données
 */
function formatDataForSupabase(formData) {
    return {
        // Informations personnelles
        nom_complet: formData.nom.trim(),
        telephone: formData.telephone.replace(/\s/g, ''), // Nettoyer le téléphone
        email: formData.email.toLowerCase().trim(),
        date_naissance: formData.date_naissance || null,
        genre: formData.genre || null,
        
        // Localisation
        region: formData.region,
        ville: formData.ville?.trim() || null,
        
        // Activité d'élevage
        type_elevage: formData.type_elevage || null,
        taille_troupeau: formData.taille_troupeau || null,
        experience: formData.experience || null,
        
        // Préférences
        newsletter_optin: formData.newsletter || false,
        
        // Métadonnées système pour la base de données
        created_at: new Date().toISOString(),
        status: 'actif',
        // Note: Le mot de passe n'est pas stocké ici, il sera géré par l'authentification Supabase
    };
}

/**
 * Enregistre un nouvel utilisateur dans la base de données Supabase
 * @param {Object} formData - Données du formulaire d'inscription
 * @returns {Promise<Object>} Résultat de l'opération
 */
async function registerUserInSupabase(formData) {
    try {
        console.log('🔐 Création du compte d\'authentification dans la base de données...');
        
        // 1. Créer l'utilisateur avec l'authentification Supabase
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    nom_complet: formData.nom,
                    telephone: formData.telephone,
                }
            }
        });
        
        if (authError) throw authError;
        
        console.log('✅ Compte d\'authentification créé avec succès');
        
        // 2. Enregistrer les informations supplémentaires dans la table 'eleveurs'
        console.log('💾 Enregistrement du profil dans la base de données...');
        const userData = formatDataForSupabase(formData);
        userData.user_id = authData.user.id; // Lier au compte d'authentification
        
        const { data: profileData, error: profileError } = await supabaseClient
            .from('eleveurs') // Table des éleveurs dans la base de données
            .insert([userData])
            .select()
            .single();
            
        if (profileError) throw profileError;
        
        console.log('✅ Profil enregistré avec succès dans la base de données');
        
        return {
            success: true,
            userId: authData.user.id,
            profileId: profileData.id,
            email: authData.user.email
        };
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement dans la base de données:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Vérifie si un email existe déjà dans la base de données
 * @param {string} email - Email à vérifier
 * @returns {Promise<boolean>} True si l'email existe déjà
 */
async function checkEmailExists(email) {
    try {
        console.log(`🔍 Vérification de l'email ${email} dans la base de données...`);
        
        const { data, error } = await supabaseClient
            .from('eleveurs') // Table des éleveurs dans la base de données
            .select('email')
            .eq('email', email.toLowerCase())
            .maybeSingle();
            
        if (error) throw error;
        
        const exists = !!data;
        console.log(`📧 Email ${email} ${exists ? 'existe déjà' : 'disponible'}`);
        return exists;
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'email dans la base de données:', error);
        return false;
    }
}

// ============================================================================
// GESTION DES ÉVÉNEMENTS
// ============================================================================

/**
 * Configure tous les événements des formulaires
 */
function setupFormEvents() {
    // Formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Formulaire d'inscription
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    console.log('✅ Événements des formulaires configurés');
}

/**
 * Configure les événements de l'interface utilisateur
 */
function setupUIEvents() {
    // Toggle des mots de passe
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Gérer "Se souvenir de moi"
    const rememberMeCheckbox = document.getElementById('remember-me');
    if (rememberMeCheckbox) {
        rememberMeCheckbox.addEventListener('change', (e) => {
            rememberMe = e.target.checked;
        });
    }
    
    // Gérer "Mot de passe oublié"
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
    }
    
    // Vérification de la force du mot de passe en temps réel
    const passwordInput = document.getElementById('register-password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value);
        });
    }
    
    // Vérification de la correspondance des mots de passe
    const confirmPasswordInput = document.getElementById('register-confirm-password');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Formatage automatique du numéro de téléphone
    const telephoneInput = document.getElementById('register-telephone');
    if (telephoneInput) {
        telephoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                value = value.match(/.{1,2}/g).join(' ');
            }
            
            e.target.value = value;
        });
    }
    
    console.log('✅ Événements de l\'interface configurés');
}

/**
 * Met à jour l'indicateur de force du mot de passe
 * @param {string} password - Mot de passe à évaluer
 */
function updatePasswordStrength(password) {
    const strengthContainer = document.getElementById('passwordStrength');
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (password.length === 0) {
        if (strengthContainer) strengthContainer.style.display = 'none';
        return;
    }
    
    if (strengthContainer) strengthContainer.style.display = 'block';
    
    const strength = checkPasswordStrength(password);
    
    // Mise à jour de l'interface
    if (strengthFill) {
        strengthFill.style.width = (strength.score * 20) + '%';
        strengthFill.style.backgroundColor = strength.color;
    }
    if (strengthText) {
        strengthText.textContent = `Force du mot de passe: ${strength.level}`;
        strengthText.style.color = strength.color;
    }
    
    checkPasswordMatch();
}

/**
 * Vérifie la correspondance des mots de passe
 */
function checkPasswordMatch() {
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const confirmInput = document.getElementById('register-confirm-password');
    
    if (confirmPassword.length === 0) {
        confirmInput.style.borderColor = '';
        return;
    }
    
    if (password === confirmPassword) {
        confirmInput.style.borderColor = '#28a745';
    } else {
        confirmInput.style.borderColor = '#dc3545';
    }
}

// ============================================================================
// GESTION DE LA CONNEXION
// ============================================================================

/**
 * Gère la soumission du formulaire de connexion
 * @param {Event} e - Événement de soumission
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    try {
        // Récupérer les données du formulaire
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email').trim().toLowerCase(),
            password: formData.get('password')
        };
        
        // Valider les données
        if (!validateLoginForm(loginData)) {
            return;
        }
        
        // Afficher l'état de chargement
        setFormLoading(e.target, true);
        
        // Tenter la connexion
        await attemptLogin(loginData);
        
    } catch (error) {
        console.error('❌ Erreur lors de la soumission:', error);
        showMessage('Erreur lors de la connexion', 'error');
        setFormLoading(e.target, false);
    }
}

/**
 * Tente de connecter l'utilisateur
 * @param {Object} loginData - Données de connexion
 */
async function attemptLogin(loginData) {
    console.log('🔐 Tentative de connexion:', { email: loginData.email });
    
    try {
        // 1. Vérifier les comptes de démonstration
        const demoAccount = Object.values(DEMO_ACCOUNTS).find(
            account => account.email === loginData.email
        );
        
        if (demoAccount && demoAccount.password === loginData.password) {
            // Connexion réussie avec compte de démonstration
            handleSuccessfulLogin(demoAccount);
            return;
        }
        
        // 2. Vérifier les utilisateurs locaux (si base de données locale)
        const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
        const localUser = localUsers.find(
            user => user.email === loginData.email && user.password === loginData.password
        );
        
        if (localUser) {
            // Connexion réussie avec utilisateur local
            handleSuccessfulLogin(localUser);
            return;
        }
        
        // 3. Tenter la connexion à la base de données (si disponible)
        if (supabaseClient) {
            await attemptDatabaseLogin(loginData);
        } else {
            // Échec de connexion
            handleLoginError('Email ou mot de passe incorrect');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la tentative de connexion:', error);
        handleLoginError('Erreur lors de la connexion');
    }
}

/**
 * Tente la connexion à la base de données Supabase
 * @param {Object} loginData - Données de connexion
 */
async function attemptDatabaseLogin(loginData) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: loginData.email,
            password: loginData.password
        });
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            handleLoginError('Email ou mot de passe incorrect');
            return;
        }
        
        // Récupérer les informations supplémentaires de l'utilisateur
        const { data: profileData, error: profileError } = await supabaseClient
            .from('eleveurs')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
        if (profileError) {
            console.warn('⚠️ Profil utilisateur non trouvé:', profileError);
        }
        
        // Combiner les données d'authentification et de profil
        const userData = {
            ...data.user,
            ...profileData,
            role: profileData?.role || 'eleveur'
        };
        
        // Connexion réussie avec base de données
        handleSuccessfulLogin(userData);
        
    } catch (error) {
        console.error('❌ Erreur lors de la connexion à la base de données:', error);
        handleLoginError('Erreur lors de la connexion');
    }
}

/**
 * Gère une connexion réussie
 * @param {Object} user - Données de l'utilisateur
 */
function handleSuccessfulLogin(user) {
    console.log('✅ Connexion réussie:', user);
    
    // Créer la session utilisateur
    currentUser = user;
    const session = {
        user: user,
        created_at: new Date().toISOString(),
        remember_me: rememberMe
    };
    
    // Sauvegarder la session
    localStorage.setItem('user_session', JSON.stringify(session));
    
    // Mettre à jour les statistiques
    updateLoginStats(user);
    
    // Afficher un message de succès
    showMessage(`Bienvenue ${user.name || user.nom_complet} !`, 'success');
    
    // Rediriger vers le tableau de bord approprié
    setTimeout(() => {
        redirectToDashboard();
    }, 1500);
}

/**
 * Gère une erreur de connexion
 * @param {string} errorMessage - Message d'erreur
 */
function handleLoginError(errorMessage) {
    console.error('❌ Échec de connexion:', errorMessage);
    showMessage(errorMessage, 'error');
    setFormLoading(document.getElementById('login-form'), false);
}

// ============================================================================
// GESTION DE L'INSCRIPTION
// ============================================================================

/**
 * Gère la soumission du formulaire d'inscription
 * @param {Event} e - Événement de soumission
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    try {
        // Récupérer les données du formulaire
        const formData = {
            nom: document.getElementById('register-nom').value,
            telephone: document.getElementById('register-telephone').value,
            email: document.getElementById('register-email').value,
            date_naissance: document.getElementById('register-date-naissance').value,
            genre: document.getElementById('register-genre').value,
            region: document.getElementById('register-region').value,
            ville: document.getElementById('register-ville').value,
            type_elevage: document.getElementById('register-type-elevage').value,
            taille_troupeau: document.getElementById('register-taille-troupeau').value,
            experience: document.getElementById('register-experience').value,
            password: document.getElementById('register-password').value,
            confirm_password: document.getElementById('register-confirm-password').value,
            conditions: document.getElementById('register-conditions').checked,
            newsletter: document.getElementById('register-newsletter').checked
        };
        
        // Validation côté client
        const errors = validateRegistrationForm(formData);
        if (errors.length > 0) {
            showMessage('Veuillez corriger les erreurs suivantes:\n\n' + errors.join('\n'), 'error');
            return;
        }
        
        // Afficher l'état de chargement
        setFormLoading(e.target, true);
        
        // Vérifier si la base de données est disponible
        if (!supabaseClient) {
            // Mode local (simulation)
            console.log('📴 Mode local: données du formulaire:', formData);
            
            // Sauvegarder en local pour la démo
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
            localUsers.push({
                ...formData,
                id: Date.now(),
                created_at: new Date().toISOString()
            });
            localStorage.setItem('local_users', JSON.stringify(localUsers));
            
            showMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
            
            // Basculer vers le formulaire de connexion
            setTimeout(() => {
                document.querySelector('[data-form="login"]').click();
                e.target.reset();
            }, 2000);
            
            return;
        }
        
        // Vérifier si l'email existe déjà dans la base de données
        console.log('🔍 Vérification de la disponibilité de l\'email...');
        const emailExists = await checkEmailExists(formData.email);
        if (emailExists) {
            showMessage('Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse.', 'error');
            setFormLoading(e.target, false);
            return;
        }
        
        // Enregistrer l'utilisateur dans la base de données
        console.log('💾 Enregistrement de l\'utilisateur dans la base de données...');
        const result = await registerUserInSupabase(formData);
        
        if (result.success) {
            // Succès
            showMessage('Inscription réussie ! Un email de confirmation vous a été envoyé.', 'success');
            console.log('✅ Utilisateur créé avec succès dans la base de données, ID:', result.userId);
            
            // Basculer vers le formulaire de connexion
            setTimeout(() => {
                document.querySelector('[data-form="login"]').click();
                e.target.reset();
            }, 3000);
            
        } else {
            // Échec
            showMessage(result.error || 'Une erreur est survenue lors de l\'inscription', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'inscription:', error);
        showMessage('Une erreur technique est survenue. Veuillez réessayer plus tard.', 'error');
        
    } finally {
        setFormLoading(e.target, false);
    }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Remplit le formulaire avec un compte de démonstration
 * @param {string} accountType - Type de compte ('eleveur' ou 'admin')
 */
function fillDemoAccount(accountType) {
    const account = DEMO_ACCOUNTS[accountType];
    if (!account) {
        console.error('❌ Type de compte de démonstration invalide:', accountType);
        return;
    }
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (emailInput && passwordInput) {
        emailInput.value = account.email;
        passwordInput.value = account.password;
        
        // Animation de remplissage
        emailInput.style.animation = 'pulse 0.5s ease';
        passwordInput.style.animation = 'pulse 0.5s ease';
        
        setTimeout(() => {
            emailInput.style.animation = '';
            passwordInput.style.animation = '';
        }, 500);
        
        showMessage(`Compte de démonstration ${accountType} rempli`, 'info');
        console.log(`📋 Compte de démonstration ${accountType} rempli`);
    }
}

/**
 * Gère le mot de passe oublié
 */
function handleForgotPassword() {
    const email = prompt('Entrez votre adresse email pour réinitialiser votre mot de passe:');
    
    if (!email) return;
    
    if (!isValidEmail(email)) {
        showMessage('Veuillez entrer une adresse email valide', 'error');
        return;
    }
    
    // Simuler l'envoi d'email de réinitialisation
    showMessage('Un email de réinitialisation a été envoyé à votre adresse', 'info');
    console.log('📧 Demande de réinitialisation pour:', email);
    
    // En production, intégrer avec un service d'email
    // await sendPasswordResetEmail(email);
}

/**
 * Définit l'état de chargement du formulaire
 * @param {HTMLFormElement} form - Formulaire concerné
 * @param {boolean} loading - État de chargement
 */
function setFormLoading(form, loading) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Traitement en cours...';
    } else {
        submitBtn.disabled = false;
        const isLogin = form.id === 'login-form';
        submitBtn.innerHTML = isLogin ? 
            '<i class="fas fa-sign-in-alt"></i> Se connecter' : 
            '<i class="fas fa-user-plus"></i> Créer mon compte';
    }
}

/**
 * Affiche un message à l'utilisateur
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (success, error, warning, info)
 */
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    
    const icon = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    messageElement.innerHTML = `<i class="${icon}"></i> ${message}`;
    
    container.appendChild(messageElement);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        messageElement.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 5000);
}

/**
 * Nettoie tous les messages
 */
function clearMessages() {
    const container = document.getElementById('messageContainer');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Met à jour les statistiques de connexion
 * @param {Object} user - Utilisateur connecté
 */
function updateLoginStats(user) {
    try {
        const stats = {
            total: (JSON.parse(localStorage.getItem('login_stats') || '{}').total || 0) + 1,
            last: new Date().toISOString(),
            last_user: user.name || user.nom_complet,
            last_role: user.role
        };
        
        localStorage.setItem('login_stats', JSON.stringify(stats));
        console.log('📊 Statistiques de connexion mises à jour:', stats);
        
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des statistiques:', error);
    }
}

/**
 * Redirige l'utilisateur vers le tableau de bord approprié
 */
function redirectToDashboard() {
    if (!currentUser) return;
    
    let redirectUrl = 'compte.html';
    
    if (currentUser.role === 'admin') {
        redirectUrl = 'administration.html';
    }
    
    console.log(`🔄 Redirection vers: ${redirectUrl}`);
    window.location.href = redirectUrl;
}

/**
 * Déconnecte l'utilisateur
 */
function logout() {
    try {
        // Supprimer la session
        localStorage.removeItem('user_session');
        
        // Afficher un message
        showMessage('Vous avez été déconnecté', 'info');
        
        // Rediriger vers la page de connexion
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1000);
        
        console.log('👋 Déconnexion réussie');
        
    } catch (error) {
        console.error('❌ Erreur lors de la déconnexion:', error);
    }
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {boolean} True si connecté
 */
function isLoggedIn() {
    try {
        const session = localStorage.getItem('user_session');
        if (!session) return false;
        
        const sessionData = JSON.parse(session);
        const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        
        return sessionAge < maxAge;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de connexion:', error);
        return false;
    }
}

/**
 * Récupère l'utilisateur courant
 * @returns {Object|null} Données de l'utilisateur courant
 */
function getCurrentUser() {
    try {
        const session = localStorage.getItem('user_session');
        if (!session) return null;
        
        const sessionData = JSON.parse(session);
        const sessionAge = Date.now() - new Date(sessionData.created_at).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 heures
        
        if (sessionAge < maxAge) {
            return sessionData.user;
        } else {
            localStorage.removeItem('user_session');
            return null;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
        return null;
    }
}

// ============================================================================
// EXPORT ET INITIALISATION
// ============================================================================

// Exporter les fonctions pour usage global
window.AuthManager = {
    fillDemoAccount,
    handleForgotPassword,
    logout,
    isLoggedIn,
    getCurrentUser,
    showMessage,
    DEMO_ACCOUNTS
};

// Initialiser quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeAuthPage);

console.log('✅ Script authentification.js chargé - Prêt pour la page d\'authentification');
