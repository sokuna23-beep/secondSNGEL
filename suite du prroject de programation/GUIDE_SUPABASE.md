# 🗄️ Guide Complet : Connecter Sénégal Élevage à Supabase

## Étape 1 — Créer un projet Supabase

1. Allez sur **[https://supabase.com](https://supabase.com)**
2. Cliquez **"Start your project"** → Connectez-vous avec GitHub ou email
3. Cliquez **"New Project"**
4. Remplissez :
   - **Name** : `senegal-elevage`
   - **Database Password** : choisissez un mot de passe fort (notez-le !)
   - **Region** : `West EU (Paris)` (le plus proche du Sénégal)
5. Cliquez **"Create new project"** → attendez 2 minutes

---

## Étape 2 — Récupérer vos clés API

1. Dans votre projet Supabase, allez dans **Settings** (⚙️ icône engrenage à gauche)
2. Cliquez **API** dans le menu
3. Vous trouverez :
   - **Project URL** : `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key** : une longue chaîne commençant par `eyJ...`

4. Ouvrez le fichier `js/supabase-config.js` dans votre projet et remplacez :

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';        // ← votre Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...votre-clé';  // ← votre anon key
```

> [!IMPORTANT]
> La clé `anon` est **publique** — elle peut être dans le code côté client. Ne partagez **jamais** la clé `service_role`.

---

## Étape 3 — Créer les tables dans la base de données

1. Dans Supabase, allez dans **SQL Editor** (icône dans la barre latérale)
2. Cliquez **"New query"**
3. Copiez-collez le contenu du fichier `supabase_schema.sql` (déjà dans votre projet)
4. Cliquez **"Run"** (▶️)

Vérification : allez dans **Table Editor** → vous devez voir 3 tables :
- ✅ `categories` (6 lignes pré-remplies)
- ✅ `annonces` (vide)
- ✅ `profils` (vide)

---

## Étape 4 — Configurer le Storage (pour les images)

1. Allez dans **Storage** (icône dans la barre latérale)
2. Cliquez **"New bucket"**
3. Créez un bucket :
   - **Name** : `annonces`
   - **Public bucket** : ✅ coché (pour que les images soient accessibles sans login)
4. Cliquez sur le bucket `annonces` créé
5. Allez dans **Policies** (onglet en haut)
6. Ajoutez ces politiques :

**Politique 1 — Lecture publique :**
- Cliquez **"New Policy"** → **"For full customization"**
- Name : `Public read`
- Allowed operation : **SELECT**
- Policy definition : `true`
- Cliquez **"Review"** → **"Save"**

**Politique 2 — Upload pour utilisateurs authentifiés :**
- Cliquez **"New Policy"** → **"For full customization"**
- Name : `Authenticated upload`
- Allowed operation : **INSERT**
- Policy definition : `auth.role() = 'authenticated'`
- Cliquez **"Review"** → **"Save"**

---

## Étape 5 — Activer l'authentification

L'authentification est déjà activée par défaut dans Supabase. Pour la configurer :

1. Allez dans **Authentication** (icône dans la barre latérale)
2. Cliquez **Settings** → **Email**
3. Vérifiez que :
   - ✅ **Enable Email Signup** est activé
   - ✅ **Enable Email Confirmations** — désactivez-le pendant le développement (pour tester sans confirmer les emails)

> [!TIP]
> Pendant le développement, désactivez la confirmation d'email pour pouvoir tester l'inscription/connexion sans nécessité de confirmer par email.

---

## Étape 6 — Tester la connexion

Ouvrez votre site dans un navigateur et ouvrez la **Console** (F12 → onglet Console).

### ✅ Si tout est bien configuré, vous verrez :
```
📦 supabase-config.js chargé — API disponible via window.SupabaseAPI
✅ Supabase connecté avec succès
```

### ❌ Si les clés ne sont pas configurées :
```
⚠️ Clés Supabase non configurées. Modifiez supabase-config.js avec vos clés.
```

### Test rapide dans la Console :
```javascript
// Tester la connexion
SupabaseAPI.isConnected()  // devrait retourner true

// Tester la création d'une annonce
await SupabaseAPI.createAnnonce({
    titre: 'Test annonce',
    description: 'Ceci est un test',
    categorie: 'bovins',
    prix: 50000,
    localisation: 'Dakar',
    region: 'Dakar',
    nom: 'Test User',
    telephone: '771234567'
})
```

---

## Étape 7 — Vérifier dans Supabase

1. Retournez dans **Table Editor** → table `annonces`
2. Vous devez voir votre annonce test
3. Si oui, **tout fonctionne !** 🎉

---

## Résumé des fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `js/supabase-config.js` | Réécrit avec API complète (CRUD, Auth, Storage) |
| `supabase_schema.sql` | Existant — contient le schéma des tables |
| Toutes les pages `.html` | Ajout du CDN Supabase (`@supabase/supabase-js@2`) |

## API disponible dans votre code

```javascript
// Annonces
await SupabaseAPI.createAnnonce(data)      // Créer
await SupabaseAPI.getAnnonces(filters)     // Lire toutes
await SupabaseAPI.getAnnonceById(id)       // Lire une
await SupabaseAPI.updateAnnonce(id, data)  // Modifier
await SupabaseAPI.deleteAnnonce(id)        // Supprimer

// Authentification
await SupabaseAPI.signUp(email, password, metadata)
await SupabaseAPI.signIn(email, password)
await SupabaseAPI.signOut()
await SupabaseAPI.getCurrentUser()

// Images
await SupabaseAPI.uploadImage(file, 'annonces')
```

> [!NOTE]
> Si Supabase n'est pas connecté (clés manquantes), l'application fonctionne en **mode hors-ligne** avec `localStorage`.
