// Configuration de l'API
export const API_CONFIG = {
  // URL de base de l'API backend
  BASE_URL: import.meta.env.VITE_API_URL,
  
  // Clé API pour l'authentification
  // Clé API réelle du fichier .env
  API_KEY: import.meta.env.VITE_API_KEY,
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      VERIFY: '/api/auth/verify',
    },
    PASSWORDS: {
      BASE: '/api/passwords',
      BY_ID: (id: string) => `/api/passwords/${id}`,
    },
  },
};

// Fonction pour obtenir les headers par défaut
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'x-api-key': API_CONFIG.API_KEY,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
