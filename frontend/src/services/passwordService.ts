
import { API_CONFIG, getDefaultHeaders } from '../config/api';

export interface PasswordEntry {
  id: string;
  title: string;
  url?: string;
  username: string;
  password: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePasswordData {
  title: string;
  url?: string;
  username: string;
  password: string;
  notes: string;
}

export interface UpdatePasswordData extends CreatePasswordData {
  id: string;
}

class PasswordService {
  private getHeaders() {
    const token = localStorage.getItem('authToken') as string;
    return getDefaultHeaders(token);
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const API_URL = import.meta.env.VITE_API_URL || API_CONFIG.BASE_URL;
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Une erreur est survenue');
    }

    return data;
  }

  /**
   * Récupère tous les mots de passe de l'utilisateur
   */
  async getAllPasswords(): Promise<PasswordEntry[]> {
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BASE);
    return data.passwords || [];
  }

  /**
   * Récupère un mot de passe spécifique
   */
  async getPassword(id: string): Promise<PasswordEntry> {
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BY_ID(id));
    return data.password;
  }

  /**
   * Crée un nouveau mot de passe
   */
  async createPassword(passwordData: CreatePasswordData): Promise<PasswordEntry> {
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BASE, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    return data.password;
  }

  /**
   * Met à jour un mot de passe existant
   */
  async updatePassword(passwordData: UpdatePasswordData): Promise<PasswordEntry> {
    const { id, ...updateData } = passwordData;
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return data.password;
  }

  /**
   * Supprime un mot de passe
   */
  async deletePassword(id: string): Promise<void> {
    await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BY_ID(id), {
      method: 'DELETE',
    });
  }
}

export const passwordService = new PasswordService();
