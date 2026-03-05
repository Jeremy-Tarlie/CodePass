# CodePass Mobile (Android)

Application mobile CodePass — même fonctionnalités que le frontend desktop, connectée à la même API.

## Prérequis

- Node.js 20+
- npm ou yarn
- Android Studio (pour build APK / émulateur)

## Configuration

1. Copier `.env.example` vers `.env`
2. Renseigner `VITE_API_URL` (URL de votre API) et `VITE_API_KEY` (clé API du backend)

### ⚠️ Pourquoi « Failed to fetch » sur le téléphone alors que le frontend marche ?

Si tu as **copié le même `.env` que le frontend** avec par exemple `VITE_API_URL=http://localhost:3001` :

- **Sur le PC (frontend Electron)** : `localhost` = ton ordinateur → l’app appelle bien ton backend sur le même PC ✅  
- **Sur le téléphone** : `localhost` = le téléphone lui-même → l’app essaie de joindre le port 3001 sur le téléphone, où rien n’écoute → **Failed to fetch** ❌  

**Solution pour tester sur un appareil réel :**

- Soit ton backend est **déjà en ligne** : mets l’URL publique dans `VITE_API_URL` (ex. `https://ton-serveur.com`).
- Soit tu testes en **local** : dans `mobile/.env`, remplace `localhost` par **l’IP locale de ton PC** sur le réseau (téléphone et PC sur le même Wi‑Fi). Exemple :
  ```env
  VITE_API_URL=http://192.168.1.10:3001
  VITE_API_KEY=ta_cle
  ```
  Pour connaître l’IP : `ipconfig` (Windows) ou `ifconfig` / `ip a` (Linux/Mac), regarde l’adresse du Wi‑Fi (souvent 192.168.x.x).

Après toute modification du `.env`, refaire **`npm run build`** puis **`npx cap sync android`** et réinstaller l’app sur le téléphone.

### « Failed to fetch » avec une vraie URL (https://mondomaine.com) ?

L'app mobile (Capacitor) envoie l'origine **`capacitor://localhost`** dans les requêtes. Si ton backend n'autorise que le domaine du frontend web, il rejette les requêtes de l'app mobile → **CORS** → « Failed to fetch ».

**À faire sur le serveur (backend)** : dans le `.env` du backend, ajoute cette origine à `CORS_ORIGIN` (séparée par une virgule), ex. :

```env
CORS_ORIGIN="https://ton-frontend.com,capacitor://localhost"
```

Puis redémarre le backend. Voir aussi `back/.env.example`.

## Développement

```bash
npm install
npm run dev
```

Ouvrir http://localhost:5173 dans le navigateur.

## Build et APK

```bash
npm run build
npx cap add android   # une seule fois
npx cap sync android
npx cap open android
```

Dans Android Studio : **Build → Build Bundle(s) / APK(s) → Build APK(s)**.  
L’APK se trouve dans `android/app/build/outputs/apk/release/` (après configuration de la signature release).

## Scripts

- `npm run dev` — serveur de dev Vite
- `npm run build` — build production (dossier `dist/`)
- `npm run cap:sync` — build + sync vers le projet Android
- `npm run cap:open` — ouvrir le projet Android dans Android Studio

## Structure

- `src/` — code React (pages, composants, services, config API)
- `android/` — projet Capacitor Android (généré par `npx cap add android`)
- Même API que le frontend : auth, mots de passe, profil, reset password
