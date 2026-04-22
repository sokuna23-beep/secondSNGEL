import os
import re

# Helper to standardise the header
def update_header(content):
    # Regex to find the header
    header_pattern = r'<header.*?</header>'
    
    new_header = '''<header class="header">
        <div class="container">
            <nav class="navbar">
                <a href="index.html" class="logo">
                    <i class="fas fa-paw"></i>
                    <span>Sénégal<span class="highlight">Élevage</span></span>
                </a>
                <div class="nav-links">
                    <a href="index.html"><i class="fas fa-home"></i> Accueil</a>
                    <a href="materiel.html"><i class="fas fa-tools"></i> Matériel</a>
                    <a href="betail.html"><i class="fas fa-cow"></i> Bétail</a>
                    <a href="services.html"><i class="fas fa-handshake"></i> Services</a>
                    <a href="publier-annonce.html"><i class="fas fa-plus-circle"></i> Créer une annonce</a>
                    <a href="annonces.html"><i class="fas fa-bullhorn"></i> Annonces</a>
                    <a href="authentification.html"><i class="fas fa-user"></i> Mon Compte</a>
                    <a href="contact.html"><i class="fas fa-envelope"></i> Contact</a>
                </div>
                <div class="mobile-menu-btn">
                    <i class="fas fa-bars"></i>
                </div>
            </nav>
        </div>
    </header>'''

    # If header exists, replace it
    if re.search(header_pattern, content, re.DOTALL):
        return re.sub(header_pattern, new_header, content, flags=re.DOTALL)
    
    # If no header (unlikely but possible), insert after body
    if '<body>' in content:
        return content.replace('<body>', '<body>\n' + new_header)
        
    return content

# Helper to update buttons
def update_buttons(content):
    # Update btn-primary and others to match new structure if needed
    # Currently style.css handles .btn, .btn-primary, .btn-outline
    # So we just ensure classes are clean
    return content

# Process files
root_dir = '.'
for filename in os.listdir(root_dir):
    if filename.endswith('.html') and filename != 'index.html': # Skip index as it might have specific active states
        print(f"Processing {filename}...")
        filepath = os.path.join(root_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = update_header(content)
        
        # Highlight active link based on filename
        active_link_map = {
            'index.html': 'Accueil',
            'materiel.html': 'Matériel',
            'betail.html': 'Bétail',
            'services.html': 'Services',
            'publier-annonce.html': 'Créer une annonce',
            'annonces.html': 'Annonces',
            'authentification.html': 'Mon Compte',
            'contact.html': 'Contact'
        }
        
        if filename in active_link_map:
            link_name = active_link_map[filename]
            # Add class="active" to the matching link
            # Regex: <a href="filename.html">...</a> -> <a href="filename.html" class="active">...</a>
            # But the header is inserted fresh, so we search in new_content
            
            # Remove any existing active classes in nav
            new_content = re.sub(r'class="active"', '', new_content)
            
            # Add active class to specific link
            # <a href="index.html"> yields <a href="index.html" class="active">
            target = f'href="{filename}"'
            new_content = new_content.replace(target, f'{target} class="active"')

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

print("HTML updates complete.")
