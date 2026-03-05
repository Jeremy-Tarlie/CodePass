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
        ...(options.headers as Record<string, string>),
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Une erreur est survenue');
    }
    return data;
  }

  async getAllPasswords(): Promise<PasswordEntry[]> {
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BASE);
    return data.passwords || [];
  }

  async getPassword(id: string): Promise<PasswordEntry> {
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BY_ID(id));
    return data.password;
  }

  async createPassword(passwordData: CreatePasswordData): Promise<PasswordEntry> {
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BASE, {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
    return data.password;
  }

  async updatePassword(passwordData: UpdatePasswordData): Promise<PasswordEntry> {
    const { id, ...updateData } = passwordData;
    const data = await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return data.password;
  }

  async deletePassword(id: string): Promise<void> {
    await this.makeRequest(API_CONFIG.ENDPOINTS.PASSWORDS.BY_ID(id), {
      method: 'DELETE',
    });
  }
}

export const passwordService = new PasswordService();
