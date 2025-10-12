# 📚 Documentation du Gestionnaire de Mots de Passe

Bienvenue dans la documentation complète du Gestionnaire de Mots de Passe. Cette documentation couvre tous les aspects de l'application, de l'installation à la sécurité en passant par le déploiement.

## 📖 Guides Disponibles

### 🔧 Configuration

- **[Configuration de la Clé API](API_KEY_SETUP.md)** - Guide complet pour configurer et utiliser l'authentification par clé API
- **[Configuration de la Réinitialisation de Mot de Passe](PASSWORD_RESET_SETUP.md)** - Configuration du système de réinitialisation par email

### 🔗 Fonctionnalités Avancées

- **[Configuration des Deep Links](DEEP_LINKS_SETUP.md)** - Guide pour configurer les deep links Electron pour la réinitialisation de mot de passe

### 🚀 Déploiement

- **[Guide de Déploiement](DEPLOYMENT_GUIDE.md)** - Guide complet pour déployer l'application en production

### 🛡️ Sécurité

- **[Guide de Sécurité](SECURITY_GUIDE.md)** - Documentation complète des mesures de sécurité implémentées

## 🏗️ Architecture

### Backend (Node.js + Express)
- **API REST** sécurisée avec authentification JWT
- **Base de données** PostgreSQL avec Prisma ORM
- **Chiffrement** AES-256-GCM pour les mots de passe
- **Email** SMTP pour la réinitialisation de mot de passe
- **Logs** de sécurité et monitoring

### Frontend (React + Electron)
- **Interface moderne** React 18 + TypeScript
- **Application desktop** Electron multiplateforme
- **Deep links** pour l'ouverture automatique
- **Responsive design** avec Tailwind CSS

## 🚀 Démarrage Rapide

### 1. Installation
```bash
# Backend
cd back
npm install
cp .env.example .env
# Configurer .env avec vos variables

# Frontend
cd frontend
npm install
cp .env.example .env
# Configurer .env avec vos variables
```

### 2. Génération des Clés de Sécurité
```bash
cd back
# Générer une clé API sécurisée
npm run generate-api-key

# Copier la clé générée dans vos fichiers .env
```

### 3. Base de Données
```bash
cd back
npm run prisma:generate
npm run prisma:migrate
```

### 4. Démarrage
```bash
# Backend
cd back
npm run dev

# Frontend (Web)
cd frontend
npm run dev

# Electron (optionnel)
cd frontend
npm run electron:dev
```

## 📋 Checklist de Configuration

### Backend
- [ ] Variables d'environnement configurées (DATABASE_URL, API_KEY, JWT_SECRET, etc.)
- [ ] Base de données PostgreSQL accessible et configurée
- [ ] Clé API générée et configurée (256 bits)
- [ ] Service SMTP configuré et testé
- [ ] Migrations Prisma appliquées
- [ ] Scripts de maintenance configurés

### Frontend
- [ ] Variables d'environnement configurées (VITE_API_URL, VITE_API_KEY)
- [ ] URL du backend configurée
- [ ] Clé API configurée (identique au backend)
- [ ] Application Electron testée
- [ ] Deep links fonctionnels

### Sécurité
- [ ] Clés de chiffrement fortes générées (256 bits minimum)
- [ ] Rate limiting configuré (100 req/15min, 5 auth/15min, 3 reset/heure)
- [ ] Headers de sécurité activés (Helmet.js)
- [ ] Logs de sécurité configurés et surveillés
- [ ] Validation des données implémentée
- [ ] Protection CSRF activée

## 🔍 Dépannage

### Problèmes Courants

#### Connexion Backend
- Vérifiez que PostgreSQL est démarré et accessible
- Vérifiez l'URL de connexion dans `.env` (DATABASE_URL)
- Vérifiez que la base de données existe et que les migrations sont appliquées
- Vérifiez que la clé API est configurée et valide

#### Connexion Frontend
- Vérifiez que le backend est démarré sur le port 3001
- Vérifiez la configuration `VITE_API_URL` et `VITE_API_KEY`
- Vérifiez que la clé API est identique entre frontend et backend
- Vérifiez les logs de la console et les erreurs réseau

#### Deep Links Electron
- Vérifiez que l'application Electron est installée
- Vérifiez que le protocole `gestmdp://` est enregistré
- Testez avec le lien web de fallback
- Vérifiez les logs de l'application Electron

#### Emails
- Vérifiez la configuration SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS)
- Testez avec un service comme Gmail (mot de passe d'application)
- Vérifiez les logs du service email
- Testez l'endpoint `/api/password-reset/test-email`

#### Sécurité
- Vérifiez que toutes les clés sont générées et configurées
- Vérifiez que le rate limiting fonctionne
- Vérifiez que les logs de sécurité sont générés
- Testez les endpoints de monitoring (`/health`, `/metrics`)

## 📞 Support

### Ressources
- **Issues GitHub** : [Créer une issue](https://github.com/your-repo/issues)
- **Documentation** : Consultez les guides ci-dessus
- **Logs** : Vérifiez les logs de l'application

### Contact
- **Email** : support@example.com
- **Discord** : [Serveur de support](https://discord.gg/your-server)

## 🤝 Contribution

Nous accueillons les contributions ! Consultez notre [Guide de Contribution](../CONTRIBUTING.md) pour plus d'informations.

### Types de Contributions
- **Documentation** : Amélioration des guides
- **Fonctionnalités** : Nouvelles fonctionnalités
- **Corrections** : Correction de bugs
- **Tests** : Tests et amélioration de la qualité

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](../LICENSE) pour plus de détails.

---

**Merci d'utiliser le Gestionnaire de Mots de Passe !** 🔐
