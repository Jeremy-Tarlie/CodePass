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
# Configurer .env

# Frontend
cd frontend
npm install
cp .env.example .env
# Configurer .env
```

### 2. Base de Données
```bash
cd back
npm run prisma:generate
npm run prisma:migrate
```

### 3. Démarrage
```bash
# Backend
cd back
npm run dev

# Frontend
cd frontend
npm run dev

# Electron (optionnel)
cd frontend
npm run electron:dev
```

## 📋 Checklist de Configuration

### Backend
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL accessible
- [ ] Clé API générée et configurée
- [ ] Service SMTP configuré
- [ ] Migrations appliquées

### Frontend
- [ ] Variables d'environnement configurées
- [ ] URL du backend configurée
- [ ] Clé API configurée
- [ ] Application Electron testée

### Sécurité
- [ ] Clés de chiffrement fortes générées
- [ ] Rate limiting configuré
- [ ] Headers de sécurité activés
- [ ] Logs de sécurité configurés

## 🔍 Dépannage

### Problèmes Courants

#### Connexion Backend
- Vérifiez que PostgreSQL est démarré
- Vérifiez l'URL de connexion dans `.env`
- Vérifiez que la base de données existe

#### Connexion Frontend
- Vérifiez que le backend est démarré sur le port 3001
- Vérifiez la configuration `VITE_API_URL` et `VITE_API_KEY`
- Vérifiez les logs de la console

#### Deep Links Electron
- Vérifiez que l'application Electron est installée
- Testez avec le lien web de fallback
- Vérifiez les logs de l'application

#### Emails
- Vérifiez la configuration SMTP
- Testez avec un service comme Gmail
- Vérifiez les logs du service email

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
