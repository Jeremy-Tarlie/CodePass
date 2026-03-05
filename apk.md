# Plan : création d’une version APK mobile (équivalent frontend)

Ce document décrit le plan pour créer une application Android (APK) offrant les mêmes fonctionnalités que le frontend CodePass (Electron), en s’appuyant sur la même API backend.

---

## 1. Objectif

- **App mobile Android** (APK) qui reprend les fonctionnalités du frontend desktop.
- **Même backend** : utilisation de l’API déjà déployée sur ton serveur (`VITE_API_URL`, `VITE_API_KEY`).
- **Expérience cohérente** : connexion, gestion des mots de passe, profil, réinitialisation de mot de passe.

---

## 2. Choix technique

| Élément | Choix | Raison |
|--------|--------|--------|
| **Framework** | **Capacitor** | Embarque une app web (Vite + React) dans une WebView native → réutilisation maximale du code et de la logique métier. |
| **App web** | **Vite + React + TypeScript** | Aligné sur le frontend actuel (même stack, même patterns). |
| **UI** | **React + Tailwind CSS** (ou équivalent) | Cohérence visuelle avec le frontend. |
| **Routing** | **React Router** | Même structure de routes (connexion, accueil, reset-password, etc.). |
| **Build Android** | **Projet Capacitor Android** (Gradle) | Génère l’APK (et plus tard AAB pour le Play Store). |

**Alternative évoquée** : PWA + TWA pour un seul APK “wrapper” autour du site. Ici on privilégie un projet dédié pour un contrôle total et une intégration release GitHub simple.

---

## 3. Emplacement dans le repo

- **Dossier dédié** à la racine du dépôt : `mobile/`
- À côté de `frontend/` et `back/` :
  ```
  gest_mdp/
  ├── back/           # API (inchangée)
  ├── frontend/       # Electron (inchangé)
  └── mobile/         # App Android (Capacitor + Vite + React)
  ```

---

## 4. Fonctionnalités à reprendre du frontend

Reproduction des mêmes écrans et usages que le frontend :

| Fonctionnalité | Frontend (référence) | Mobile (cible) |
|---------------|----------------------|----------------|
| **Authentification** | Connexion, inscription, déconnexion, vérification token | Idem (mêmes endpoints API) |
| **Accueil / Mots de passe** | Liste, recherche, création, édition, suppression, copier mot de passe, afficher/masquer | Idem |
| **Profil** | Paramètres profil, email, mot de passe, email de secours | Idem |
| **Réinitialisation mot de passe** | Page reset-password | Idem |
| **Sécurité** | Routes protégées, AuthContext, gestion token | Idem (sans dépendance Electron) |
| **Erreurs** | ErrorBoundary, page d’erreur, toasts (react-toastify) | Idem |

**À ne pas reprendre (spécifique desktop)** :

- `UpdateNotification` et mise à jour automatique via Electron (équivalent possible plus tard avec mise à jour in-app ou store).
- `window.ipcRenderer` et tout code lié à Electron (preload, main process).

---

## 5. Structure cible du projet `mobile/`

```
mobile/
├── android/                 # Projet Android (généré par Capacitor)
│   └── app/build/outputs/apk/
├── public/
├── src/
│   ├── components/          # Réutilisation / adaptation des composants frontend
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorPage.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── ProfileSettings.tsx
│   │   └── PasswordChangeReminderPopup.tsx (optionnel)
│   ├── config/
│   │   └── api.ts           # Même config API (VITE_API_URL, VITE_API_KEY)
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── pages/
│   │   ├── accueil/
│   │   ├── connexion/
│   │   ├── reset-password/
│   │   └── not-found/
│   ├── services/
│   │   ├── passwordService.ts
│   │   └── profileService.ts
│   ├── types/
│   ├── utils/
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.ts      # webDir: "dist", appId, etc.
├── .env.example             # VITE_API_URL, VITE_API_KEY
└── README.md                # Build local + génération APK
```

Les fichiers de logique métier (services, config API, types, contexts) peuvent être **copiés et adaptés** depuis `frontend/src/` (en retirant toute référence à Electron).

---

## 6. API et variables d’environnement

- **Mêmes variables** que le frontend :
  - `VITE_API_URL` : URL de base de l’API (ton serveur).
  - `VITE_API_KEY` : clé API (identique au backend).
- **Même configuration** que dans `frontend/src/config/api.ts` (endpoints auth, passwords, profile).
- En CI (GitHub Actions), utiliser les **secrets** existants (`VITE_API_URL`, `VITE_API_KEY`) pour générer un `.env` au build.

---

## 7. Étapes de mise en place (ordre recommandé)

1. **Créer le projet**  
   - `mobile/` : `npm create vite@latest mobile -- --template react-ts` (puis déplacer dans `mobile/` si besoin).  
   - Ou initialiser à la main : `package.json`, Vite, React, TypeScript, React Router.

2. **Installer et configurer Capacitor**  
   - `npm install @capacitor/core @capacitor/cli`  
   - `npx cap init` (nom app, id bundle, dossier web = `dist`).  
   - `npm install @capacitor/android` puis `npx cap add android`.

3. **Configurer Vite**  
   - Build en `dist/`, base si besoin pour Capacitor (souvent `./` ou `/`).  
   - Adapter `vite.config.ts` pour que les assets et le routing (HashRouter recommandé) fonctionnent dans la WebView.

4. **Reproduire la logique métier**  
   - Copier / adapter depuis `frontend/src` : `config/api.ts`, `contexts/AuthContext`, `services/`, `types/`, `hooks/useAuth.ts`.  
   - Supprimer toute référence à `ipcRenderer` ou à des APIs Electron.

5. **Reproduire les écrans**  
   - Pages : Connexion, Accueil (liste + formulaire mots de passe), Reset password, NotFound.  
   - Composants : ProtectedRoute, ErrorBoundary, ErrorPage, ProfileSettings, toasts.  
   - Router : mêmes routes que le frontend (ex. `/`, `/connexion`, `/reset-password`).

6. **UI et styles**  
   - Réutiliser Tailwind (ou le même design system) pour rester proche du frontend.  
   - Adapter le layout pour mobile (taille d’écran, touch, barre de statut).

7. **Tester en local**  
   - `npm run build` puis `npx cap sync android`.  
   - Ouvrir `android/` dans Android Studio et lancer l’app sur un émulateur ou un appareil.

8. **Générer l’APK (release)**  
   - Signer l’app (keystore) et lancer un build release Gradle (ex. `./gradlew assembleRelease` dans `mobile/android/`).  
   - L’APK se trouve dans `android/app/build/outputs/apk/release/`.

9. **Intégration GitHub**  
   - Ajouter un job (ou un workflow) qui build l’app (Vite + Capacitor + Gradle), récupère l’APK et le publie dans les **Releases** GitHub (même release que les binaires Electron ou release dédiée).

---

## 8. Build APK et publication sur GitHub Releases

- **Objectif** : à chaque release (ou au déclenchement choisi), avoir un **APK à jour** disponible dans les Releases GitHub.

- **Options** :
  - **A. Job dans le workflow existant** (ex. `build-electron.yml`)  
    - Un job `build-android` sur `ubuntu-latest`.  
    - Étapes : checkout → Node 20 → `cd mobile` → `npm ci` → création `.env` depuis les secrets → `npm run build` → `npx cap sync android` → build Gradle (APK release) → upload de l’APK en artefact et/ou vers une Release GitHub.
  - **B. Workflow dédié** (ex. `build-android.yml`)  
    - Même enchaînement, déclenché par les mêmes événements (ou par tag `v*`) et qui crée/met à jour une Release en y attachant l’APK.

- **Signing** : pour un APK release “production”, configurer la signature Android (keystore) dans le dépôt (secrets) et l’utiliser dans le job (variables d’env + config Gradle).

- **Résultat** : les utilisateurs retrouvent, dans la même page Releases (ou une release “Mobile”), le fichier `.apk` à télécharger, à jour à chaque run du workflow.

---

## 9. Résumé

| Étape | Action |
|-------|--------|
| 1 | Créer le dossier `mobile/` avec un projet Vite + React + TypeScript. |
| 2 | Ajouter Capacitor et le projet Android. |
| 3 | Reprendre config API, services, contexts, types et hooks depuis le frontend (sans Electron). |
| 4 | Reproduire les pages et composants (connexion, accueil, profil, reset-password, erreurs). |
| 5 | Adapter l’UI pour mobile et tester sur appareil/émulateur. |
| 6 | Configurer le build APK signé (Gradle). |
| 7 | Ajouter un job (ou workflow) CI pour construire l’APK et l’ajouter aux Releases GitHub. |

Ce plan permet d’avoir une app mobile alignée sur le frontend et un APK à jour publié automatiquement dans les Releases GitHub.
