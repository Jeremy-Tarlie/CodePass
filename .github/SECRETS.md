# Configuration des Secrets GitHub Actions

Ce document liste tous les secrets nécessaires pour le déploiement automatique.

## 🔒 Pentest & Sécurité (workflow obligatoire)

Les workflows **Deploy** et **Build Electron** exécutent d’abord le workflow **Pentest & Security** (`.github/workflows/pentest.yml`). Le build et le déploiement ne se lancent que si tous les tests de sécurité passent.

Tests exécutés :
- **npm audit** (back + frontend) – vulnérabilités haute/critique
- **Gitleaks** – détection de secrets dans le code
- **TruffleHog** – détection de secrets (800+ types, vérification des fuites)
- **Semgrep** – SAST (OWASP Top 10, Express, JWT, Docker, React, Node, TypeScript)
- **Bearer** – SAST données sensibles et mauvaise config (back + frontend)
- **Trivy** – vulnérabilités fichiers + Dockerfile
- **OWASP Dependency-Check** – CVE sur dépendances (back + frontend), échec si CVSS ≥ 7
- **Hadolint** – lint du Dockerfile (bonnes pratiques)
- **OWASP ZAP** – scan web (optionnel, si URL configurée)
- **Dependency Review** – sur les pull requests
- **CodeQL** – analyse de code (JavaScript/TypeScript)
- **SBOM (Syft)** – Software Bill of Materials (back + frontend), artifacts CycloneDX
- **License checker** – échec si dépendances GPL/AGPL (back + frontend)
- **Lockfile-lint** – registres et HTTPS sur package-lock.json
- **Trivy image** – scan de l’image Docker backend construite (CRITICAL/HIGH)
- **Njsscan** – SAST Node.js/OWASP (back + frontend)
- **ESLint security** – règles `eslint-plugin-security` sur le frontend
- **Actionlint** – validation des workflows GitHub Actions

Secrets / variables optionnels pour le pentest :
- `GITLEAKS_LICENSE` : requis pour les dépôts d’organisation (gitleaks.io)
- `SEMGREP_APP_TOKEN` : optionnel ; envoi des résultats vers Semgrep AppSec Platform
- **Variable** `ZAP_TARGET_URL` : optionnel ; URL à scanner avec OWASP ZAP (Settings > Variables and secrets > Actions > Variables)
- **Variable** `CODE_SCANNING_ENABLED` : mettre à `true` quand Code scanning est activé (Settings > Code security and analysis) pour exécuter le job CodeQL ; sinon le job est ignoré

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
