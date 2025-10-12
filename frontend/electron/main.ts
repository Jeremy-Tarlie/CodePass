import { app, BrowserWindow, protocol } from 'electron'
// import { createRequire } from 'node:module'
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

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
    
    // Si on a un deep link en attente, le traiter maintenant
    if (deepLinkUrl) {
      handleDeepLink(deepLinkUrl)
      deepLinkUrl = null
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function handleDeepLink(url: string) {
  console.log('Deep link reçu:', url)
  
  // Extraire les paramètres de l'URL
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const searchParams = urlObj.searchParams
  
  if (pathname === '/reset-password') {
    const token = searchParams.get('token')
    const csrf = searchParams.get('csrf')
    
    if (token && csrf) {
      // Envoyer les paramètres au renderer
      win?.webContents.send('deep-link-reset-password', { token, csrf })
      
      // Rediriger vers la page de réinitialisation
      const resetUrl = VITE_DEV_SERVER_URL 
        ? `${VITE_DEV_SERVER_URL}/reset-password?token=${token}&csrf=${csrf}`
        : `file://${path.join(RENDERER_DIST, 'index.html')}#/reset-password?token=${token}&csrf=${csrf}`
      
      win?.loadURL(resetUrl)
    }
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
    scheme: 'codePass',
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

app.whenReady().then(createWindow)

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
