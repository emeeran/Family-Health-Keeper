import type { Patient, Doctor, MedicalRecord, LoginRequest, RegisterRequest, AuthResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.token) {
      this.token = response.token;
      localStorage.setItem('auth_token', response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/auth/profile');
  }

  // Patient methods
  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    doctor_id?: string;
  }): Promise<{ success: boolean; data: Patient[]; pagination: any }> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.doctor_id) searchParams.append('doctor_id', params.doctor_id);

    const query = searchParams.toString();
    const endpoint = `/patients${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async getPatient(id: string): Promise<{ success: boolean; data: Patient }> {
    return this.request(`/patients/${id}`);
  }

  async createPatient(patientData: Partial<Patient>): Promise<{ success: boolean; data: Patient }> {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<{ success: boolean; data: Patient }> {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePatient(id: string): Promise<{ success: boolean }> {
    return this.request(`/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Doctor methods
  async getDoctors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
  }): Promise<{ success: boolean; data: Doctor[]; pagination: any }> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.specialty) searchParams.append('specialty', params.specialty);

    const query = searchParams.toString();
    const endpoint = `/doctors${query ? `?${query}` : ''}`;

    return this.request(endpoint);
  }

  async getDoctor(id: string): Promise<{ success: boolean; data: Doctor }> {
    return this.request(`/doctors/${id}`);
  }

  async getSpecialties(): Promise<{ success: boolean; data: Array<{ specialty: string; doctor_count: number }> }> {
    return this.request('/doctors/specialties/list');
  }

  // Medical Record methods (placeholder)
  async getMedicalRecords(patientId: string): Promise<{ success: boolean; data: MedicalRecord[] }> {
    // For now, return empty response until backend is fully implemented
    return { success: true, data: [] };
  }

  async createMedicalRecord(patientId: string, recordData: Partial<MedicalRecord>): Promise<{ success: boolean; data: MedicalRecord }> {
    // Placeholder implementation
    throw new Error('Medical records endpoint not yet implemented');
  }

  async updateMedicalRecord(patientId: string, recordId: string, updates: Partial<MedicalRecord>): Promise<{ success: boolean; data: MedicalRecord }> {
    // Placeholder implementation
    throw new Error('Medical records endpoint not yet implemented');
  }

  async deleteMedicalRecord(patientId: string, recordId: string): Promise<{ success: boolean }> {
    // Placeholder implementation
    throw new Error('Medical records endpoint not yet implemented');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; database: string; timestamp: string }> {
    return this.request('/health', {
      headers: { Authorization: '' } // No auth for health check
    });
  }

  // Token management
  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService();
export default apiService;