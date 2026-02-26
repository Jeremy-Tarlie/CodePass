# Rapport d'audit de sécurité – CodePass

*Dernière vérification : février 2026*

## Résumé

Audit du projet (backend + frontend) pour détecter vulnérabilités npm, fuites de secrets, injection, XSS, et bonnes pratiques. Les points critiques identifiés ont été corrigés ou documentés.

---

## 1. Dépendances (npm audit)

| Projet   | Statut avant      | Statut après        |
|----------|-------------------|----------------------|
| **Back** | 2 vulnérabilités (tar) | **0 vulnérabilité** (override `tar >= 7.5.8`) |
| **Frontend** | 11 vulnérabilités (ajv, lodash, minimatch, react-router, rollup, tar) | **0 vulnérabilité** (override `tar` + `npm audit fix`) |

**Actions réalisées :**
- **Back** : `overrides.tar = ">=7.5.8"` dans `back/package.json`, puis `npm install`.
- **Frontend** : `overrides.tar = ">=7.5.8"` dans `frontend/package.json`, puis `npm audit fix` et réinstallation.

À faire régulièrement : `npm audit` dans `back` et `frontend`.

---

## 2. Secrets et configuration

### Corrigé

- **JWT en production** : Si `JWT_SECRET` est absent et `NODE_ENV=production`, le backend lève une erreur au démarrage au lieu d’utiliser une valeur par défaut.
- **Clé API en production** : En production, plus de clé API par défaut ; si `API_KEY` est absente, les requêtes reçoivent 500 « Configuration serveur invalide ».
- **Comparaison des clés API** : Comparaison timing-safe avec vérification de la longueur des buffers pour éviter une exception (fuite d’info) lorsque la clé fournie n’a pas la même longueur que la clé attendue.
- **Logs** : Suppression du `console.log` exposant `BCRYPT_ROUNDS` dans `auth.service.ts`.
- **.gitignore** : Ajout de `.env`, `.env.*` et conservation de `*/.env` pour éviter tout commit de fichiers d’environnement.

### À respecter

- Ne jamais committer `.env` ou des clés (API_KEY, JWT_SECRET, DATABASE_URL, SMTP_*, etc.).
- En production, définir toutes les variables listées dans la doc (voir `back/docs/`, README).
- Utiliser des secrets forts (ex. `npm run generate-api-key` pour la clé API).

---

## 3. Injection et validation

- **SQL** : Utilisation de Prisma (requêtes paramétrées). Aucun `$queryRaw` / `$executeRaw` avec entrée utilisateur directe ; les usages de `$queryRaw` sont limités au monitoring (wrapper), pas à des requêtes construites à partir de l’utilisateur. **Risque SQL : maîtrisé.**
- **XSS** : Aucun `dangerouslySetInnerHTML`, `innerHTML` ou `eval()` côté frontend. Sanitisation côté back (suppression de balises, `javascript:`, handlers d’événements, limite de longueur). **Risque XSS : limité.**
- **Validation** : `express-validator`, `sanitizeInput`, `validateContentType`, `validateDataSize`, `validateUrlParams` en place. **Bon.**

---

## 4. Authentification et autorisation

- **Clé API** : Comparaison en timing-safe, vérification de longueur, pas de clé par défaut en production.
- **JWT** : Secret obligatoire en production, pas de fallback faible.
- **Mots de passe** : bcrypt (côté auth) / bcrypt via encryption.service, avec `BCRYPT_ROUNDS` configurable (défaut 12). **Correct.**

---

## 5. CORS et headers

- CORS : Origines lues depuis `CORS_ORIGIN` (liste séparée par des virgules). En production, seules ces origines sont acceptées ; en développement, toutes les origines sont autorisées (à restreindre si besoin).
- Helmet et headers de sécurité configurés. **Bon.**

---

## 6. Fichiers et chemins

- Fichiers statiques : `express.static('public')` sur un répertoire fixe, pas de chemin piloté par l’utilisateur.
- Logs : Nettoyage des anciens logs basé sur `fs.readdir` (noms de fichiers générés par l’app), pas d’entrée utilisateur dans les chemins. **Pas de path traversal identifié.**

---

## 7. Recommandations continues

1. **Audit** : Lancer `npm audit` (et `npm audit fix` si possible) après chaque mise à jour de dépendances (back + frontend).
2. **Secrets** : Vérifier qu’aucun `.env` ni clé n’est dans le dépôt (`git status`, recherche de motifs dans l’historique si besoin).
3. **Production** : S’assurer que `NODE_ENV=production` et que toutes les variables (JWT_SECRET, API_KEY, CORS_ORIGIN, etc.) sont définies et fortes.
4. **Rate limiting** : Déjà en place ; garder les seuils (ex. `RATE_LIMIT_*`) adaptés au trafic réel.
5. **Réinitialisation mot de passe** : Tokens avec expiration et limites d’usage déjà documentés ; conserver une durée courte et un nombre d’essais limité.

---

## Fichiers modifiés lors de cet audit

- `back/package.json` – override `tar`
- `back/services/auth.service.ts` – JWT_SECRET obligatoire en prod, suppression log BCRYPT_ROUNDS
- `back/middleware/apiKey.middleware.ts` – pas de clé API par défaut en prod, comparaison timing-safe avec longueur
- `frontend/package.json` – override `tar` + dépendances mises à jour via audit fix
- `.gitignore` – `.env`, `.env.*`, `!.env.example`
- `docs/RAPPORT_SECURITE.md` – ce rapport

---

*Pour toute question ou mise à jour de ce rapport, adapter la section concernée et la date en tête de document.*
