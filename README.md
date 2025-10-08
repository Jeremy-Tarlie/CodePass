# 🔐 Gestionnaire de Mots de Passe Sécurisé

Une application desktop moderne et sécurisée pour la gestion de vos mots de passe, développée avec Electron, React et Node.js.

## ✨ Fonctionnalités Principales

### 🔒 Sécurité Avancée
- **Chiffrement AES-256-GCM** : Tous les mots de passe sont chiffrés avec une clé unique par utilisateur
- **Authentification JWT** : Tokens sécurisés avec refresh tokens
- **Hachage Argon2** : Mots de passe utilisateur hachés avec les meilleures pratiques
- **Rate Limiting** : Protection contre les attaques par force brute
- **Logs de sécurité** : Audit complet de toutes les actions
- **Protection CSRF** : Tokens CSRF pour toutes les opérations sensibles

### 📱 Application Desktop
- **Interface moderne** : React 18 + TypeScript + Tailwind CSS
- **Application Electron** : Multiplateforme (Windows, macOS, Linux)
- **Deep Links** : Ouverture automatique via liens email
- **Responsive** : Interface adaptative et intuitive
- **Thème sombre/clair** : Personnalisation de l'apparence

### 🔄 Gestion des Mots de Passe
- **CRUD complet** : Création, lecture, mise à jour, suppression
- **Catégorisation** : Organisation par catégories
- **Recherche** : Filtrage et recherche rapide
- **Copie sécurisée** : Copie en un clic avec nettoyage automatique
- **Validation** : Vérification de la force des mots de passe

### 📧 Réinitialisation de Mot de Passe
- **Email sécurisé** : Envoi d'emails avec tokens cryptographiques
- **Deep Links** : Ouverture automatique de l'application
- **Expiration** : Tokens valides 15 minutes maximum
- **Usage unique** : Tokens invalidés après utilisation
- **Rate limiting** : Protection contre le spam

## 🏗️ Architecture

```
gest_mdp/
├── back/                   # Backend Node.js + Express
│   ├── controllers/        # Contrôleurs API
│   ├── middleware/         # Middlewares de sécurité
│   ├── services/          # Services métier
│   ├── routes/            # Routes API
│   ├── prisma/            # Schéma et migrations DB
│   └── docs/              # Documentation backend
├── frontend/              # Frontend React + Electron
│   ├── src/               # Code source React
│   ├── electron/          # Code Electron
│   └── dist/              # Builds
└── README.md              # Ce fichier
```

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** 18+
- **PostgreSQL** 12+
- **npm** ou **yarn**

### 1. Installation

```bash
# Cloner le projet
git clone <repository-url>
cd gest_mdp

# Installer les dépendances backend
cd back
npm install

# Installer les dépendances frontend
cd ../frontend
npm install
```

### 2. Configuration

#### Backend
```bash
cd back
cp .env.example .env
# Éditer .env avec vos configurations
```

#### Frontend
```bash
cd frontend
cp .env.example .env
# Éditer .env avec vos configurations
```

### 3. Base de Données

```bash
cd back
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate
```

### 4. Démarrage

```bash
# Terminal 1 - Backend
cd back
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Electron (optionnel)
cd frontend
npm run electron:dev
```

## 📚 Documentation

### Backend
- [Configuration API](back/docs/API_KEY_SETUP.md)
- [Réinitialisation de mot de passe](back/docs/PASSWORD_RESET_SETUP.md)
- [README Backend](back/README.md)

### Frontend
- [README Frontend](frontend/README.md)
- [Configuration Electron](frontend/electron-builder.json5)

## 🔧 Configuration

### Variables d'Environnement Backend

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/gestion_mdp"

# Sécurité
API_KEY="votre_cle_api_256_bits"
JWT_SECRET="votre_cle_jwt_secrete"
BCRYPT_ROUNDS=12

# Serveur
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"
```

### Variables d'Environnement Frontend

```env
# API
VITE_API_URL=http://localhost:3001
VITE_API_KEY=votre_cle_api_256_bits

# Application
VITE_APP_NAME=Gestionnaire de Mots de Passe
VITE_APP_VERSION=1.0.0
```

## 🛡️ Sécurité

### Chiffrement
- **AES-256-GCM** pour les mots de passe stockés
- **Argon2** pour le hachage des mots de passe utilisateur
- **Clés uniques** par utilisateur

### Authentification
- **JWT** avec expiration
- **Refresh tokens** pour la persistance
- **Sessions** validées côté serveur

### Protection
- **Rate limiting** sur toutes les routes
- **Headers de sécurité** (Helmet)
- **Validation** des données d'entrée
- **Logs d'audit** complets

## 📱 Deep Links

L'application supporte les deep links pour la réinitialisation de mot de passe :

```
gestmdp://reset-password?token=ABC123&csrf=XYZ789
```

- **Protocole** : `gestmdp://`
- **Fonctionnement** : Ouverture automatique + redirection
- **Sécurité** : Validation des tokens côté serveur

## 🚀 Déploiement

### Build Electron

```bash
cd frontend
npm run electron:build
```

### Build Web

```bash
cd frontend
npm run build
```

### Production Backend

```bash
cd back
npm run build
npm start
```

## 🧪 Tests

```bash
# Backend
cd back
npm test

# Frontend
cd frontend
npm test
```

## 📊 Monitoring

- **Logs de sécurité** : Toutes les actions sont enregistrées
- **Métriques** : Endpoint `/metrics` pour monitoring
- **Santé** : Endpoint `/health` pour vérification

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Issues** : [GitHub Issues](https://github.com/your-repo/issues)
- **Documentation** : Voir le dossier `docs/`
- **Email** : support@example.com

## 🙏 Remerciements

- [Electron](https://electronjs.org/) - Framework desktop
- [React](https://reactjs.org/) - Interface utilisateur
- [Prisma](https://prisma.io/) - ORM et base de données
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Node.js](https://nodejs.org/) - Runtime backend

---

**Développé avec ❤️ pour la sécurité de vos mots de passe**
