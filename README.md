# 🔐 Gestionnaire de Mots de Passe Sécurisé

Une application desktop moderne et sécurisée pour la gestion de vos mots de passe, développée avec Electron, React et Node.js.

## ✨ Fonctionnalités Principales

### 🔒 Sécurité Avancée
- **Chiffrement AES-256-GCM** : Tous les mots de passe sont chiffrés avec une clé unique par utilisateur
- **Authentification JWT** : Tokens sécurisés avec refresh tokens et sessions persistantes
- **Hachage Argon2** : Mots de passe utilisateur hachés avec les meilleures pratiques OWASP
- **Clés API** : Authentification par clé API pour sécuriser l'accès au backend
- **Rate Limiting** : Protection contre les attaques par force brute et DDoS
- **Logs de sécurité** : Audit complet de toutes les actions avec métriques
- **Protection CSRF** : Tokens CSRF pour toutes les opérations sensibles
- **Headers de sécurité** : Protection contre XSS, clickjacking et autres attaques

### 📱 Application Desktop
- **Interface moderne** : React 18 + TypeScript + Tailwind CSS v4
- **Application Electron** : Multiplateforme (Windows, macOS, Linux)
- **Deep Links** : Ouverture automatique via liens email avec protocole `gestmdp://`
- **Responsive** : Interface adaptative et intuitive
- **Gestion d'erreurs** : Error boundaries et pages d'erreur personnalisées
- **Navigation** : React Router avec routes protégées

### 🔄 Gestion des Mots de Passe
- **CRUD complet** : Création, lecture, mise à jour, suppression sécurisées
- **Chiffrement individuel** : Chaque mot de passe chiffré avec un IV unique
- **Recherche** : Filtrage et recherche rapide par titre
- **Copie sécurisée** : Copie en un clic avec nettoyage automatique du presse-papiers
- **Validation** : Vérification de la force des mots de passe côté client et serveur
- **Organisation** : Gestion par URL pour catégorisation automatique

### 📧 Réinitialisation de Mot de Passe
- **Email sécurisé** : Envoi d'emails HTML/text avec tokens cryptographiques
- **Deep Links** : Ouverture automatique de l'application via protocole personnalisé
- **Expiration** : Tokens valides 15 minutes maximum
- **Usage unique** : Tokens invalidés après utilisation
- **Rate limiting** : Protection contre le spam (3 tentatives/heure)
- **Double protection** : Tokens de réinitialisation + tokens CSRF

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

### 4. Génération des Clés de Sécurité

```bash
cd back
# Générer une clé API sécurisée
npm run generate-api-key

# Copier la clé générée dans vos fichiers .env
```

### 5. Démarrage

```bash
# Terminal 1 - Backend
cd back
npm run dev

# Terminal 2 - Frontend (Web)
cd frontend
npm run dev

# Terminal 3 - Electron (optionnel)
cd frontend
npm run electron:dev
```

## 📚 Documentation

### Backend
- [Documentation complète](back/docs/README.md) - Guide principal du backend
- [Configuration API](back/docs/API_KEY_SETUP.md) - Authentification par clé API
- [Réinitialisation de mot de passe](back/docs/PASSWORD_RESET_SETUP.md) - Système de réinitialisation
- [Configuration Deep Links](back/docs/DEEP_LINKS_SETUP.md) - Deep links Electron
- [Guide de Sécurité](back/docs/SECURITY_GUIDE.md) - Mesures de sécurité
- [README Backend](back/README.md) - Documentation technique

### Frontend
- [README Frontend](frontend/README.md) - Guide du frontend
- [Configuration Electron](frontend/electron-builder.json5) - Build et déploiement

## 🔧 Configuration

### Variables d'Environnement Backend

```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/gestion_mdp"

# Sécurité
API_KEY="votre_cle_api_256_bits_generee"
JWT_SECRET="votre_cle_jwt_secrete_tres_longue"
SESSION_SECRET="votre_cle_session_secrete"
ENCRYPTION_KEY="votre_cle_chiffrement_256_bits"

# Serveur
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
TRUST_PROXY=false

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"
SMTP_FROM="Gestionnaire de Mots de Passe <votre-email@gmail.com>"

# Frontend
FRONTEND_URL="http://localhost:5173"

# Sécurité avancée
PASSWORD_RESET_TOKEN_EXPIRATION=15
PASSWORD_RESET_MAX_ATTEMPTS=3
```

### Variables d'Environnement Frontend

```env
# API
VITE_API_URL=http://localhost:3001
VITE_API_KEY=votre_cle_api_256_bits_generee

# Application
VITE_APP_NAME=Gestionnaire de Mots de Passe
VITE_APP_VERSION=1.0.0
```

## 🛡️ Sécurité

### Chiffrement
- **AES-256-GCM** pour les mots de passe stockés avec IV unique
- **Argon2** pour le hachage des mots de passe utilisateur (OWASP recommandé)
- **Clés uniques** par utilisateur pour le chiffrement
- **Vecteurs d'initialisation** aléatoires pour chaque chiffrement

### Authentification
- **JWT** avec expiration courte (24h)
- **Refresh tokens** pour la persistance (30 jours)
- **Sessions** validées côté serveur avec IP et User-Agent
- **Clés API** pour sécuriser l'accès au backend

### Protection
- **Rate limiting** sur toutes les routes (100 req/15min)
- **Rate limiting spécial** pour l'authentification (5 tentatives/15min)
- **Headers de sécurité** (Helmet) : CSP, HSTS, X-Frame-Options
- **Validation** des données d'entrée avec sanitisation
- **Logs d'audit** complets avec métriques de sécurité
- **Protection CSRF** avec tokens uniques
- **Monitoring** en temps réel avec alertes

## 📱 Deep Links

L'application supporte les deep links pour la réinitialisation de mot de passe :

```
gestmdp://reset-password?token=ABC123&csrf=XYZ789
```

- **Protocole** : `gestmdp://` (enregistré automatiquement)
- **Fonctionnement** : Ouverture automatique + redirection vers la page de réinitialisation
- **Sécurité** : Validation des tokens côté serveur avec expiration (15 min)
- **Fallback** : Lien web de secours si l'application n'est pas installée
- **Multiplateforme** : Support Windows, macOS et Linux

## 🚀 Déploiement

### Build Electron

```bash
cd frontend
npm run build  # Build web + Electron
```

### Build Web uniquement

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

### Scripts de Maintenance

```bash
# Nettoyage des tokens expirés
cd back
npm run cleanup-tokens

# Génération d'une nouvelle clé API
cd back
npm run generate-api-key

# Studio Prisma (interface graphique)
cd back
npm run prisma:studio
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

- **Logs de sécurité** : Toutes les actions sont enregistrées avec métadonnées
- **Métriques système** : Endpoint `/metrics` pour monitoring des performances
- **Santé de l'application** : Endpoint `/health` pour vérification de l'état
- **Métriques de logging** : Endpoint `/logs/metrics` pour les statistiques des logs
- **Alertes** : Système d'alertes avec résolution via `/alerts/:alertId/resolve`
- **Nettoyage automatique** : Suppression périodique des logs anciens

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
