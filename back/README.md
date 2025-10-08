# Gestionnaire de Mots de Passe - Backend Sécurisé

Un backend sécurisé pour gestionnaire de mots de passe avec chiffrement de bout en bout, authentification robuste et réinitialisation de mot de passe par email.

## 🔒 Fonctionnalités de Sécurité

- **Chiffrement AES-256-GCM** : Tous les mots de passe sont chiffrés avec une clé unique par utilisateur
- **Authentification JWT** : Tokens sécurisés avec expiration et validation de session
- **Hachage des mots de passe** : Utilisation d'Argon2 avec salt
- **Rate Limiting** : Protection contre les attaques par force brute
- **Logs de sécurité** : Audit complet de toutes les actions
- **Headers de sécurité** : Protection contre les attaques XSS, CSRF, etc.
- **Validation des données** : Sanitisation et validation de toutes les entrées
- **Clé API** : Authentification par clé API pour toutes les routes
- **Réinitialisation de mot de passe** : Système sécurisé avec tokens et emails

## 🚀 Installation

### Prérequis

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### Configuration

1. **Cloner et installer les dépendances**
```bash
npm install
```

2. **Configuration de la base de données**
```bash
# Créer un fichier .env à la racine du projet
cp .env.example .env
```

3. **Configurer les variables d'environnement dans .env**
```env
# Base de données
DATABASE_URL="postgresql://username:password@localhost:5432/gestion_mdp?schema=public"

# Sécurité (GÉNÉREZ DES CLÉS FORTES !)
API_KEY="votre_cle_api_256_bits_hexadecimale"
JWT_SECRET="votre_cle_secrete_jwt_tres_longue_et_aleatoire_256_bits"
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Serveur
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# Configuration Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"
SMTP_FROM="Gestionnaire de Mots de Passe <votre-email@gmail.com>"

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL="http://localhost:5173"

# Configuration de sécurité pour la réinitialisation
PASSWORD_RESET_TOKEN_EXPIRATION=15
PASSWORD_RESET_MAX_ATTEMPTS=3
```

4. **Initialiser la base de données**
```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer les migrations
npm run prisma:migrate

# (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npm run prisma:studio
```

5. **Démarrer le serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## 📚 API Endpoints

### Authentification

#### POST `/api/auth/register`
Inscription d'un nouvel utilisateur
```json
{
  "email": "user@example.com",
  "password": "MotDePasseSecurise123!"
}
```

#### POST `/api/auth/login`
Connexion utilisateur
```json
{
  "email": "user@example.com",
  "password": "MotDePasseSecurise123!",
  "rememberMe": true
}
```

#### POST `/api/auth/logout`
Déconnexion (nécessite un token Bearer)

#### GET `/api/auth/verify`
Vérification du token (nécessite un token Bearer)

### Réinitialisation de Mot de Passe

#### POST `/api/password-reset/request`
Demande de réinitialisation de mot de passe
```json
{
  "email": "user@example.com"
}
```

#### POST `/api/password-reset/validate`
Validation du token de réinitialisation
```json
{
  "token": "token_de_reinitialisation",
  "csrf": "token_csrf"
}
```

#### POST `/api/password-reset/reset`
Réinitialisation du mot de passe
```json
{
  "token": "token_de_reinitialisation",
  "csrf": "token_csrf",
  "newPassword": "NouveauMotDePasse123!"
}
```

#### POST `/api/password-reset/cleanup`
Nettoyage des tokens expirés (admin)

### Gestion des Mots de Passe

#### GET `/api/passwords`
Récupérer tous les mots de passe de l'utilisateur (nécessite un token Bearer)

#### GET `/api/passwords/:id`
Récupérer un mot de passe spécifique (nécessite un token Bearer)

#### POST `/api/passwords`
Créer un nouveau mot de passe (nécessite un token Bearer)
```json
{
  "title": "Mon Compte Gmail",
  "url": "https://gmail.com",
  "username": "mon.email@gmail.com",
  "password": "MonMotDePasseGmail",
  "notes": "Compte principal"
}
```

#### PUT `/api/passwords/:id`
Mettre à jour un mot de passe (nécessite un token Bearer)

#### DELETE `/api/passwords/:id`
Supprimer un mot de passe (nécessite un token Bearer)

### Gestion des Clés API

#### GET `/api/api-keys`
Récupérer toutes les clés API de l'utilisateur (nécessite un token Bearer)

#### POST `/api/api-keys`
Créer une nouvelle clé API (nécessite un token Bearer)
```json
{
  "name": "Clé pour application mobile",
  "description": "Clé API pour l'application mobile"
}
```

#### DELETE `/api/api-keys/:id`
Supprimer une clé API (nécessite un token Bearer)

## 🔐 Sécurité

### Chiffrement des Données

- Chaque utilisateur possède une clé de chiffrement unique
- Les mots de passe sont chiffrés avec AES-256-GCM
- Chaque entrée utilise un vecteur d'initialisation (IV) unique
- Les données sensibles ne sont jamais stockées en clair

### Authentification

- Tokens JWT avec expiration
- Sessions stockées en base de données
- Validation de l'IP et User-Agent
- Nettoyage automatique des sessions expirées

### Protection contre les Attaques

- Rate limiting sur toutes les routes
- Limitation spéciale pour l'authentification (5 tentatives/15min)
- Limitation pour la réinitialisation de mot de passe (3 tentatives/heure)
- Headers de sécurité (Helmet)
- Validation et sanitisation des données
- Logs de sécurité complets
- Protection CSRF avec tokens
- Authentification par clé API obligatoire

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Démarrage en mode développement
npm run build        # Compilation TypeScript
npm start           # Démarrage en mode production
npm run prisma:generate  # Génération du client Prisma
npm run prisma:migrate   # Application des migrations
npm run prisma:studio    # Interface graphique Prisma
```

## 📊 Structure de la Base de Données

### Tables Principales

- **users** : Informations utilisateur et clés de chiffrement
- **password_entries** : Mots de passe chiffrés
- **user_sessions** : Sessions actives
- **security_logs** : Logs d'audit et sécurité
- **password_reset_tokens** : Tokens de réinitialisation de mot de passe
- **api_keys** : Clés API des utilisateurs

### Sécurité des Données

- Les mots de passe utilisateur sont hachés avec bcrypt
- Les données sensibles sont chiffrées avec AES-256-GCM
- Chaque utilisateur a sa propre clé de chiffrement
- Les sessions sont validées et expirées automatiquement

## ⚠️ Recommandations de Sécurité

1. **Changez toutes les clés par défaut** dans le fichier `.env`
2. **Utilisez HTTPS** en production
3. **Configurez un firewall** pour limiter l'accès
4. **Sauvegardez régulièrement** la base de données
5. **Surveillez les logs** de sécurité
6. **Mettez à jour** régulièrement les dépendances

## 🐛 Dépannage

### Erreurs de Connexion à la Base de Données
- Vérifiez que PostgreSQL est démarré
- Vérifiez l'URL de connexion dans `.env`
- Vérifiez que la base de données existe

### Erreurs de Chiffrement
- Vérifiez que les clés de chiffrement sont correctement configurées
- Assurez-vous que les données ne sont pas corrompues

### Problèmes de Performance
- Ajustez les paramètres de rate limiting
- Optimisez les requêtes de base de données
- Surveillez l'utilisation mémoire

## 📝 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.
