# Configuration des Secrets GitHub Actions

Ce document liste tous les secrets nécessaires pour le déploiement automatique.

## 🔐 Secrets à configurer dans GitHub

Allez dans **Settings > Secrets and variables > Actions** de votre repository GitHub et ajoutez les secrets suivants :

### DockerHub
- `DOCKERHUB_USERNAME` : Votre nom d'utilisateur DockerHub
- `DOCKERHUB_TOKEN` : Votre token d'accès DockerHub (Access Token)

### Serveur de déploiement
- `SERVER_HOST` : Adresse IP ou nom de domaine de votre serveur
- `SERVER_USERNAME` : Nom d'utilisateur SSH pour se connecter au serveur
- `SERVER_SSH_KEY` : Clé privée SSH pour l'authentification
- `SERVER_PORT` : Port SSH (généralement 22)
- `SERVER_APP_PATH` : Chemin vers le répertoire de l'application sur le serveur (ex: /home/user/app)

### Configuration de l'application
- `JWT_SECRET` : Clé secrète pour signer les JWT (générez une clé forte)
- `CORS_ORIGIN` : URL du frontend (ex: https://votre-domaine.com)
- `FRONTEND_URL` : URL complète du frontend pour les emails

### Configuration Email (SMTP)
- `SMTP_HOST` : Serveur SMTP (ex: smtp.gmail.com)
- `SMTP_PORT` : Port SMTP (ex: 587 ou 465)
- `SMTP_USER` : Nom d'utilisateur email
- `SMTP_PASS` : Mot de passe email ou mot de passe d'application
- `SMTP_FROM` : Adresse email d'expéditeur (ex: "Mon App <noreply@monapp.com>")

## 🚀 Comment générer les secrets

### DockerHub Token
1. Allez sur [DockerHub](https://hub.docker.com)
2. Settings > Security > New Access Token
3. Donnez un nom et sélectionnez les permissions (Read, Write, Delete)

### Clé SSH
```bash
# Générer une nouvelle clé SSH
ssh-keygen -t rsa -b 4096 -C "github-actions@votre-domaine.com"

# Copier la clé publique sur votre serveur
ssh-copy-id -i ~/.ssh/id_rsa.pub utilisateur@votre-serveur.com

# La clé privée (~/.ssh/id_rsa) sera le secret SERVER_SSH_KEY
```

### JWT Secret
```bash
# Générer une clé JWT forte
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📋 Checklist de configuration

- [ ] Repository GitHub créé
- [ ] Secrets GitHub configurés
- [ ] Serveur accessible via SSH
- [ ] Docker installé sur le serveur
- [ ] Compte DockerHub créé
- [ ] Token DockerHub généré
- [ ] Clé SSH configurée

## 🔧 Test du déploiement

1. Poussez du code sur la branche `main`
2. Le workflow se déclenche automatiquement
3. Vérifiez les logs dans **Actions** de votre repository
4. Testez l'application sur votre serveur

## 🆘 Dépannage

### Erreur de connexion SSH
- Vérifiez que la clé SSH est correcte
- Testez la connexion manuellement : `ssh utilisateur@serveur`

### Erreur DockerHub
- Vérifiez le token DockerHub
- Assurez-vous que le repository existe sur DockerHub

### Erreur de déploiement
- Vérifiez les logs du workflow
- Connectez-vous au serveur et vérifiez : `docker ps`
