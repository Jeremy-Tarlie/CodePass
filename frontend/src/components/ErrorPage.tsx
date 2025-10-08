import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorPage: React.FC = () => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* Icône d'erreur */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div className="w-24 h-1 bg-red-600 mx-auto rounded-full"></div>
        </div>

        {/* Message d'erreur */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Oups ! Une erreur s'est produite
        </h1>
        <p className="text-gray-600 mb-6">
          Nous nous excusons pour ce désagrément. Une erreur inattendue s'est produite dans l'application.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-4">
          <button
            onClick={handleReload}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Recharger la page
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-white text-red-600 py-3 px-6 rounded-lg border-2 border-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Si le problème persiste,</p>
          <p>veuillez contacter le support technique.</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

