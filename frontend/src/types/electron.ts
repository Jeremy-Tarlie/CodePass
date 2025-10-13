export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export interface DownloadProgress {
  percent: number
  transferred: number
  total: number
}

export interface ElectronAPI {
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
  restartApp: () => void
  checkForUpdates: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
