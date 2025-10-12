# Guide de Sécurité

Ce document détaille les mesures de sécurité implémentées dans le Gestionnaire de Mots de Passe et les bonnes pratiques à suivre.

## 🔒 Architecture de Sécurité

### Principe de Défense en Profondeur

Notre application implémente plusieurs couches de sécurité :

1. **Chiffrement des données** (AES-256-GCM)
2. **Authentification robuste** (JWT + Argon2)
3. **Protection des API** (Clés API + Rate Limiting)
4. **Validation des données** (Sanitisation + Validation)
5. **Logs de sécurité** (Audit complet)
6. **Protection réseau** (HTTPS + Headers de sécurité)

## 🛡️ Chiffrement des Données

### Chiffrement des Mots de Passe Stockés

```typescript
// Chiffrement AES-256-GCM avec clé unique par utilisateur
const encryptedPassword = await encrypt(password, user.encryptionKey);

// Décryptage sécurisé
const decryptedPassword = await decrypt(encryptedPassword, user.encryptionKey);
```

**Caractéristiques :**
- **Algorithme** : AES-256-GCM (Galois/Counter Mode)
- **Clé unique** : Chaque utilisateur a sa propre clé de chiffrement
- **IV aléatoire** : Vecteur d'initialisation unique pour chaque chiffrement
- **Authentification** : GCM fournit l'authentification intégrée

### Hachage des Mots de Passe Utilisateur

```typescript
// Hachage avec Argon2 (recommandé par l'OWASP)
const hashedPassword = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1
});

// Vérification du mot de passe
const isValid = await argon2.verify(hashedPassword, password);
```

**Avantages d'Argon2 :**
- **Résistant aux attaques** : ASIC, GPU, et attaques par dictionnaire
- **Configurable** : Mémoire, temps, et parallélisme ajustables
- **Standard** : Winner du Password Hashing Competition (2015)
- **Timing-safe** : Protection contre les attaques par timing
- **Salt automatique** : Génération automatique de salt unique

## 🔐 Authentification et Autorisation

### Tokens JWT Sécurisés

```typescript
// Génération de token avec expiration
const token = jwt.sign(
  { 
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000)
  },
  process.env.JWT_SECRET,
  { 
    expiresIn: '24h',
    algorithm: 'HS256'
  }
);
```

**Sécurité des tokens :**
- **Expiration courte** : 24h pour les tokens d'accès
- **Refresh tokens** : 30 jours pour la persistance
- **Validation côté serveur** : Vérification de chaque requête
- **Révocation** : Invalidation possible des sessions

### Clés API

```typescript
// Génération d'une clé API sécurisée
const apiKey = crypto.randomBytes(32).toString('hex');

// Validation dans le middleware avec comparaison timing-safe
const isValidApiKey = crypto.timingSafeEqual(
  Buffer.from(req.headers['x-api-key'] || '', 'hex'),
  Buffer.from(process.env.API_KEY || '', 'hex')
);

if (!isValidApiKey) {
  return res.status(401).json({ error: 'Clé API invalide' });
}
```

**Caractéristiques :**
- **Longueur** : 256 bits (32 bytes)
- **Génération** : Cryptographiquement sécurisée
- **Validation timing-safe** : Protection contre les attaques par timing
- **Logging** : Tous les accès sont loggés avec masquage de la clé
- **Rotation** : Possibilité de rotation des clés avec `API_KEY_SECONDARY`

## 🚫 Protection contre les Attaques

### Rate Limiting

```typescript
// Limitation générale par IP
const generalRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
};

// Limitation spéciale pour l'authentification
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion, réessayez plus tard'
};

// Limitation pour la réinitialisation de mot de passe
const passwordResetRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 tentatives par heure
  skipSuccessfulRequests: true
};
```

**Protection contre :**
- **Attaques par force brute** : Limitation des tentatives de connexion (5/15min)
- **DDoS** : Limitation globale des requêtes (100/15min)
- **Spam de réinitialisation** : Limitation des demandes (3/heure)
- **Attaques par déni de service** : Protection des ressources serveur

### Protection CSRF

```typescript
// Génération de token CSRF pour la réinitialisation
const csrfToken = crypto.randomBytes(32).toString('hex');

// Stockage avec le token de réinitialisation
await prisma.passwordResetToken.create({
  data: {
    token: resetToken,
    csrfToken: csrfToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000)
  }
});

// Validation dans les requêtes sensibles
const isValidCsrf = crypto.timingSafeEqual(
  Buffer.from(req.body.csrfToken, 'hex'),
  Buffer.from(tokenRecord.csrfToken, 'hex')
);
```

**Implémentation :**
- **Tokens uniques** : Générés pour chaque demande de réinitialisation
- **Double protection** : Token de réinitialisation + token CSRF
- **Validation timing-safe** : Protection contre les attaques par timing
- **Expiration** : Tokens expirés automatiquement (15 minutes)
- **Usage unique** : Tokens invalidés après utilisation

### Headers de Sécurité

```typescript
// Configuration Helmet.js avancée
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

app.use(helmetConfig);
```

**Headers implémentés :**
- **CSP** : Content Security Policy stricte
- **HSTS** : HTTP Strict Transport Security avec preload
- **X-Frame-Options** : Protection contre le clickjacking
- **X-Content-Type-Options** : Protection contre MIME sniffing
- **X-XSS-Protection** : Protection contre les attaques XSS
- **Referrer-Policy** : Contrôle des informations de référent
- **Permissions-Policy** : Contrôle des fonctionnalités du navigateur

## 🔍 Validation et Sanitisation

### Validation des Données d'Entrée

```typescript
// Validation avec express-validator
const passwordValidationRules = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Le titre doit contenir entre 1 et 100 caractères'),
  body('url')
    .optional()
    .isURL()
    .withMessage('URL invalide'),
  body('username')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Les notes ne peuvent pas dépasser 500 caractères')
];
```

**Règles de validation :**
- **Mots de passe** : Minimum 8 caractères, majuscule, minuscule, chiffre, caractère spécial
- **Emails** : Format email valide avec normalisation
- **URLs** : Format URL valide
- **Longueurs** : Limites de caractères appropriées
- **Sanitisation** : Nettoyage automatique des espaces et caractères spéciaux

### Sanitisation des Données

```typescript
// Middleware de sanitisation automatique
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Nettoyage des paramètres de requête
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Nettoyage des paramètres d'URL
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  next();
};

// Validation de la taille des données
const validateDataSize = (maxSize: number) => (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  if (contentLength > maxSize) {
    return res.status(413).json({ error: 'Données trop volumineuses' });
  }
  next();
};
```

**Protection contre :**
- **XSS** : Nettoyage automatique des entrées utilisateur
- **Injection SQL** : Requêtes paramétrées via Prisma ORM
- **Injection de commandes** : Validation stricte des données
- **Attaques par déni de service** : Limitation de la taille des données
- **Injection de caractères** : Nettoyage des espaces et caractères spéciaux

## 📊 Logs de Sécurité

### Audit des Actions

```typescript
// Logging de toutes les actions sensibles
await logSecurityEvent(
  userId,
  'PASSWORD_CREATED',
  req.ip,
  req.get('User-Agent'),
  true,
  `Nouveau mot de passe créé: ${title}`,
  {
    passwordId: password.id,
    url: password.url,
    timestamp: new Date().toISOString()
  }
);

// Logging des tentatives d'intrusion
await logSecurityEvent(
  null,
  'SECURITY_ALERT',
  req.ip,
  req.get('User-Agent'),
  false,
  'Tentative d\'accès avec clé API invalide',
  {
    apiKeyPrefix: req.headers['x-api-key']?.substring(0, 8) + '...',
    endpoint: req.path,
    method: req.method
  }
);
```

**Événements enregistrés :**
- **Authentification** : Connexions, déconnexions, échecs, sessions
- **Gestion des mots de passe** : Création, modification, suppression, accès
- **Réinitialisation** : Demandes, validations, échecs, utilisations
- **Sécurité** : Tentatives d'intrusion, rate limiting, clés API invalides
- **Système** : Erreurs serveur, performances, alertes

### Format des Logs

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "event": "PASSWORD_CREATED",
  "userId": "user123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "success": true,
  "details": "Nouveau mot de passe créé: Gmail",
  "metadata": {
    "passwordId": "pwd456",
    "url": "https://gmail.com",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Monitoring et Alertes

```typescript
// Système de monitoring en temps réel
const monitoringConfig = {
  healthCheck: {
    interval: 30000, // 30 secondes
    endpoints: ['/health', '/metrics']
  },
  alerts: {
    highErrorRate: { threshold: 0.05, window: 300000 }, // 5% sur 5 minutes
    slowResponse: { threshold: 2000, window: 60000 }, // 2s sur 1 minute
    securityEvents: { threshold: 10, window: 300000 } // 10 événements sur 5 minutes
  }
};
```

**Métriques surveillées :**
- **Performance** : Temps de réponse, utilisation CPU/mémoire
- **Erreurs** : Taux d'erreur, types d'erreurs
- **Sécurité** : Tentatives d'intrusion, rate limiting
- **Système** : État de la base de données, connectivité

## 🔄 Gestion des Sessions

### Sessions Sécurisées

```typescript
// Gestion des sessions avec base de données
const createUserSession = async (userId: string, token: string, ipAddress: string, userAgent: string, rememberMe: boolean = false) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1)); // 30 jours ou 1 jour
  
  return await prisma.userSession.create({
    data: {
      token,
      userId,
      ipAddress,
      userAgent,
      expiresAt,
      rememberMe
    }
  });
};

// Validation des sessions
const validateSession = async (token: string, ipAddress: string, userAgent: string) => {
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  
  // Vérification de l'IP et User-Agent pour la sécurité
  if (session.ipAddress !== ipAddress || session.userAgent !== userAgent) {
    await prisma.userSession.delete({ where: { id: session.id } });
    return null;
  }
  
  return session;
};
```

**Caractéristiques :**
- **Stockage en base** : Sessions persistantes et sécurisées
- **Validation IP/User-Agent** : Détection des sessions compromises
- **Expiration flexible** : 24h standard, 30 jours avec "rester connecté"
- **Nettoyage automatique** : Suppression des sessions expirées
- **Révocation** : Invalidation possible des sessions

### Invalidation des Sessions

```typescript
// Invalidation lors de la déconnexion
await prisma.userSession.deleteMany({
  where: {
    userId: user.id,
    token: refreshToken
  }
});

// Invalidation de toutes les sessions d'un utilisateur (en cas de compromission)
await prisma.userSession.deleteMany({
  where: {
    userId: user.id
  }
});

// Nettoyage automatique des sessions expirées
const cleanupExpiredSessions = async () => {
  const deletedCount = await prisma.userSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  console.log(`Sessions expirées supprimées: ${deletedCount.count}`);
};
```

## 📧 Sécurité des Emails

### Tokens de Réinitialisation

```typescript
// Génération de tokens sécurisés
const resetToken = crypto.randomBytes(32).toString('hex');
const csrfToken = crypto.randomBytes(32).toString('hex');

// Stockage avec expiration et métadonnées de sécurité
await prisma.passwordResetToken.create({
  data: {
    token: resetToken,
    csrfToken: csrfToken,
    userId: user.id,
    email: user.email,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    ipAddress: req.ip,
    userAgent: req.get('User-Agent') || 'Unknown'
  }
});

// Validation avec vérification de sécurité
const validateResetToken = async (token: string, csrfToken: string, ipAddress: string) => {
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });
  
  if (!tokenRecord || tokenRecord.used || tokenRecord.expiresAt < new Date()) {
    return null;
  }
  
  // Vérification du token CSRF
  const isValidCsrf = crypto.timingSafeEqual(
    Buffer.from(csrfToken, 'hex'),
    Buffer.from(tokenRecord.csrfToken, 'hex')
  );
  
  if (!isValidCsrf) {
    return null;
  }
  
  return tokenRecord;
};
```

**Sécurité :**
- **Expiration courte** : 15 minutes maximum
- **Usage unique** : Tokens invalidés après utilisation
- **Rate limiting** : 3 tentatives par heure par email
- **Double protection** : Token de réinitialisation + token CSRF
- **Traçabilité** : IP et User-Agent enregistrés
- **Validation timing-safe** : Protection contre les attaques par timing

## 🚨 Réponse aux Incidents

### Détection d'Intrusion

```typescript
// Détection de patterns suspects
const suspiciousPatterns = [
  'Multiple failed login attempts',
  'Unusual IP addresses',
  'Bulk password requests',
  'Invalid API key usage'
];

// Alertes automatiques
if (detectSuspiciousActivity(event)) {
  await sendSecurityAlert(event);
  await logSecurityEvent(userId, 'SECURITY_ALERT', ip, userAgent, false, details);
}
```

### Procédures d'Urgence

1. **Compromission détectée** :
   - Invalidation immédiate des sessions
   - Notification des utilisateurs
   - Analyse des logs

2. **Attaque en cours** :
   - Blocage des IPs suspectes
   - Augmentation du rate limiting
   - Monitoring renforcé

3. **Données exposées** :
   - Rotation des clés de chiffrement
   - Réinitialisation des mots de passe
   - Audit complet

## 🔧 Configuration de Sécurité

### Variables d'Environnement Sensibles

```env
# Clés de chiffrement (GÉNÉREZ DES CLÉS FORTES !)
API_KEY="votre_cle_api_256_bits_hexadecimale"
JWT_SECRET="votre_cle_jwt_secrete_tres_longue_et_aleatoire"
SESSION_SECRET="votre_cle_session_secrete"
ENCRYPTION_KEY="votre_cle_chiffrement_256_bits"

# Configuration de sécurité
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="30d"
PASSWORD_RESET_TOKEN_EXPIRATION=15
PASSWORD_RESET_MAX_ATTEMPTS=3

# Configuration serveur
PORT=3001
NODE_ENV="production"
CORS_ORIGIN="https://votre-domaine.com"
TRUST_PROXY=true

# Configuration email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"
SMTP_FROM="Gestionnaire de Mots de Passe <votre-email@gmail.com>"

# Frontend
FRONTEND_URL="https://votre-domaine.com"
```

### Recommandations de Production

1. **Clés fortes** : Utilisez des générateurs cryptographiques (256 bits minimum)
2. **Rotation** : Changez les clés régulièrement (tous les 3-6 mois)
3. **Stockage** : Utilisez des gestionnaires de secrets (AWS Secrets Manager, HashiCorp Vault)
4. **Monitoring** : Surveillez les logs de sécurité en temps réel
5. **Mises à jour** : Maintenez les dépendances à jour (npm audit)
6. **HTTPS** : Utilisez toujours HTTPS en production
7. **Firewall** : Configurez un firewall pour limiter l'accès
8. **Backups** : Sauvegardez régulièrement la base de données chiffrée
9. **Tests** : Effectuez des tests de pénétration réguliers
10. **Formation** : Formez l'équipe aux bonnes pratiques de sécurité

## 📚 Bonnes Pratiques

### Pour les Développeurs

1. **Validation** : Validez toutes les entrées utilisateur
2. **Chiffrement** : Chiffrez les données sensibles
3. **Logs** : Enregistrez les actions importantes
4. **Tests** : Testez les mesures de sécurité
5. **Documentation** : Documentez les procédures

### Pour les Administrateurs

1. **Monitoring** : Surveillez les logs régulièrement
2. **Backups** : Sauvegardez les données chiffrées
3. **Mises à jour** : Appliquez les patches de sécurité
4. **Formation** : Formez l'équipe aux bonnes pratiques
5. **Audit** : Effectuez des audits de sécurité

## 🎯 Checklist de Sécurité

### Configuration Initiale
- [ ] Clés de chiffrement fortes générées (256 bits minimum)
- [ ] Variables d'environnement sécurisées
- [ ] Base de données PostgreSQL configurée
- [ ] Service SMTP configuré et testé

### Sécurité Backend
- [ ] Rate limiting configuré (100 req/15min, 5 auth/15min, 3 reset/heure)
- [ ] Headers de sécurité activés (Helmet.js)
- [ ] Validation des données implémentée (express-validator)
- [ ] Sanitisation des entrées utilisateur
- [ ] Clés API configurées et testées
- [ ] Protection CSRF implémentée

### Authentification et Sessions
- [ ] Hachage Argon2 configuré
- [ ] Tokens JWT avec expiration courte
- [ ] Sessions sécurisées avec validation IP/User-Agent
- [ ] Refresh tokens implémentés
- [ ] Invalidation des sessions configurée

### Chiffrement et Protection des Données
- [ ] Chiffrement AES-256-GCM configuré
- [ ] Clés de chiffrement uniques par utilisateur
- [ ] Vecteurs d'initialisation aléatoires
- [ ] Validation timing-safe implémentée

### Monitoring et Logs
- [ ] Logs de sécurité configurés
- [ ] Monitoring en temps réel activé
- [ ] Alertes de sécurité configurées
- [ ] Métriques de performance surveillées
- [ ] Nettoyage automatique des logs

### Production
- [ ] HTTPS activé en production
- [ ] Firewall configuré
- [ ] Gestionnaire de secrets configuré
- [ ] Backups automatiques configurés
- [ ] Tests de pénétration effectués
- [ ] Formation de l'équipe réalisée
- [ ] Procédures d'incident documentées

---

**La sécurité est une responsabilité partagée. Restez vigilant !** 🛡️

