import { ipcRenderer, contextBridge } from 'electron'
import type { UpdateInfo, DownloadProgress } from '../src/types/electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // Deep link handling
  onDeepLinkResetPassword: (callback: (data: { token: string; csrf: string }) => void) => {
    ipcRenderer.on('deep-link-reset-password', (_event, data) => callback(data))
  },
  removeDeepLinkResetPasswordListener: () => {
    ipcRenderer.removeAllListeners('deep-link-reset-password')
  }
})

// Expose a cleaner API for auto-updater
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info))
  },
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info))
  },
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  restartApp: () => {
    ipcRenderer.send('restart-app')
  },
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates')
  },
  
  // API pour le démarrage automatique
  setAutoStartup: async (enabled: boolean) => {
    return await ipcRenderer.invoke('set-auto-startup', enabled)
  },
  getAutoStartupStatus: async () => {
    return await ipcRenderer.invoke('get-auto-startup-status')
  }
})