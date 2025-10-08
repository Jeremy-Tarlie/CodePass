# Configuration de la Réinitialisation de Mot de Passe

Ce document explique comment configurer et utiliser le système de réinitialisation de mot de passe sécurisé avec envoi d'email et protection CSRF.

## 🔧 Configuration

### Variables d'Environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
SMTP_FROM="Gestionnaire de Mots de Passe <votre_email@gmail.com>"

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5173

# Configuration de sécurité
PASSWORD_RESET_TOKEN_EXPIRATION=15 # minutes
PASSWORD_RESET_MAX_ATTEMPTS=3 # tentatives par heure
```

### Configuration Gmail

Pour utiliser Gmail comme service SMTP :

1. **Activez l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générez un mot de passe d'application** :
   - Allez dans Paramètres Google > Sécurité
   - Activez l'authentification à 2 facteurs
   - Générez un mot de passe d'application
   - Utilisez ce mot de passe dans `SMTP_PASS`

### Configuration d'autres services SMTP

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre_api_key_sendgrid
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=votre_access_key
SMTP_PASS=votre_secret_key
```

## 🚀 Utilisation

### 1. Demande de Réinitialisation

**Endpoint :** `POST /api/password-reset/request`

**Headers :**
```
X-API-Key: votre_cle_api
Content-Type: application/json
```

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Si cet email existe dans notre système, vous recevrez un email de réinitialisation."
}
```

### 2. Validation du Token

**Endpoint :** `GET /api/password-reset/validate?token=...&csrf=...`

**Réponse :**
```json
{
  "success": true,
  "valid": true,
  "email": "user@example.com"
}
```

### 3. Réinitialisation du Mot de Passe

**Endpoint :** `POST /api/password-reset/reset`

**Body :**
```json
{
  "token": "token_de_reinitialisation",
  "csrfToken": "token_csrf",
  "newPassword": "NouveauMotDePasse123!"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
}
```

## 🔒 Sécurité

### Fonctionnalités de Sécurité

1. **Tokens Sécurisés** :
   - Tokens de 256 bits générés cryptographiquement
   - Expiration automatique (15 minutes par défaut)
   - Usage unique (invalidation après utilisation)

2. **Protection CSRF** :
   - Token CSRF séparé pour chaque demande
   - Validation stricte des tokens

3. **Rate Limiting** :
   - Maximum 3 tentatives par heure par email
   - Protection contre les attaques par force brute

4. **Logging de Sécurité** :
   - Tous les événements sont loggés
   - Détection des tentatives d'intrusion
   - Traçabilité complète

5. **Invalidation des Sessions** :
   - Toutes les sessions sont invalidées après réinitialisation
   - Forçage de reconnexion

### Bonnes Pratiques

1. **Configuration Email** :
   - Utilisez un service SMTP fiable
   - Configurez SPF, DKIM et DMARC
   - Surveillez les taux de délivrabilité

2. **Monitoring** :
   - Surveillez les logs de sécurité
   - Alertez en cas de tentatives suspectes
   - Vérifiez régulièrement les métriques

3. **Nettoyage** :
   - Exécutez régulièrement le nettoyage des tokens
   - Supprimez les anciens logs de sécurité

## 📧 Template d'Email

Le système génère automatiquement des emails HTML et texte avec :

- **Design responsive** et professionnel
- **Lien de réinitialisation sécurisé**
- **Instructions claires** pour l'utilisateur
- **Avertissements de sécurité**
- **Expiration du lien** (15 minutes)

### Personnalisation

Vous pouvez personnaliser le template dans `services/email.service.ts` :

```typescript
private generatePasswordResetHtml(resetUrl: string): string {
  // Votre template HTML personnalisé
}
```

## 🛠️ Maintenance

### Nettoyage Automatique

Exécutez régulièrement le nettoyage des tokens expirés :

```bash
npm run cleanup-tokens
```

### Nettoyage Programmé

Ajoutez une tâche cron pour le nettoyage automatique :

```bash
# Nettoyage toutes les heures
0 * * * * cd /path/to/your/app && npm run cleanup-tokens

# Nettoyage quotidien à 2h du matin
0 2 * * * cd /path/to/your/app && npm run cleanup-tokens
```

### Monitoring des Logs

Surveillez les logs pour détecter :

- Tentatives de réinitialisation suspectes
- Taux d'échec élevé des emails
- Utilisation anormale des tokens

## 🧪 Tests

### Test de Configuration Email

```bash
curl -X GET http://localhost:3000/api/password-reset/test-email \
  -H "X-API-Key: votre_cle_api"
```

### Test de Demande de Réinitialisation

```bash
curl -X POST http://localhost:3000/api/password-reset/request \
  -H "X-API-Key: votre_cle_api" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test de Validation de Token

```bash
curl -X GET "http://localhost:3000/api/password-reset/validate?token=TOKEN&csrf=CSRF" \
  -H "X-API-Key: votre_cle_api"
```

## 🚨 Gestion des Erreurs

### Erreurs Communes

1. **Email non envoyé** :
   - Vérifiez la configuration SMTP
   - Vérifiez les credentials
   - Vérifiez les logs du serveur

2. **Token invalide** :
   - Vérifiez l'expiration
   - Vérifiez l'usage unique
   - Vérifiez le token CSRF

3. **Rate limiting** :
   - Attendez la fin de la période
   - Vérifiez les logs de sécurité

### Codes d'Erreur

- **400** : Données invalides
- **403** : Token invalide ou expiré
- **429** : Trop de tentatives
- **500** : Erreur serveur

## 📊 Métriques

Le système enregistre automatiquement :

- Nombre de demandes de réinitialisation
- Taux de succès des emails
- Tentatives d'intrusion
- Utilisation des tokens

Accédez aux métriques via :
```
GET /api/password-reset/metrics
```

## 🔄 Intégration Frontend

### Exemple React

```javascript
// Demande de réinitialisation
const requestPasswordReset = async (email) => {
  const response = await fetch('/api/password-reset/request', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.REACT_APP_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// Réinitialisation
const resetPassword = async (token, csrfToken, newPassword) => {
  const response = await fetch('/api/password-reset/reset', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.REACT_APP_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ token, csrfToken, newPassword })
  });
  return response.json();
};
```

### Exemple Vue.js

```javascript
// services/passwordResetService.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  headers: {
    'X-API-Key': process.env.VUE_APP_API_KEY
  }
});

export const passwordResetService = {
  requestReset: (email) => api.post('/password-reset/request', { email }),
  validateToken: (token, csrf) => api.get(`/password-reset/validate?token=${token}&csrf=${csrf}`),
  resetPassword: (token, csrfToken, newPassword) => 
    api.post('/password-reset/reset', { token, csrfToken, newPassword })
};
```

## 🎯 Exemples Complets

### Flux Complet

1. **Utilisateur oublie son mot de passe**
2. **Demande de réinitialisation** via le formulaire
3. **Email envoyé** avec lien sécurisé
4. **Clic sur le lien** → validation du token
5. **Saisie du nouveau mot de passe**
6. **Réinitialisation** et invalidation des sessions
7. **Connexion** avec le nouveau mot de passe

### Gestion des Erreurs

```javascript
try {
  const result = await requestPasswordReset(email);
  if (result.success) {
    showMessage('Email de réinitialisation envoyé');
  } else {
    showError(result.message);
  }
} catch (error) {
  showError('Erreur de connexion');
}
```

Votre système de réinitialisation de mot de passe est maintenant **ultra-sécurisé** et prêt pour la production ! 🔐

