<?php
// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'senegal_elevage');
define('DB_USER', 'root');
define('DB_PASS', '');

// Configuration des uploads 
define('UPLOAD_DIR', 'uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['jpg', 'jpeg', 'png', 'gif']);

// Connexion à la base de données
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Erreur de connexion: " . $e->getMessage());
}

// Créer le répertoire d'upload s'il n'existe pas
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}

// Traitement du formulaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Récupération des données du formulaire
    $titre = $_POST['titre'] ?? '';
    $description = $_POST['description'] ?? '';
    $categorie = $_POST['categorie'] ?? '';
    $prix = $_POST['prix'] ?? 0;
    $localisation = $_POST['localisation'] ?? '';
    $region = $_POST['region'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $telephone = $_POST['telephone'] ?? '';
    $email = $_POST['email'] ?? '';
    
    $imagePaths = [];
    $errors = [];
    
    // Traitement des images
    if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
        $files = $_FILES['images'];
        $fileCount = count($files['name']);
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $fileName = $files['name'][$i];
                $fileTmpName = $files['tmp_name'][$i];
                $fileSize = $files['size'][$i];
                $fileType = $files['type'][$i];
                
                // Validation du fichier
                $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
                
                if (!in_array($fileExt, ALLOWED_TYPES)) {
                    $errors[] = "Le fichier $fileName n'est pas une image valide";
                    continue;
                }
                
                if ($fileSize > MAX_FILE_SIZE) {
                    $errors[] = "Le fichier $fileName dépasse 5MB";
                    continue;
                }
                
                // Génération d'un nom unique
                $uniqueName = uniqid('annonce_', true) . '.' . $fileExt;
                $targetFile = UPLOAD_DIR . $uniqueName;
                
                // Upload du fichier
                if (move_uploaded_file($fileTmpName, $targetFile)) {
                    $imagePaths[] = $targetFile;
                } else {
                    $errors[] = "Erreur lors de l'upload du fichier $fileName";
                }
            }
        }
    }
    
    // Validation des données
    if (empty($titre)) $errors[] = "Le titre est obligatoire";
    if (empty($description)) $errors[] = "La description est obligatoire";
    if (empty($categorie)) $errors[] = "La catégorie est obligatoire";
    if (empty($prix) || $prix <= 0) $errors[] = "Le prix est obligatoire et doit être positif";
    if (empty($localisation)) $errors[] = "La localisation est obligatoire";
    if (empty($region)) $errors[] = "La région est obligatoire";
    if (empty($nom)) $errors[] = "Le nom est obligatoire";
    if (empty($telephone)) $errors[] = "Le téléphone est obligatoire";
    
    // Si pas d'erreurs, insertion en base de données
    if (empty($errors)) {
        try {
            $sql = "INSERT INTO annonces (
                titre, description, categorie, prix, localisation, region, 
                nom, telephone, email, images, created_at, status
            ) VALUES (
                :titre, :description, :categorie, :prix, :localisation, :region,
                :nom, :telephone, :email, :images, NOW(), 'actif'
            )";
            
            $stmt = $pdo->prepare($sql);
            
            $imagesJson = json_encode($imagePaths);
            
            $stmt->execute([
                ':titre' => $titre,
                ':description' => $description,
                ':categorie' => $categorie,
                ':prix' => $prix,
                ':localisation' => $localisation,
                ':region' => $region,
                ':nom' => $nom,
                ':telephone' => $telephone,
                ':email' => $email,
                ':images' => $imagesJson
            ]);
            
            $annonceId = $pdo->lastInsertId();
            $success = "Annonce créée avec succès ! ID: $annonceId";
            
        } catch(PDOException $e) {
            $errors[] = "Erreur lors de l'insertion en base: " . $e->getMessage();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Créer une Annonce - Sénégal Élevage</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .form-container {
            padding: 40px;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #8B4513;
        }
        
        .form-group textarea {
            resize: vertical;
            min-height: 120px;
        }
        
        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .file-upload {
            border: 3px dashed #ddd;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            background: #f9f9f9;
            transition: all 0.3s ease;
        }
        
        .file-upload:hover {
            border-color: #8B4513;
            background: #f5f5f5;
        }
        
        .file-upload input[type="file"] {
            margin: 10px 0;
        }
        
        .btn {
            background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
        }
        
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .required {
            color: #dc3545;
        }
        
        @media (max-width: 768px) {
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .form-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐄 Sénégal Élevage</h1>
            <p>Créer une nouvelle annonce</p>
        </div>
        
        <div class="form-container">
            <?php if (isset($success)): ?>
                <div class="alert alert-success">
                    <strong>✅ Succès !</strong> <?php echo $success; ?>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($errors)): ?>
                <div class="alert alert-error">
                    <strong>❌ Erreurs :</strong>
                    <ul>
                        <?php foreach ($errors as $error): ?>
                            <li><?php echo htmlspecialchars($error); ?></li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
            
            <form action="creer_annonce.php" method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="titre">Titre de l'annonce <span class="required">*</span></label>
                    <input type="text" id="titre" name="titre" required 
                           value="<?php echo isset($_POST['titre']) ? htmlspecialchars($_POST['titre']) : ''; ?>"
                           placeholder="Ex: Poules pondeuses de qualité">
                </div>
                
                <div class="form-group">
                    <label for="description">Description détaillée <span class="required">*</span></label>
                    <textarea id="description" name="description" required 
                              placeholder="Décrivez votre produit en détail : race, âge, état de santé..."><?php echo isset($_POST['description']) ? htmlspecialchars($_POST['description']) : ''; ?></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="categorie">Catégorie <span class="required">*</span></label>
                        <select id="categorie" name="categorie" required>
                            <option value="">Sélectionner une catégorie</option>
                            <option value="volaille" <?php echo (isset($_POST['categorie']) && $_POST['categorie'] == 'volaille') ? 'selected' : ''; ?>>Volaille</option>
                            <option value="bovins" <?php echo (isset($_POST['categorie']) && $_POST['categorie'] == 'bovins') ? 'selected' : ''; ?>>Bovins</option>
                            <option value="ovins" <?php echo (isset($_POST['categorie']) && $_POST['categorie'] == 'ovins') ? 'selected' : ''; ?>>Ovins</option>
                            <option value="materiaux" <?php echo (isset($_POST['categorie']) && $_POST['categorie'] == 'materiaux') ? 'selected' : ''; ?>>Matériel</option>
                            <option value="produits" <?php echo (isset($_POST['categorie']) && $_POST['categorie'] == 'produits') ? 'selected' : ''; ?>>Produits</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="prix">Prix (FCFA) <span class="required">*</span></label>
                        <input type="number" id="prix" name="prix" required min="0" step="100"
                               value="<?php echo isset($_POST['prix']) ? htmlspecialchars($_POST['prix']) : ''; ?>"
                               placeholder="25000">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="localisation">Localisation <span class="required">*</span></label>
                        <input type="text" id="localisation" name="localisation" required
                               value="<?php echo isset($_POST['localisation']) ? htmlspecialchars($_POST['localisation']) : ''; ?>"
                               placeholder="Ex: Dakar, Plateau">
                    </div>
                    
                    <div class="form-group">
                        <label for="region">Région <span class="required">*</span></label>
                        <select id="region" name="region" required>
                            <option value="">Sélectionner une région</option>
                            <option value="dakar" <?php echo (isset($_POST['region']) && $_POST['region'] == 'dakar') ? 'selected' : ''; ?>>Dakar</option>
                            <option value="thies" <?php echo (isset($_POST['region']) && $_POST['region'] == 'thies') ? 'selected' : ''; ?>>Thiès</option>
                            <option value="kaolack" <?php echo (isset($_POST['region']) && $_POST['region'] == 'kaolack') ? 'selected' : ''; ?>>Kaolack</option>
                            <option value="saint-louis" <?php echo (isset($_POST['region']) && $_POST['region'] == 'saint-louis') ? 'selected' : ''; ?>>Saint-Louis</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="nom">Votre nom <span class="required">*</span></label>
                        <input type="text" id="nom" name="nom" required
                               value="<?php echo isset($_POST['nom']) ? htmlspecialchars($_POST['nom']) : ''; ?>"
                               placeholder="Votre nom complet">
                    </div>
                    
                    <div class="form-group">
                        <label for="telephone">Téléphone <span class="required">*</span></label>
                        <input type="tel" id="telephone" name="telephone" required
                               value="<?php echo isset($_POST['telephone']) ? htmlspecialchars($_POST['telephone']) : ''; ?>"
                               placeholder="+221 77 123 45 67">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="email">Email (optionnel)</label>
                    <input type="email" id="email" name="email"
                           value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>"
                           placeholder="votre.email@exemple.com">
                </div>
                
                <div class="form-group">
                    <label>Images de l'annonce (maximum 5 images, 5MB par image)</label>
                    <div class="file-upload">
                        <p>📷 Choisissez jusqu'à 5 images pour votre annonce</p>
                        <input type="file" name="images[]" multiple accept="image/*" 
                               onchange="previewImages(this)">
                        <div id="imagePreview"></div>
                    </div>
                </div>
                
                <button type="submit" class="btn">📝 Publier l'annonce</button>
            </form>
        </div>
    </div>
    
    <script>
        function previewImages(input) {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = '';
            
            if (input.files && input.files.length > 0) {
                for (let i = 0; i < input.files.length; i++) {
                    const file = input.files[i];
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; margin: 5px; border-radius: 8px; border: 2px solid #ddd;';
                        preview.appendChild(img);
                    };
                    
                    reader.readAsDataURL(file);
                }
            }
        }
    </script>
</body>
</html>
