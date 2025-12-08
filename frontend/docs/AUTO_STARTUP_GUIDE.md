# Fonctionnalité de Démarrage Automatique - CodePass

## 🚀 Description

Cette fonctionnalité permet à l'application CodePass de s'ouvrir automatiquement au démarrage de votre ordinateur, vous donnant un accès rapide à vos mots de passe dès que vous allumez votre machine.

## ✨ Fonctionnalités

- **Activation/Désactivation facile** : Interface utilisateur intuitive pour contrôler le démarrage automatique
- **Multi-plateforme** : Support complet pour Windows, macOS et Linux
- **Sécurisé** : Utilise les mécanismes natifs de chaque système d'exploitation
- **Persistant** : Les paramètres sont sauvegardés et persistent entre les sessions

## 🖥️ Support des Plateformes

### Windows
- Utilise le registre Windows (`HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`)
- Compatible avec toutes les versions récentes de Windows (10, 11)

### macOS
- Utilise les Login Items natifs d'macOS
- Intégration parfaite avec le système de connexion

### Linux
- Crée un fichier `.desktop` dans `~/.config/autostart/`
- Compatible avec GNOME, KDE et autres environnements de bureau

## 📋 Comment Utiliser

### 1. Accéder aux Paramètres
1. Ouvrez l'application CodePass
2. Dans l'en-tête, cliquez sur le bouton **"Démarrage auto"** (icône ⚙️)

### 2. Activer le Démarrage Automatique
1. Dans la fenêtre des paramètres, cliquez sur **"Activer"**
2. Une notification confirmera l'activation
3. L'application s'ouvrira automatiquement au prochain démarrage

### 3. Désactiver le Démarrage Automatique
1. Ouvrez à nouveau les paramètres de démarrage automatique
2. Cliquez sur **"Désactiver"**
3. Une notification confirmera la désactivation

## 🔧 Détails Techniques

### Architecture
- **Processus Principal** : Gère les appels système pour configurer le démarrage automatique
- **Processus Renderer** : Interface utilisateur pour contrôler la fonctionnalité
- **IPC** : Communication sécurisée entre les processus via `ipcMain` et `ipcRenderer`

### Fonctions IPC
```typescript
// Activer/désactiver le démarrage automatique
setAutoStartup(enabled: boolean): Promise<{ success: boolean }>

// Vérifier le statut actuel
getAutoStartupStatus(): Promise<{ enabled: boolean }>
```

### Implémentation par Plateforme

#### Windows
```typescript
// Activation
exec(`reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "CodePass" /t REG_SZ /d "${appPath}" /f`)

// Désactivation
exec(`reg delete "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "CodePass" /f`)
```

#### macOS
```typescript
app.setLoginItemSettings({
  openAtLogin: enabled,
  path: appPath,
  name: appName
})
```

#### Linux
```typescript
// Création du fichier .desktop
const desktopContent = `[Desktop Entry]
Type=Application
Name=${appName}
Exec=${appPath}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true`
```

## 🧪 Tests

Un script de test est disponible pour vérifier la fonctionnalité :

```bash
npm run test-autostartup
```

Ce script :
- Vérifie le statut actuel du démarrage automatique
- Teste l'activation et la désactivation
- Affiche des informations détaillées sur la configuration

## 📁 Fichiers Modifiés

### Nouveaux Fichiers
- `frontend/src/components/AutoStartupSettings.tsx` - Composant d'interface utilisateur
- `frontend/scripts/test-autostartup.js` - Script de test

### Fichiers Modifiés
- `frontend/electron/main.ts` - Logique principale du démarrage automatique
- `frontend/electron/preload.ts` - API IPC exposée au renderer
- `frontend/src/types/electron.ts` - Types TypeScript pour l'API
- `frontend/src/pages/accueil/Accueil.tsx` - Intégration de l'interface
- `frontend/package.json` - Script de test ajouté

## 🔒 Sécurité

- **Permissions minimales** : Utilise uniquement les permissions nécessaires
- **Validation** : Vérification des paramètres avant exécution
- **Gestion d'erreurs** : Messages d'erreur informatifs en cas de problème
- **Isolation** : Fonctionnalité isolée dans le processus principal

## 🐛 Dépannage

### Problèmes Courants

#### Windows
- **Erreur d'accès au registre** : Exécutez l'application en tant qu'administrateur
- **Entrée non supprimée** : Redémarrez l'application et réessayez

#### macOS
- **Login Items non visibles** : Vérifiez dans Préférences Système > Utilisateurs et Groupes > Éléments de connexion

#### Linux
- **Fichier .desktop non créé** : Vérifiez les permissions du répertoire `~/.config/autostart/`
- **Environnement de bureau non supporté** : Certains environnements légers peuvent ne pas supporter l'autostart

### Logs de Débogage
Les logs détaillés sont disponibles dans la console de développement :
- `✅ Démarrage automatique activé`
- `❌ Erreur lors de l'activation du démarrage automatique`

## 🚀 Prochaines Améliorations

- [ ] Interface pour choisir le délai de démarrage
- [ ] Option pour démarrer minimisé
- [ ] Support des arguments de ligne de commande au démarrage
- [ ] Interface pour gérer plusieurs profils de démarrage

## 📞 Support

Si vous rencontrez des problèmes avec cette fonctionnalité :
1. Vérifiez les logs de l'application
2. Testez avec le script `npm run test-autostartup`
3. Consultez la section dépannage ci-dessus
4. Créez une issue sur le repository GitHub

---

**Note** : Cette fonctionnalité nécessite une compilation complète de l'application pour fonctionner correctement. Utilisez `npm run build:win` (ou `build:mac`/`build:linux`) pour créer une version avec cette fonctionnalité.

