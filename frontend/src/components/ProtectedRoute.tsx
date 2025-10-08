import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] État:', { isAuthenticated, isLoading, location: location.pathname });

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    console.log('[ProtectedRoute] Chargement en cours...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Utilisateur non authentifié, redirection vers /connexion');
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est authentifié, afficher le composant protégé
  console.log('[ProtectedRoute] Utilisateur authentifié, affichage du contenu');
  return <>{children}</>;
};

export default ProtectedRoute;
