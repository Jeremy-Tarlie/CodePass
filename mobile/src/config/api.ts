export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  API_KEY: import.meta.env.VITE_API_KEY,
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
    PROFILE: {
      BASE: '/api/profile',
      EMAIL: '/api/profile/email',
      PASSWORD: '/api/profile/password',
      BACKUP_EMAIL: '/api/profile/backup-email',
    },
  },
};

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
