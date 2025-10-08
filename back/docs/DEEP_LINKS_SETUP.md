# Configuration des Deep Links Electron

Ce document explique comment configurer et utiliser les deep links pour la réinitialisation de mot de passe dans l'application Electron.

## 🔗 Qu'est-ce qu'un Deep Link ?

Un deep link est un lien personnalisé qui ouvre directement votre application Electron au lieu d'un navigateur web. Dans notre cas, nous utilisons le protocole `gestmdp://` pour ouvrir l'application et rediriger vers la page de réinitialisation de mot de passe.

## 🛠️ Configuration

### 1. Protocole Personnalisé

Le protocole `gestmdp://` est configuré dans `frontend/electron/main.ts` :

```typescript
// Enregistrement du protocole (AVANT app.whenReady())
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'gestmdp',
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);
```

### 2. Gestion des Deep Links

```typescript
// Gestion des deep links sur Windows
app.on('second-instance', (event, commandLine) => {
  const deepLink = commandLine.find(arg => arg.startsWith('gestmdp://'));
  if (deepLink) {
    handleDeepLink(deepLink);
  }
});

// Gestion des deep links sur macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});
```

### 3. Configuration electron-builder

Le protocole est enregistré automatiquement lors de l'installation via `frontend/electron-builder.json5` :

```json5
{
  "mac": {
    "protocols": [
      {
        "name": "Gestionnaire de Mots de Passe",
        "schemes": ["gestmdp"]
      }
    ]
  },
  "win": {
    "protocols": [
      {
        "name": "Gestionnaire de Mots de Passe", 
        "schemes": ["gestmdp"]
      }
    ]
  },
  "linux": {
    "protocols": [
      {
        "name": "Gestionnaire de Mots de Passe",
        "schemes": ["gestmdp"]
      }
    ]
  }
}
```

## 📧 Intégration avec les Emails

### Format du Lien

Les emails de réinitialisation contiennent deux types de liens :

1. **Lien Electron** (production) : `gestmdp://reset-password?token=ABC123&csrf=XYZ789`
2. **Lien Web** (développement/fallback) : `http://localhost:5173/reset-password?token=ABC123&csrf=XYZ789`

### Détection du Mode

Le service email détecte automatiquement le mode :

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const primaryUrl = isDevelopment ? webUrl : electronUrl;
const secondaryUrl = isDevelopment ? electronUrl : webUrl;
```

## 🔄 Flux Complet

### 1. Demande de Réinitialisation
```
Utilisateur → Page Connexion → "Mot de passe oublié" → Saisie email
```

### 2. Génération des Tokens
```
Backend → Génère token + CSRF → Envoie email avec liens
```

### 3. Email Reçu
```
Email → Bouton principal (gestmdp:// ou http://) → Lien secondaire
```

### 4. Clic sur le Lien
```
Clic → Application s'ouvre → Traitement du deep link → Redirection
```

### 5. Réinitialisation
```
Page de réinitialisation → Validation token → Nouveau mot de passe
```

## 🧪 Test des Deep Links

### Test Manuel

```bash
# Windows
start gestmdp://reset-password?token=test123&csrf=test456

# macOS
open gestmdp://reset-password?token=test123&csrf=test456

# Linux
xdg-open gestmdp://reset-password?token=test123&csrf=test456
```

### Test avec PowerShell

```powershell
Start-Process "gestmdp://reset-password?token=test123&csrf=test456"
```

### Test Automatisé

```javascript
// Dans un test
const { spawn } = require('child_process');
const deepLink = 'gestmdp://reset-password?token=test123&csrf=test456';

// Windows
spawn('cmd', ['/c', 'start', deepLink]);

// macOS
spawn('open', [deepLink]);

// Linux
spawn('xdg-open', [deepLink]);
```

## 🔒 Sécurité

### Validation des Tokens

```typescript
// Validation côté serveur
const isValidToken = await validatePasswordResetToken(token, csrf);
if (!isValidToken) {
  return res.status(400).json({ 
    success: false, 
    message: 'Token invalide ou expiré' 
  });
}
```

### Protection CSRF

- Chaque token de réinitialisation a un token CSRF associé
- Les deux tokens sont requis pour la validation
- Les tokens expirent après 15 minutes
- Usage unique : les tokens sont invalidés après utilisation

### Rate Limiting

- Maximum 3 tentatives de réinitialisation par heure par email
- Logs de sécurité pour toutes les tentatives
- Blocage temporaire en cas de dépassement

## 🐛 Dépannage

### Le Deep Link ne Fonctionne Pas

1. **Vérifiez l'enregistrement du protocole** :
   ```bash
   # Windows - Vérifier dans le registre
   reg query "HKEY_CLASSES_ROOT\gestmdp"
   
   # macOS - Vérifier dans Info.plist
   cat /Applications/YourApp.app/Contents/Info.plist | grep gestmdp
   ```

2. **Redémarrez l'application** après l'installation

3. **Testez en mode développement** d'abord

### L'Application ne S'Ouvre Pas

1. **Vérifiez que l'application est installée**
2. **Testez avec le lien web de fallback**
3. **Vérifiez les logs de l'application**

### Erreur de Token

1. **Vérifiez que le backend est démarré**
2. **Vérifiez que le token n'est pas expiré**
3. **Refaites une demande de réinitialisation**

## 📱 Support Multiplateforme

### Windows
- Enregistrement automatique via `electron-builder`
- Gestion via `app.on('second-instance')`
- Support des arguments de ligne de commande

### macOS
- Enregistrement dans `Info.plist`
- Gestion via `app.on('open-url')`
- Support des URL schemes

### Linux
- Enregistrement via fichier `.desktop`
- Gestion via `app.on('second-instance')`
- Support des arguments de ligne de commande

## 🚀 Déploiement

### Build et Installation

```bash
# Build de l'application
npm run electron:build

# Installation (enregistre automatiquement le protocole)
# Windows : .exe installer
# macOS : .dmg ou .pkg
# Linux : .AppImage, .deb, .rpm
```

### Vérification Post-Installation

```bash
# Test du protocole après installation
gestmdp://test

# L'application devrait s'ouvrir
```

## 📚 Ressources

- [Documentation Electron - Protocol](https://www.electronjs.org/docs/latest/api/protocol)
- [Documentation electron-builder - Protocols](https://www.electron.build/configuration/configuration)
- [Deep Links - Guide complet](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app)

---

**Les deep links permettent une expérience utilisateur fluide pour la réinitialisation de mot de passe !** 🎉
