import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Power, PowerOff, Settings } from 'lucide-react';

interface AutoStartupSettingsProps {
  onClose: () => void;
}

const AutoStartupSettings = ({ onClose }: AutoStartupSettingsProps) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Vérifier le statut du démarrage automatique au chargement
  useEffect(() => {
    const checkStatus = async () => {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getAutoStartupStatus();
          setIsEnabled(result.enabled);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    };

    checkStatus();
  }, []);

  const toggleAutoStartup = async () => {
    if (!window.electronAPI) {
      toast.error('Fonctionnalité non disponible dans cette version');
      return;
    }

    setIsLoading(true);
    try {
      const newStatus = !isEnabled;
      await window.electronAPI.setAutoStartup(newStatus);
      setIsEnabled(newStatus);
      
      if (newStatus) {
        toast.success('Démarrage automatique activé ! L\'application s\'ouvrira au démarrage de votre ordinateur.');
      } else {
        toast.success('Démarrage automatique désactivé !');
      }
    } catch (error) {
      console.error('Erreur lors de la modification du démarrage automatique:', error);
      toast.error('Erreur lors de la modification des paramètres');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center">
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-gray-900 opacity-50 cursor-pointer"
        onClick={onClose}
      />
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Settings className="text-indigo-600" size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Démarrage automatique
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <Power className="text-green-600" size={20} />
              ) : (
                <PowerOff className="text-gray-400" size={20} />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {isEnabled ? 'Activé' : 'Désactivé'}
                </p>
                <p className="text-sm text-gray-600">
                  {isEnabled 
                    ? 'L\'application s\'ouvrira automatiquement au démarrage'
                    : 'L\'application ne s\'ouvrira pas automatiquement'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Comment ça fonctionne ?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Windows :</strong> Ajoute une entrée dans le registre Windows</li>
              <li>• <strong>macOS :</strong> Configure les éléments de connexion</li>
              <li>• <strong>Linux :</strong> Crée un fichier .desktop dans ~/.config/autostart/</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              disabled={isLoading}
            >
              Fermer
            </button>
            <button
              onClick={toggleAutoStartup}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium text-white focus:outline-none flex items-center justify-center gap-2 ${
                isEnabled
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  En cours...
                </>
              ) : isEnabled ? (
                <>
                  <PowerOff size={16} />
                  Désactiver
                </>
              ) : (
                <>
                  <Power size={16} />
                  Activer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoStartupSettings;
