import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, CheckCircle } from 'lucide-react'
import { UpdateInfo, DownloadProgress } from '../types/electron'

const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Écouter les événements de mise à jour
    if (window.electronAPI) {
      window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateAvailable(info)
        setShowNotification(true)
      })

      window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
        setUpdateDownloaded(info)
        setDownloadProgress(null)
        setShowNotification(true)
      })

      window.electronAPI.onDownloadProgress((progress: DownloadProgress) => {
        setDownloadProgress(progress)
      })
    }
  }, [])

  const handleCheckForUpdates = () => {
    setIsChecking(true)
    if (window.electronAPI) {
      window.electronAPI.checkForUpdates()
    }
    setTimeout(() => setIsChecking(false), 2000)
  }

  const handleRestartApp = () => {
    if (window.electronAPI) {
      window.electronAPI.restartApp()
    }
  }

  const handleDismiss = () => {
    setShowNotification(false)
    setUpdateAvailable(null)
    setUpdateDownloaded(null)
    setDownloadProgress(null)
  }

  if (!showNotification && !isChecking) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={handleCheckForUpdates}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Vérifier les mises à jour
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      {isChecking && (
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <div>
            <p className="font-medium text-gray-900">Vérification des mises à jour...</p>
            <p className="text-sm text-gray-500">Recherche de nouvelles versions</p>
          </div>
        </div>
      )}

      {updateAvailable && !updateDownloaded && (
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Mise à jour disponible</p>
            <p className="text-sm text-gray-500 mb-2">
              Version {updateAvailable.version} est disponible
            </p>
            {downloadProgress && (
              <div className="mb-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Téléchargement...</span>
                  <span>{Math.round(downloadProgress.percent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {updateDownloaded && (
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Mise à jour prête</p>
            <p className="text-sm text-gray-500 mb-3">
              Version {updateDownloaded.version} a été téléchargée et est prête à être installée
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestartApp}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                Redémarrer maintenant
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UpdateNotification
