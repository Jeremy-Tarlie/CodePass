import { useState, useEffect } from 'react';
import { Download, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import type { UpdateInfo, DownloadProgress } from '../types/electron';

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Vérifier si l'API Electron est disponible
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Écouter les événements de mise à jour
      window.electronAPI.onUpdateAvailable((info) => {
        console.log('📦 Mise à jour disponible:', info);
        setUpdateAvailable(info);
        setIsVisible(true);
        setIsDismissed(false);
      });

      window.electronAPI.onDownloadProgress((progress) => {
        console.log('📥 Progression:', progress.percent.toFixed(1) + '%');
        setDownloadProgress(progress);
      });

      window.electronAPI.onUpdateDownloaded((info) => {
        console.log('✅ Mise à jour téléchargée:', info);
        setUpdateDownloaded(info);
        setDownloadProgress(null);
        setIsVisible(true);
      });

      // Vérifier les mises à jour au démarrage
      console.log('🔍 Vérification des mises à jour...');
      window.electronAPI.checkForUpdates();
    }
  }, []);

  const handleRestart = () => {
    if (window.electronAPI) {
      window.electronAPI.restartApp();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  // Ne rien afficher si pas visible ou si dismissé
  if (!isVisible || isDismissed) {
    return null;
  }

  // Mise à jour téléchargée - Prête à installer
  if (updateDownloaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-5 max-w-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Mise à jour prête !</h3>
                <p className="text-sm text-green-100 mt-1">
                  Version {updateDownloaded.version} téléchargée
                </p>
                <p className="text-xs text-green-200 mt-2">
                  Redémarrez pour installer la mise à jour
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 py-2 px-4 bg-white text-green-600 hover:bg-green-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Redémarrer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Téléchargement en cours
  if (downloadProgress && updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-2xl p-5 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Téléchargement en cours</h3>
              <p className="text-sm text-blue-100 mt-1">
                Version {updateAvailable.version}
              </p>
              
              {/* Barre de progression */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-blue-200 mb-1">
                  <span>{downloadProgress.percent.toFixed(1)}%</span>
                  <span>
                    {(downloadProgress.transferred / 1024 / 1024).toFixed(1)} / {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mise à jour disponible (pas encore téléchargée)
  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl shadow-2xl p-5 max-w-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/20 rounded-full">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Mise à jour disponible</h3>
                <p className="text-sm text-indigo-200 mt-1">
                  Version {updateAvailable.version}
                </p>
                {updateAvailable.releaseNotes && (
                  <p className="text-xs text-indigo-300 mt-2 line-clamp-2">
                    {updateAvailable.releaseNotes}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <p className="text-xs text-indigo-200 mt-3">
            La mise à jour se télécharge automatiquement...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default UpdateNotification;
