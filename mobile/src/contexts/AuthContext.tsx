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

  const verifyToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;
      const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.VERIFY}`, {
        method: 'GET',
        headers: getDefaultHeaders(token),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          return true;
        }
      }
      localStorage.removeItem('authToken');
      setUser(null);
      return false;
    } catch {
      localStorage.removeItem('authToken');
      setUser(null);
      return false;
    }
  }, [API_URL]);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    if (!API_URL) throw new Error("URL de l'API non configurée. Renseignez VITE_API_URL dans mobile/.env puis refaites le build (npm run build + cap sync).");
    if (!API_CONFIG.API_KEY) throw new Error("Clé API non configurée. Renseignez VITE_API_KEY dans mobile/.env puis refaites le build.");
    const loginUrl = `${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`;
    const emailTrimmed = (email ?? '').trim();
    const passwordTrimmed = (password ?? '').trim();
    try {
      console.log('🔄 Tentative de connexion vers:', loginUrl);
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'x-api-key': API_CONFIG.API_KEY,
          ...getDefaultHeaders(),
        },
        body: JSON.stringify({ email: emailTrimmed, password: passwordTrimmed, rememberMe }),
      });
      console.log('📡 Réponse reçue, status:', response.status);
      if (!response.ok) {
        if (response.status === 401) throw new Error('Mauvais email ou mot de passe');
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur serveur (${response.status})`);
        } catch (parseError) {
          throw new Error(`Erreur de connexion au serveur (${response.status}).`);
        }
      }
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('authToken', data.token);
        await verifyToken();
      } else {
        throw new Error(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
        throw new Error(`Impossible de joindre l'API à ${loginUrl}. Vérifiez : 1) mobile/.env (VITE_API_URL) puis rebuild, 2) CORS sur le serveur (https://localhost), 3) connexion réseau.`);
      }
      throw err;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.success) return;
    throw new Error(data.message || "Erreur lors de l'inscription");
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
          method: 'POST',
          headers: getDefaultHeaders(token),
        });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await verifyToken();
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

export { AuthContext };
