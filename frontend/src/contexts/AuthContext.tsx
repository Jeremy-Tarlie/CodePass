import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { API_CONFIG, getDefaultHeaders } from '../config/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = API_CONFIG.BASE_URL;
  const API_KEY = API_CONFIG.API_KEY;

  const verifyToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[AuthContext] Vérification du token...');
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.log('[AuthContext] Aucun token trouvé');
        return false;
      }

      console.log('[AuthContext] Token trouvé, vérification avec le serveur...');
      const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY}`, {
        method: 'GET',
        headers: getDefaultHeaders(token),
      });

      console.log('[AuthContext] Réponse du serveur:', response.status);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('[AuthContext] Token valide, utilisateur connecté:', data.user.email);
          setUser(data.user);
          return true;
        }
      }
      
      // Token invalide, le supprimer
      console.log('[AuthContext] Token invalide, suppression...');
      localStorage.removeItem('authToken');
      setUser(null);
      return false;
    } catch (error) {
      console.error('[AuthContext] Erreur lors de la vérification du token:', error);
      localStorage.removeItem('authToken');
      setUser(null);
      return false;
    }
  }, [API_URL, API_KEY]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      // Vérification de la configuration
      if (!API_URL) {
        throw new Error('URL de l\'API non configurée. Vérifiez votre fichier .env');
      }
      if (!API_KEY) {
        throw new Error('Clé API non configurée. Vérifiez votre fichier .env');
      }

      console.log('🔄 Tentative de connexion vers:', `${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
      
      const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ email, password, rememberMe }),
      });

      console.log('📡 Réponse reçue, status:', response.status);

      if (!response.ok) {
        // Essayer de lire le message d'erreur
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur serveur (${response.status})`);
        } catch (parseError) {
          throw new Error(`Erreur de connexion au serveur (${response.status}). Vérifiez que le backend est démarré.`);
        }
      }

      const data = await response.json();

      if (data.success) {
        const token = data.token;
        
        // Stocker le token
        localStorage.setItem('authToken', token);
        
        // Vérifier le token pour obtenir les données utilisateur
        await verifyToken();
      } else {
        throw new Error(data.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // Messages d'erreur plus spécifiques
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur ' + API_URL);
      }
      
      throw error;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // L'inscription est réussie, mais l'utilisateur doit se connecter
        return;
      } else {
        throw new Error(data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Appeler l'endpoint de déconnexion du backend
        await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: getDefaultHeaders(token),
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer le token local dans tous les cas
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  // Vérifier l'authentification au chargement de l'application
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] Démarrage de la vérification d\'authentification...');
      setIsLoading(true);
      const isAuth = await verifyToken();
      console.log('[AuthContext] Résultat de la vérification:', isAuth);
      setIsLoading(false);
    };

    checkAuth();
  }, [verifyToken]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    verifyToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export du contexte pour le hook useAuth
export { AuthContext };
