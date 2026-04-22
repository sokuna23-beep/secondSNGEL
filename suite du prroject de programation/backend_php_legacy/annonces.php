<?php
// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'senegal_elevage');
define('DB_USER', 'root');
define('DB_PASS', '');

// Connexion à la base de données
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Erreur de connexion: " . $e->getMessage());
}

// Variables pour les filtres et pagination
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = 12;
$offset = ($page - 1) * $perPage;

$search = $_GET['search'] ?? '';
$categorie = $_GET['categorie'] ?? ''; 
$region = $_GET['region'] ?? '';
$sort = $_GET['sort'] ?? 'recent';

// Construction de la requête SQL
$sql = "SELECT * FROM annonces WHERE status = 'actif'";
$params = [];

// Ajout des filtres
if (!empty($search)) {
    $sql .= " AND (titre LIKE :search OR description LIKE :search OR localisation LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

if (!empty($categorie)) {
    $sql .= " AND categorie = :categorie";
    $params[':categorie'] = $categorie;
}

if (!empty($region)) {
    $sql .= " AND region = :region";
    $params[':region'] = $region;
}

// Tri
switch ($sort) {
    case 'prix-asc':
        $sql .= " ORDER BY prix ASC";
        break;
    case 'prix-desc':
        $sql .= " ORDER BY prix DESC";
        break;
    case 'populaire':
        $sql .= " ORDER BY views DESC";
        break;
    default:
        $sql .= " ORDER BY created_at DESC";
}

// Pagination
$sql .= " LIMIT :offset, :perPage";

// Comptage total pour la pagination
$countSql = "SELECT COUNT(*) FROM annonces WHERE status = 'actif'";
$countParams = [];

if (!empty($search)) {
    $countSql .= " AND (titre LIKE :search OR description LIKE :search OR localisation LIKE :search)";
    $countParams[':search'] = '%' . $search . '%';
}

if (!empty($categorie)) {
    $countSql .= " AND categorie = :categorie";
    $countParams[':categorie'] = $categorie;
}

if (!empty($region)) {
    $countSql .= " AND region = :region";
    $countParams[':region'] = $region;
}

try {
    // Requête principale
    $stmt = $pdo->prepare($sql);
    $params[':offset'] = $offset;
    $params[':perPage'] = $perPage;
    $stmt->execute($params);
    $annonces = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Comptage total
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($countParams);
    $totalAnnonces = $countStmt->fetchColumn();
    $totalPages = ceil($totalAnnonces / $perPage);
    
} catch(PDOException $e) {
    die("Erreur lors de la récupération des annonces: " . $e->getMessage());
}

// Fonction pour formater le prix
function formatPrix($prix) {
    return number_format($prix, 0, ',', ' ') . ' FCFA';
}

// Fonction pour obtenir l'icône de catégorie
function getCategorieIcon($categorie) {
    $icons = [
        'volaille' => '🐔',
        'bovins' => '🐄',
        'ovins' => '🐑',
        'materiaux' => '🔧',
        'produits' => '🥛',
        'services' => '🤝'
    ];
    return $icons[$categorie] ?? '📋';
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Annonces - Sénégal Élevage</title>
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
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
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
        
        .nav-links {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .nav-links a {
            display: inline-block;
            margin: 0 15px;
            padding: 10px 20px;
            background: white;
            color: #8B4513;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .nav-links a:hover {
            background: #8B4513;
            color: white;
            transform: translateY(-2px);
        }
        
        .nav-links a.active {
            background: #8B4513;
            color: white;
        }
        
        .filters {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .filters-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            gap: 15px;
            align-items: end;
        }
        
        .filter-group {
            display: flex;
            flex-direction: column;
        }
        
        .filter-group label {
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        
        .filter-group input,
        .filter-group select {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        .filter-group input:focus,
        .filter-group select:focus {
            outline: none;
            border-color: #8B4513;
        }
        
        .annonces-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }
        
        .annonce-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        }
        
        .annonce-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 25px rgba(0,0,0,0.15);
        }
        
        .annonce-image {
            height: 200px;
            background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 4em;
            position: relative;
            overflow: hidden;
        }
        
        .annonce-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .annonce-content {
            padding: 20px;
        }
        
        .annonce-titre {
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        
        .annonce-description {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .annonce-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .annonce-prix {
            font-size: 1.5em;
            font-weight: 700;
            color: #8B4513;
        }
        
        .annonce-categorie {
            background: #f5f5f5;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            color: #666;
        }
        
        .annonce-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .annonce-localisation {
            color: #666;
            font-size: 0.9em;
        }
        
        .annonce-date {
            color: #999;
            font-size: 0.8em;
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 30px 0;
        }
        
        .pagination a,
        .pagination span {
            padding: 10px 15px;
            border: 2px solid #8B4513;
            border-radius: 8px;
            text-decoration: none;
            color: #8B4513;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .pagination a:hover {
            background: #8B4513;
            color: white;
        }
        
        .pagination .current {
            background: #8B4513;
            color: white;
        }
        
        .no-results {
            text-align: center;
            padding: 60px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .no-results h2 {
            color: #666;
            margin-bottom: 15px;
        }
        
        .no-results p {
            color: #999;
        }
        
        .results-count {
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 600;
            color: #333;
        }
        
        @media (max-width: 768px) {
            .filters-row {
                grid-template-columns: 1fr;
            }
            
            .annonces-grid {
                grid-template-columns: 1fr;
            }
            
            .nav-links {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            
            .nav-links a {
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐄 Sénégal Élevage</h1>
            <p>Découvrez les meilleures offres en matériel, animaux et produits d'élevage</p>
        </div>
        
        <div class="nav-links">
            <a href="index.html">🏠 Accueil</a>
            <a href="annonces.php" class="active">📋 Annonces</a>
            <a href="creer_annonce.php">➕ Créer une annonce</a>
        </div>
        
        <div class="filters">
            <form method="GET" action="annonces.php">
                <div class="filters-row">
                    <div class="filter-group">
                        <label for="search">🔍 Rechercher</label>
                        <input type="text" id="search" name="search" 
                               value="<?php echo htmlspecialchars($search); ?>"
                               placeholder="Titre, description, localisation...">
                    </div>
                    
                    <div class="filter-group">
                        <label for="categorie">Catégorie</label>
                        <select id="categorie" name="categorie">
                            <option value="">Toutes les catégories</option>
                            <option value="volaille" <?php echo $categorie == 'volaille' ? 'selected' : ''; ?>>🐔 Volaille</option>
                            <option value="bovins" <?php echo $categorie == 'bovins' ? 'selected' : ''; ?>>🐄 Bovins</option>
                            <option value="ovins" <?php echo $categorie == 'ovins' ? 'selected' : ''; ?>>🐑 Ovins</option>
                            <option value="materiaux" <?php echo $categorie == 'materiaux' ? 'selected' : ''; ?>>🔧 Matériel</option>
                            <option value="produits" <?php echo $categorie == 'produits' ? 'selected' : ''; ?>>🥛 Produits</option>
                            <option value="services" <?php echo $categorie == 'services' ? 'selected' : ''; ?>>🤝 Services</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="region">Région</label>
                        <select id="region" name="region">
                            <option value="">Toutes les régions</option>
                            <option value="dakar" <?php echo $region == 'dakar' ? 'selected' : ''; ?>>Dakar</option>
                            <option value="thies" <?php echo $region == 'thies' ? 'selected' : ''; ?>>Thiès</option>
                            <option value="kaolack" <?php echo $region == 'kaolack' ? 'selected' : ''; ?>>Kaolack</option>
                            <option value="saint-louis" <?php echo $region == 'saint-louis' ? 'selected' : ''; ?>>Saint-Louis</option>
                            <option value="tambacounda" <?php echo $region == 'tambacounda' ? 'selected' : ''; ?>>Tambacounda</option>
                            <option value="louga" <?php echo $region == 'louga' ? 'selected' : ''; ?>>Louga</option>
                            <option value="fatick" <?php echo $region == 'fatick' ? 'selected' : ''; ?>>Fatick</option>
                            <option value="kolda" <?php echo $region == 'kolda' ? 'selected' : ''; ?>>Kolda</option>
                            <option value="ziguinchor" <?php echo $region == 'ziguinchor' ? 'selected' : ''; ?>>Ziguinchor</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="sort">Tri</label>
                        <select id="sort" name="sort">
                            <option value="recent" <?php echo $sort == 'recent' ? 'selected' : ''; ?>>Plus récent</option>
                            <option value="prix-asc" <?php echo $sort == 'prix-asc' ? 'selected' : ''; ?>>Prix croissant</option>
                            <option value="prix-desc" <?php echo $sort == 'prix-desc' ? 'selected' : ''; ?>>Prix décroissant</option>
                            <option value="populaire" <?php echo $sort == 'populaire' ? 'selected' : ''; ?>>Plus populaire</option>
                        </select>
                    </div>
                </div>
                <button type="submit" style="margin-top: 15px; padding: 12px 24px; background: #8B4513; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🔍 Filtrer</button>
            </form>
        </div>
        
        <?php if ($totalAnnonces > 0): ?>
            <div class="results-count">
                📊 <?php echo $totalAnnonces; ?> annonce(s) trouvée(s)
            </div>
        <?php endif; ?>
        
        <?php if (!empty($annonces)): ?>
            <div class="annonces-grid">
                <?php foreach ($annonces as $annonce): ?>
                    <div class="annonce-card" onclick="window.location.href='annonce_detail.php?id=<?php echo $annonce['id']; ?>'">
                        <div class="annonce-image">
                            <?php 
                            $images = json_decode($annonce['images'], true);
                            if (!empty($images) && file_exists($images[0])): ?>
                                <img src="<?php echo htmlspecialchars($images[0]); ?>" alt="<?php echo htmlspecialchars($annonce['titre']); ?>">
                            <?php else: ?>
                                <?php echo getCategorieIcon($annonce['categorie']); ?>
                            <?php endif; ?>
                        </div>
                        
                        <div class="annonce-content">
                            <h3 class="annonce-titre"><?php echo htmlspecialchars($annonce['titre']); ?></h3>
                            <p class="annonce-description"><?php echo htmlspecialchars($annonce['description']); ?></p>
                            
                            <div class="annonce-meta">
                                <span class="annonce-prix"><?php echo formatPrix($annonce['prix']); ?></span>
                                <span class="annonce-categorie"><?php echo getCategorieIcon($annonce['categorie']) . ' ' . ucfirst($annonce['categorie']); ?></span>
                            </div>
                            
                            <div class="annonce-info">
                                <span class="annonce-localisation">📍 <?php echo htmlspecialchars($annonce['localisation']); ?></span>
                                <span class="annonce-date">📅 <?php echo date('d/m/Y', strtotime($annonce['created_at'])); ?></span>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <?php if ($totalPages > 1): ?>
                <div class="pagination">
                    <?php if ($page > 1): ?>
                        <a href="?page=<?php echo $page - 1; ?>&search=<?php echo urlencode($search); ?>&categorie=<?php echo urlencode($categorie); ?>&region=<?php echo urlencode($region); ?>&sort=<?php echo urlencode($sort); ?>">⬅️ Précédent</a>
                    <?php endif; ?>
                    
                    <?php for ($i = max(1, $page - 2); $i <= min($totalPages, $page + 2); $i++): ?>
                        <?php if ($i == $page): ?>
                            <span class="current"><?php echo $i; ?></span>
                        <?php else: ?>
                            <a href="?page=<?php echo $i; ?>&search=<?php echo urlencode($search); ?>&categorie=<?php echo urlencode($categorie); ?>&region=<?php echo urlencode($region); ?>&sort=<?php echo urlencode($sort); ?>"><?php echo $i; ?></a>
                        <?php endif; ?>
                    <?php endfor; ?>
                    
                    <?php if ($page < $totalPages): ?>
                        <a href="?page=<?php echo $page + 1; ?>&search=<?php echo urlencode($search); ?>&categorie=<?php echo urlencode($categorie); ?>&region=<?php echo urlencode($region); ?>&sort=<?php echo urlencode($sort); ?>">Suivant ➡️</a>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            
        <?php else: ?>
            <div class="no-results">
                <h2>😔 Aucune annonce trouvée</h2>
                <p>Essayez de modifier vos filtres ou revenez plus tard pour de nouvelles annonces.</p>
                <br>
                <a href="creer_annonce.php" style="display: inline-block; padding: 12px 24px; background: #8B4513; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">➕ Créer la première annonce</a>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
