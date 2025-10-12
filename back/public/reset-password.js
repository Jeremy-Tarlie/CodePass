// Configuration API - sera chargée dynamiquement
let API_BASE_URL = 'https://gestion-mdp.codepath.fr';
let API_KEY = '';

// Charger la configuration depuis le serveur
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        API_BASE_URL = config.API_BASE_URL;
        API_KEY = config.API_KEY;
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        showAlert('Erreur de configuration. Impossible de charger les paramètres du serveur.');
        throw error;
    }
}

// Récupérer les paramètres de l'URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const csrf = urlParams.get('csrf');

let isValidToken = false;
let userEmail = '';

// Fonction pour afficher les alertes
function showAlert(message, type = 'error') {
    const alertContainer = document.getElementById('alertContainer');
    alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
}

// Fonction pour masquer les alertes
function hideAlert() {
    document.getElementById('alertContainer').innerHTML = '';
}

// Fonction pour basculer la visibilité du mot de passe
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Fonction pour valider les critères du mot de passe
function validatePassword(password, confirmPassword) {
    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password),
        match: password === confirmPassword && confirmPassword !== ''
    };

    // Mettre à jour l'affichage des critères
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        const icon = element.querySelector('.requirement-icon');
        
        if (requirements[req]) {
            element.classList.remove('invalid');
            element.classList.add('valid');
            icon.textContent = '✅';
        } else {
            element.classList.remove('valid');
            element.classList.add('invalid');
            icon.textContent = '❌';
        }
    });

    // Activer/désactiver le bouton de soumission
    const allValid = Object.values(requirements).every(req => req);
    document.getElementById('submitBtn').disabled = !allValid;

    return allValid;
}

// Fonction pour valider le token
async function validateToken() {
    if (!token || !csrf) {
        showAlert('Lien de réinitialisation invalide. Veuillez refaire une demande.');
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/password-reset/validate?token=${token}&csrf=${csrf}`, {
            method: 'GET',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success && data.valid) {
            userEmail = data.email || '';
            if (userEmail) {
                document.getElementById('userEmail').textContent = userEmail;
                document.getElementById('userInfo').style.display = 'block';
            }
            return true;
        } else {
            showAlert(data.message || 'Token invalide ou expiré. Veuillez refaire une demande.');
            return false;
        }
    } catch (error) {
        console.error('Erreur lors de la validation du token:', error);
        showAlert('Erreur de connexion au serveur. Veuillez réessayer.');
        return false;
    }
}

// Fonction pour réinitialiser le mot de passe
async function resetPassword(newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/password-reset/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({
                token: token,
                csrfToken: csrf,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.', 'success');
            
            // Rediriger vers la page de connexion après 3 secondes
            setTimeout(() => {
                window.location.href = '/connexion';
            }, 3000);
        } else {
            showAlert(data.message || 'Erreur lors de la réinitialisation du mot de passe.');
        }
    } catch (error) {
        console.error('Erreur lors de la réinitialisation:', error);
        showAlert('Erreur de connexion au serveur. Veuillez réessayer.');
    }
}

// Gestionnaire d'événements pour le formulaire
document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!validatePassword(newPassword, confirmPassword)) {
        showAlert('Le mot de passe ne respecte pas tous les critères de sécurité.');
        return;
    }

    // Désactiver le bouton et afficher le loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Réinitialisation...';

    hideAlert();

    try {
        await resetPassword(newPassword);
    } finally {
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.textContent = 'Réinitialiser le mot de passe';
    }
});

// Gestionnaires d'événements pour la validation en temps réel
document.getElementById('newPassword').addEventListener('input', function() {
    const confirmPassword = document.getElementById('confirmPassword').value;
    validatePassword(this.value, confirmPassword);
});

document.getElementById('confirmPassword').addEventListener('input', function() {
    const newPassword = document.getElementById('newPassword').value;
    validatePassword(newPassword, this.value);
});

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    const loading = document.getElementById('loading');
    const form = document.getElementById('resetForm');

    try {
        // Charger la configuration d'abord
        await loadConfig();
        
        // Puis valider le token
        isValidToken = await validateToken();
        
        if (isValidToken) {
            loading.style.display = 'none';
            form.style.display = 'block';
        } else {
            loading.style.display = 'none';
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        loading.style.display = 'none';
        showAlert('Erreur lors du chargement de la page. Veuillez réessayer.');
    }
});
