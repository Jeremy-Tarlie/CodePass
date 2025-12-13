import { API_CONFIG, getDefaultHeaders } from '../config/api';

export interface UserProfile {
  id: string;
  email: string;
  backupEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEmailData {
  newEmail: string;
  currentPassword: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateBackupEmailData {
  backupEmail: string | null;
  currentPassword: string;
}

const API_URL = API_CONFIG.BASE_URL;

/**
 * Récupère le profil de l'utilisateur connecté
 */
export async function getProfile(): Promise<UserProfile> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.PROFILE.BASE}`, {
    method: 'GET',
    headers: getDefaultHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la récupération du profil');
  }

  const data = await response.json();
  return data.user;
}

/**
 * Met à jour l'email de l'utilisateur
 */
export async function updateEmail(data: UpdateEmailData): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.PROFILE.EMAIL}`, {
    method: 'PUT',
    headers: getDefaultHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Erreur lors de la mise à jour de l\'email');
  }

  return result;
}

/**
 * Met à jour le mot de passe de l'utilisateur
 */
export async function updatePassword(data: UpdatePasswordData): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.PROFILE.PASSWORD}`, {
    method: 'PUT',
    headers: getDefaultHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Erreur lors de la mise à jour du mot de passe');
  }

  return result;
}

/**
 * Met à jour l'email de secours de l'utilisateur
 */
export async function updateBackupEmail(data: UpdateBackupEmailData): Promise<{ success: boolean; message: string }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('Non authentifié');
  }

  const response = await fetch(`${API_URL}${API_CONFIG.ENDPOINTS.PROFILE.BACKUP_EMAIL}`, {
    method: 'PUT',
    headers: getDefaultHeaders(token),
    body: JSON.stringify(data),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.message || 'Erreur lors de la mise à jour de l\'email de secours');
  }

  return result;
}

export const profileService = {
  getProfile,
  updateEmail,
  updatePassword,
  updateBackupEmail,
};



