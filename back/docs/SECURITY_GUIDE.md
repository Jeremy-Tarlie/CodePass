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
```

**Avantages d'Argon2 :**
- **Résistant aux attaques** : ASIC, GPU, et attaques par dictionnaire
- **Configurable** : Mémoire, temps, et parallélisme ajustables
- **Standard** : Winner du Password Hashing Competition (2015)

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
// Authentification par clé API
const apiKey = crypto.randomBytes(32).toString('hex');

// Validation dans le middleware
if (req.headers['x-api-key'] !== process.env.API_KEY) {
  return res.status(401).json({ error: 'Clé API invalide' });
}
```

**Caractéristiques :**
- **Longueur** : 256 bits (32 bytes)
- **Génération** : Cryptographiquement sécurisée
- **Rotation** : Possibilité de rotation des clés
- **Validation** : Vérification sur chaque requête

## 🚫 Protection contre les Attaques

### Rate Limiting

```typescript
// Limitation par IP et par utilisateur
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
};

// Limitation spéciale pour l'authentification
const authRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion
  skipSuccessfulRequests: true
};
```

**Protection contre :**
- **Attaques par force brute** : Limitation des tentatives de connexion
- **DDoS** : Limitation globale des requêtes
- **Spam** : Limitation des demandes de réinitialisation

### Protection CSRF

```typescript
// Génération de token CSRF
const csrfToken = crypto.randomBytes(32).toString('hex');

// Validation dans les requêtes sensibles
if (req.body.csrf !== req.session.csrfToken) {
  return res.status(403).json({ error: 'Token CSRF invalide' });
}
```

**Implémentation :**
- **Tokens uniques** : Générés pour chaque session
- **Validation** : Vérification sur les requêtes POST/PUT/DELETE
- **Expiration** : Tokens expirés automatiquement

### Headers de Sécurité

```typescript
// Configuration Helmet.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Headers implémentés :**
- **CSP** : Content Security Policy
- **HSTS** : HTTP Strict Transport Security
- **X-Frame-Options** : Protection contre le clickjacking
- **X-Content-Type-Options** : Protection contre MIME sniffing

## 🔍 Validation et Sanitisation

### Validation des Données d'Entrée

```typescript
// Validation avec Joi
const passwordSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  url: Joi.string().uri().optional(),
  username: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  notes: Joi.string().max(500).optional()
});
```

**Règles de validation :**
- **Mots de passe** : Minimum 8 caractères, majuscule, minuscule, chiffre, caractère spécial
- **Emails** : Format email valide
- **URLs** : Format URL valide
- **Longueurs** : Limites de caractères appropriées

### Sanitisation des Données

```typescript
// Nettoyage des entrées utilisateur
const sanitizedInput = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: []
});
```

**Protection contre :**
- **XSS** : Injection de scripts malveillants
- **Injection SQL** : Requêtes malveillantes (via Prisma ORM)
- **Injection de commandes** : Exécution de commandes système

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
  `Nouveau mot de passe créé: ${title}`
);
```

**Événements enregistrés :**
- **Authentification** : Connexions, déconnexions, échecs
- **Gestion des mots de passe** : Création, modification, suppression
- **Réinitialisation** : Demandes, validations, échecs
- **Sécurité** : Tentatives d'intrusion, rate limiting

### Format des Logs

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "event": "PASSWORD_CREATED",
  "userId": "user123",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "success": true,
  "details": "Nouveau mot de passe créé: Gmail",
  "metadata": {
    "passwordId": "pwd456",
    "category": "Email"
  }
}
```

## 🔄 Gestion des Sessions

### Sessions Sécurisées

```typescript
// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24h
    sameSite: 'strict'
  }
}));
```

**Caractéristiques :**
- **HttpOnly** : Protection contre XSS
- **Secure** : HTTPS uniquement en production
- **SameSite** : Protection contre CSRF
- **Expiration** : Sessions expirées automatiquement

### Invalidation des Sessions

```typescript
// Invalidation lors de la déconnexion
await prisma.userSession.deleteMany({
  where: {
    userId: user.id,
    token: refreshToken
  }
});
```

## 📧 Sécurité des Emails

### Tokens de Réinitialisation

```typescript
// Génération de tokens sécurisés
const resetToken = crypto.randomBytes(32).toString('hex');
const csrfToken = crypto.randomBytes(32).toString('hex');

// Stockage avec expiration
await prisma.passwordResetToken.create({
  data: {
    token: resetToken,
    csrfToken: csrfToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  }
});
```

**Sécurité :**
- **Expiration courte** : 15 minutes maximum
- **Usage unique** : Tokens invalidés après utilisation
- **Rate limiting** : 3 tentatives par heure
- **Validation CSRF** : Double protection

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
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="30d"
PASSWORD_RESET_TOKEN_EXPIRATION=15
PASSWORD_RESET_MAX_ATTEMPTS=3
```

### Recommandations de Production

1. **Clés fortes** : Utilisez des générateurs cryptographiques
2. **Rotation** : Changez les clés régulièrement
3. **Stockage** : Utilisez des gestionnaires de secrets
4. **Monitoring** : Surveillez les logs de sécurité
5. **Mises à jour** : Maintenez les dépendances à jour

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

- [ ] Clés de chiffrement fortes générées
- [ ] Rate limiting configuré
- [ ] Headers de sécurité activés
- [ ] Validation des données implémentée
- [ ] Logs de sécurité configurés
- [ ] Sessions sécurisées
- [ ] HTTPS activé en production
- [ ] Firewall configuré
- [ ] Monitoring des logs
- [ ] Procédures d'incident documentées
- [ ] Tests de sécurité effectués
- [ ] Formation de l'équipe

---

**La sécurité est une responsabilité partagée. Restez vigilant !** 🛡️
