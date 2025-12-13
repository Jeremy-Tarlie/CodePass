import { app, BrowserWindow, protocol, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { exec } from 'child_process'
import { homedir } from 'os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let deepLinkUrl: string | null = null

// Configuration de l'auto-updater
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.checkForUpdatesAndNotify()

// Événements de l'auto-updater
autoUpdater.on('checking-for-update', () => {
  console.log('🔍 Vérification des mises à jour...')
})

autoUpdater.on('update-available', (info) => {
  console.log('📦 Mise à jour disponible:', info.version)
  if (win) {
    win.webContents.send('update-available', info)
  }
})

autoUpdater.on('update-not-available', (info) => {
  console.log('✅ Application à jour:', info.version)
})

autoUpdater.on('error', (err) => {
  console.error('❌ Erreur lors de la vérification des mises à jour:', err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "📥 Téléchargement: " + progressObj.percent + "%"
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
  console.log(log_message)
  if (win) {
    win.webContents.send('download-progress', progressObj)
  }
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('✅ Mise à jour téléchargée:', info.version)
  if (win) {
    win.webContents.send('update-downloaded', info)
  }
})

// Fonctions pour gérer le démarrage automatique
function setAutoStartup(enabled: boolean) {
  const appName = app.getName()
  const appPath = process.execPath
  
  if (process.platform === 'win32' || process.platform === 'darwin') {
    // Windows & macOS: Utiliser l'API native d'Electron
    // Sur Windows, cela s'intègre avec le Gestionnaire des tâches
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: appPath,
      name: appName,
      // Windows uniquement: ouvrir en mode caché (minimisé)
      args: []
    })
    
    if (enabled) {
      console.log('✅ Démarrage automatique activé (API native)')
    } else {
      console.log('✅ Démarrage automatique désactivé (API native)')
    }
  } else if (process.platform === 'linux') {
    // Linux: Créer un fichier .desktop dans ~/.config/autostart/
    const autostartDir = homedir() + '/.config/autostart'
    const desktopFile = `${autostartDir}/${appName}.desktop`
    
    if (enabled) {
      const desktopContent = `[Desktop Entry]
Type=Application
Name=${appName}
Exec=${appPath}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
`
      exec(`mkdir -p "${autostartDir}" && echo '${desktopContent}' > "${desktopFile}"`, (error: Error | null | undefined) => {
        if (error) {
          console.error('❌ Erreur lors de l\'activation du démarrage automatique:', error)
        } else {
          console.log('✅ Démarrage automatique activé')
        }
      })
    } else {
      exec(`rm -f "${desktopFile}"`, (error: Error | null | undefined) => {
        if (error) {
          console.error('❌ Erreur lors de la désactivation du démarrage automatique:', error)
        } else {
          console.log('✅ Démarrage automatique désactivé')
        }
      })
    }
  }
}

function isAutoStartupEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      // Windows & macOS: Utiliser l'API native d'Electron
      // Cela lit le vrai statut depuis le Gestionnaire des tâches Windows
      const loginItemSettings = app.getLoginItemSettings()
      
      console.log('📋 Statut démarrage auto:', {
        openAtLogin: loginItemSettings.openAtLogin,
        // Sur Windows, vérifie si l'entrée existe ET est activée dans le Gestionnaire des tâches
        executableWillLaunchAtLogin: loginItemSettings.executableWillLaunchAtLogin
      })
      
      // executableWillLaunchAtLogin est true seulement si l'app va vraiment démarrer
      // (prend en compte le statut dans le Gestionnaire des tâches Windows)
      resolve(loginItemSettings.executableWillLaunchAtLogin ?? loginItemSettings.openAtLogin)
    } else if (process.platform === 'linux') {
      const appName = app.getName()
      const desktopFile = homedir() + `/.config/autostart/${appName}.desktop`
      
      exec(`test -f "${desktopFile}"`, (error: Error | null | undefined) => {
        resolve(!error)
      })
    } else {
      resolve(false)
    }
  })
}

// Fonction pour gérer les arguments de ligne de commande
function handleCommandLineArgs() {
  const args = process.argv.slice(2);
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--reset-password') {
      const token = args[i + 1]?.replace('--token=', '');
      const csrf = args[i + 2]?.replace('--csrf=', '');
      
      if (token && csrf) {
        console.log('🔗 Arguments de réinitialisation reçus:', { token: token.substring(0, 10) + '...', csrf: csrf.substring(0, 10) + '...' });
        
        if (win) {
          // Envoyer directement les données au renderer
          win.webContents.send('deep-link-reset-password', { token, csrf });
          
          // Naviguer vers la page de réinitialisation
          const resetUrl = VITE_DEV_SERVER_URL
            ? `${VITE_DEV_SERVER_URL}/reset-password?token=${token}&csrf=${csrf}`
            : `file://${path.join(RENDERER_DIST, 'index.html')}#/reset-password?token=${token}&csrf=${csrf}`;
          
          console.log('🔄 Redirection vers:', resetUrl);
          if (win?.webContents.getURL().includes('index.html')) {
            win.webContents.executeJavaScript(`
              window.location.hash = '/reset-password?token=${token}&csrf=${csrf}';
            `);
          } else {
            win?.loadURL(resetUrl);
          }
        } else {
          // Stocker les données pour plus tard
          deepLinkUrl = `reset-password?token=${token}&csrf=${csrf}`;
        }
        break;
      }
    }
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    
    // Si on a un deep link en attente, le traiter maintenant
    if (deepLinkUrl) {
      if (deepLinkUrl.startsWith('gestmdp://')) {
        handleDeepLink(deepLinkUrl)
      } else {
        // C'est un argument de ligne de commande
        const [, params] = deepLinkUrl.split('?')
        const urlParams = new URLSearchParams(params)
        const token = urlParams.get('token')
        const csrf = urlParams.get('csrf')
        
        if (token && csrf) {
          win?.webContents.send('deep-link-reset-password', { token, csrf })
          const resetUrl = VITE_DEV_SERVER_URL
            ? `${VITE_DEV_SERVER_URL}/reset-password?token=${token}&csrf=${csrf}`
            : `file://${path.join(RENDERER_DIST, 'index.html')}#/reset-password?token=${token}&csrf=${csrf}`
          
          if (win?.webContents.getURL().includes('index.html')) {
            win.webContents.executeJavaScript(`
              window.location.hash = '/reset-password?token=${token}&csrf=${csrf}';
            `);
          } else {
            win?.loadURL(resetUrl)
          }
        }
      }
      deepLinkUrl = null
    }
  })

  // Gestionnaires d'événements pour les mises à jour
  win.webContents.on('ipc-message', (_event, channel) => {
    if (channel === 'restart-app') {
      autoUpdater.quitAndInstall()
    } else if (channel === 'check-for-updates') {
      autoUpdater.checkForUpdatesAndNotify()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Gestionnaires IPC pour le démarrage automatique
ipcMain.handle('set-auto-startup', async (_event, enabled: boolean) => {
  setAutoStartup(enabled)
  return { success: true }
})

ipcMain.handle('get-auto-startup-status', async () => {
  const isEnabled = await isAutoStartupEnabled()
  return { enabled: isEnabled }
})

function handleDeepLink(url: string) {
  console.log('🔗 Deep link reçu:', url)
  
  try {
    // Extraire les paramètres de l'URL
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const searchParams = urlObj.searchParams
    
    console.log('📋 Analyse du deep link:', {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      pathname: pathname,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    
    if (pathname === '/reset-password') {
      const token = searchParams.get('token')
      const csrf = searchParams.get('csrf')
      
      if (token && csrf) {
        console.log('✅ Tokens extraits:', { token: token.substring(0, 10) + '...', csrf: csrf.substring(0, 10) + '...' })
        
        // S'assurer que la fenêtre est visible et au premier plan
        if (win) {
          if (win.isMinimized()) {
            win.restore()
          }
          win.focus()
          win.show()
        }
        
        // Envoyer les paramètres au renderer
        win?.webContents.send('deep-link-reset-password', { token, csrf })
        
        // Rediriger vers la page de réinitialisation
        const resetUrl = VITE_DEV_SERVER_URL 
          ? `${VITE_DEV_SERVER_URL}/reset-password?token=${token}&csrf=${csrf}`
          : `file://${path.join(RENDERER_DIST, 'index.html')}#/reset-password?token=${token}&csrf=${csrf}`
        
        console.log('🔄 Redirection vers:', resetUrl)
        
        // Si l'application est déjà chargée, naviguer vers la route
        if (win?.webContents.getURL().includes('index.html')) {
          // L'application est déjà chargée, on peut naviguer directement
          win.webContents.executeJavaScript(`
            window.location.hash = '/reset-password?token=${token}&csrf=${csrf}';
          `);
        } else {
          // Charger l'application avec la route
          win?.loadURL(resetUrl)
        }
      } else {
        console.error('❌ Tokens manquants dans le deep link')
      }
    } else {
      console.log('ℹ️  Deep link non reconnu, pathname:', pathname)
    }
  } catch (error) {
    console.error('❌ Erreur lors du traitement du deep link:', error)
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Configuration du protocole personnalisé - DOIT être fait AVANT app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'gestmdp',
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
])

app.whenReady().then(() => {
  createWindow();
  handleCommandLineArgs();
})

// Gestion des deep links sur macOS
app.on('open-url', (event, url) => {
  event.preventDefault()
  if (win) {
    handleDeepLink(url)
  } else {
    deepLinkUrl = url
  }
})

// Empêcher la création de plusieurs instances
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Chercher l'argument de deep link dans la ligne de commande
    const deepLink = commandLine.find(arg => arg.startsWith('gestmdp://'))
    if (deepLink) {
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
        handleDeepLink(deepLink)
      } else {
        deepLinkUrl = deepLink
      }
    }
  })
}
