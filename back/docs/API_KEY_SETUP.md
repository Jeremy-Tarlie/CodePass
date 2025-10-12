# Configuration de la Clé API

Ce document explique comment configurer et utiliser le système d'authentification par clé API pour sécuriser l'accès à votre backend.

## 🔑 Génération de la Clé API

### Méthode 1 : Script automatique (Recommandé)
```bash
npm run generate-api-key
```

Le script génère automatiquement une clé API sécurisée de 256 bits et l'affiche dans la console.

### Méthode 2 : Génération manuelle
```javascript
const crypto = require('crypto');
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('Clé API générée:', apiKey);
console.log('Longueur:', apiKey.length, 'caractères');
```

### Méthode 3 : Génération avec validation
```javascript
const crypto = require('crypto');

function generateSecureApiKey() {
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  // Validation de la clé générée
  if (apiKey.length !== 64) {
    throw new Error('Clé API invalide');
  }
  
  console.log('✅ Clé API sécurisée générée');
  console.log('Clé:', apiKey);
  console.log('Longueur:', apiKey.length, 'caractères (256 bits)');
  
  return apiKey;
}

generateSecureApiKey();
```

## ⚙️ Configuration

### Backend (.env)
```env
# Clé API pour l'authentification (256 bits)
API_KEY="votre_cle_api_generee_ici_64_caracteres_hexadecimaux"

# Clé API secondaire (optionnelle, pour la rotation)
API_KEY_SECONDARY=""

# Autres variables de sécurité
DATABASE_URL="postgresql://username:password@localhost:5432/gestion_mdp"
JWT_SECRET="votre_cle_jwt_secrete_tres_longue"
SESSION_SECRET="votre_cle_session_secrete"
ENCRYPTION_KEY="votre_cle_chiffrement_256_bits"

# Configuration serveur
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### Frontend (.env)
```env
# Même clé API que le backend
VITE_API_KEY="votre_cle_api_generee_ici_64_caracteres_hexadecimaux"

# URL du backend
VITE_API_URL="http://localhost:3001"

# Configuration application
VITE_APP_NAME="Gestionnaire de Mots de Passe"
VITE_APP_VERSION="1.0.0"
```

## 🚀 Utilisation

### Dans vos requêtes HTTP

#### JavaScript/Fetch (Frontend)
```javascript
const apiKey = import.meta.env.VITE_API_KEY;
const apiUrl = import.meta.env.VITE_API_URL;

// Fonction utilitaire pour les requêtes API
async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }
  
  return response.json();
}

// Exemple d'utilisation
try {
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123'
    })
  });
  console.log('Connexion réussie:', result);
} catch (error) {
  console.error('Erreur de connexion:', error);
}
```

#### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY
  }
});

// Intercepteur pour la gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Clé API invalide ou manquante');
    }
    return Promise.reject(error);
  }
);

// Utilisation
try {
  const response = await api.post('/auth/login', {
    email: 'user@example.com',
    password: 'password123'
  });
  console.log('Connexion réussie:', response.data);
} catch (error) {
  console.error('Erreur:', error.response?.data || error.message);
}
```

#### cURL
```bash
# Test de connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre_cle_api_64_caracteres" \
  -d '{"email":"user@example.com","password":"password123"}'

# Test de santé (sans clé API)
curl http://localhost:3001/health

# Test avec clé invalide
curl -H "X-API-Key: invalid_key" http://localhost:3001/api/auth/verify
```

## 🔒 Sécurité

### Fonctionnalités de Sécurité Implémentées

1. **Comparaison Timing-Safe** : Protection contre les attaques par timing avec `crypto.timingSafeEqual()`
2. **Logging des Accès** : Tous les accès sont loggés avec masquage de la clé (8 premiers caractères)
3. **Rate Limiting** : Limitation du nombre de requêtes (100 req/15min)
4. **Validation Stricte** : Vérification de la présence et validité de la clé
5. **Rotation des Clés** : Support de clés secondaires pour la rotation sans interruption
6. **Headers Sécurisés** : Validation du header `X-API-Key` sur toutes les routes protégées

### Bonnes Pratiques

1. **Stockage Sécurisé** :
   - Ne jamais commiter la clé dans le code
   - Utiliser des variables d'environnement
   - Chiffrer la clé en production

2. **Rotation des Clés** :
   - Changer régulièrement les clés
   - Utiliser `API_KEY_SECONDARY` pour la rotation
   - Notifier les clients avant le changement

3. **Monitoring** :
   - Surveiller les logs d'accès
   - Détecter les tentatives d'intrusion
   - Alerter en cas d'usage anormal

## 🛠️ Endpoints de Gestion

### Vérifier la Validité d'une Clé
```bash
curl -X POST http://localhost:3000/api/keys/validate \
  -H "X-API-Key: votre_cle_api"
```

### Obtenir des Informations sur l'API
```bash
curl -X GET http://localhost:3000/api/keys/info
```

### Générer une Nouvelle Clé (Nécessite une clé valide)
```bash
curl -X POST http://localhost:3000/api/keys/generate \
  -H "X-API-Key: votre_cle_api_actuelle"
```

## 🚨 Gestion des Erreurs

### Erreurs Communes

1. **401 - Clé API manquante**
   ```json
   {
     "success": false,
     "message": "Clé API manquante. Veuillez fournir une clé API dans le header X-API-Key"
   }
   ```

2. **403 - Clé API invalide**
   ```json
   {
     "success": false,
     "message": "Clé API invalide"
   }
   ```

3. **500 - Configuration serveur invalide**
   ```json
   {
     "success": false,
     "message": "Configuration serveur invalide"
   }
   ```

## 🔄 Rotation des Clés

### Processus de Rotation

1. **Générer une nouvelle clé** :
   ```bash
   npm run generate-api-key
   ```

2. **Mettre à jour le backend** :
   ```env
   API_KEY_SECONDARY="ancienne_cle"
   API_KEY="nouvelle_cle"
   ```

3. **Mettre à jour le frontend** :
   ```env
   API_KEY="nouvelle_cle"
   ```

4. **Tester la nouvelle clé** :
   ```bash
   curl -X POST http://localhost:3000/api/keys/validate \
     -H "X-API-Key: nouvelle_cle"
   ```

5. **Supprimer l'ancienne clé** :
   ```env
   API_KEY_SECONDARY=""
   ```

## 📊 Monitoring

### Logs d'Accès
Tous les accès API sont loggés avec :
- Timestamp
- Méthode HTTP et URL
- Préfixe de la clé (masquée)
- Adresse IP
- Code de statut
- Temps de réponse

### Exemple de Log
```
API Access - POST /api/auth/login - Key: a1b2c3d4... - IP: 127.0.0.1 - Status: 200 - Time: 45ms
```

## 🎯 Exemples Complets

### Frontend React
```javascript
// config/api.js
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.REACT_APP_API_KEY
  }
};

// services/authService.js
import axios from 'axios';

const api = axios.create(API_CONFIG);

export const authService = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (email, password) => 
    api.post('/auth/register', { email, password }),
  
  logout: () => 
    api.post('/auth/logout')
};
```

### Frontend Vue.js
```javascript
// plugins/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.VUE_APP_API_KEY
  }
});

export default api;
```

## 🔧 Dépannage

### Problèmes Courants

1. **Clé non reconnue** :
   - Vérifier que la clé est identique dans backend et frontend
   - Vérifier le header `X-API-Key`
   - Vérifier les espaces en début/fin de clé

2. **Erreur de configuration** :
   - Vérifier que `API_KEY` est définie dans `.env`
   - Redémarrer le serveur après modification du `.env`

3. **Problèmes de CORS** :
   - Vérifier la configuration CORS
   - S'assurer que le header `X-API-Key` est autorisé

### Commandes de Test
```bash
# Test de santé (sans clé)
curl http://localhost:3000/health

# Test avec clé invalide
curl -H "X-API-Key: invalid" http://localhost:3000/api/keys/info

# Test avec clé valide
curl -H "X-API-Key: votre_cle" http://localhost:3000/api/keys/info
```
