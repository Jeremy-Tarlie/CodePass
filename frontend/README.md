# Gestionnaire de Mots de Passe - Frontend Electron

Application Electron moderne pour la gestion sécurisée de mots de passe avec interface React et TypeScript.

## 🚀 Fonctionnalités

- **Interface moderne** : React 18 + TypeScript + Vite
- **Application Electron** : Application desktop multiplateforme
- **Authentification sécurisée** : JWT avec refresh tokens
- **Gestion des mots de passe** : CRUD complet avec chiffrement
- **Réinitialisation de mot de passe** : Par email avec deep links
- **Deep links** : Ouverture automatique de l'app via liens email
- **Interface responsive** : Design moderne et intuitif
- **Sécurité** : Protection CSRF et validation des données

## 🛠️ Technologies

- **Frontend** : React 18, TypeScript, Vite
- **Desktop** : Electron
- **Styling** : Tailwind CSS
- **Routing** : React Router v6
- **State Management** : React Context + Hooks
- **Build** : Vite + electron-builder

## 📦 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Configuration

1. **Installer les dépendances**
```bash
npm install
```

2. **Configuration des variables d'environnement**
```bash
# Créer un fichier .env à la racine du frontend
cp .env.example .env
```

3. **Configurer les variables dans .env**
```env
# Configuration API
VITE_API_URL=http://localhost:3001
VITE_API_KEY=votre_cle_api_256_bits_hexadecimale

# Configuration Electron
VITE_APP_NAME=Gestionnaire de Mots de Passe
VITE_APP_VERSION=1.0.0
```

## 🚀 Démarrage

### Mode Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Dans un autre terminal, démarrer Electron
npm run electron:dev
```

### Mode Production

```bash
# Construire l'application
npm run build

# Construire l'application Electron
npm run electron:build

# Lancer l'application construite
npm run electron:preview
```

## 📱 Fonctionnalités de l'Application

### Authentification
- **Connexion** : Email + mot de passe
- **Inscription** : Création de compte sécurisé
- **Réinitialisation** : Mot de passe oublié par email
- **Sessions** : Gestion automatique des tokens

### Gestion des Mots de Passe
- **Ajout** : Nouveaux mots de passe avec catégories
- **Modification** : Édition des entrées existantes
- **Suppression** : Suppression sécurisée
- **Recherche** : Filtrage et recherche rapide
- **Copie** : Copie en un clic des mots de passe

### Sécurité
- **Chiffrement** : Tous les mots de passe sont chiffrés
- **Validation** : Vérification de la force des mots de passe
- **Sessions** : Gestion sécurisée des sessions
- **Deep Links** : Ouverture sécurisée via liens email

## 🔗 Deep Links

L'application supporte les deep links pour la réinitialisation de mot de passe :

- **Protocole** : `gestmdp://`
- **Format** : `gestmdp://reset-password?token=...&csrf=...`
- **Fonctionnement** : Ouverture automatique de l'app + redirection

### Configuration des Deep Links

Les deep links sont automatiquement configurés lors de l'installation de l'application via `electron-builder`.

## 🏗️ Structure du Projet

```
frontend/
├── src/
│   ├── components/          # Composants réutilisables
│   ├── contexts/           # Contextes React (Auth, etc.)
│   ├── hooks/              # Hooks personnalisés
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services API
│   ├── types/              # Types TypeScript
│   └── config/             # Configuration
├── electron/               # Code Electron
│   ├── main.ts            # Processus principal
│   └── preload.ts         # Script de préchargement
├── dist-electron/         # Build Electron
└── dist/                  # Build web
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev                # Serveur de développement Vite
npm run electron:dev       # Electron en mode développement

# Build
npm run build              # Build web
npm run electron:build     # Build Electron
npm run electron:preview   # Prévisualiser l'app construite

# Linting et formatage
npm run lint               # ESLint
npm run lint:fix           # Corriger automatiquement
```

## 🔒 Sécurité

### Authentification
- Tokens JWT avec expiration
- Refresh tokens pour la persistance
- Validation des sessions côté serveur

### Protection des Données
- Chiffrement AES-256-GCM côté serveur
- Validation des données d'entrée
- Protection CSRF avec tokens

### Deep Links
- Validation des tokens de réinitialisation
- Expiration automatique (15 minutes)
- Usage unique des tokens

## 🐛 Dépannage

### Problèmes de Connexion
- Vérifiez que le backend est démarré sur le port 3001
- Vérifiez la configuration `VITE_API_URL` et `VITE_API_KEY`
- Vérifiez les logs de la console

### Problèmes Electron
- Redémarrez l'application Electron
- Vérifiez que les deep links sont bien enregistrés
- Testez en mode développement d'abord

### Problèmes de Build
- Supprimez `node_modules` et `dist-electron`
- Réinstallez les dépendances
- Vérifiez la configuration `electron-builder.json5`

## 📝 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.
