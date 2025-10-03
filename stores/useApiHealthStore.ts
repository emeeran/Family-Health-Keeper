import { create } from 'zustand';
import { apiService } from '../services/apiService';
import type { Patient, Doctor, MedicalRecord, LoginRequest, RegisterRequest, AuthResponse } from '../types';

interface ApiHealthState {
  // User and Auth State
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Patient and Record State
  patients: Patient[];
  doctors: Doctor[];
  selectedPatientId: string | null;
  selectedRecordId: string | null;

  // UI State
  isEditingRecord: boolean;
  theme: 'light' | 'dark';

  // Search State
  searchQuery: string;

  // Pagination State
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Auth Actions
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (userData: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Patient Actions
  loadPatients: (params?: { page?: number; search?: string; doctor_id?: string }) => Promise<void>;
  createPatient: (patientData: Partial<Patient>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Promise<Patient | null>;

  // Doctor Actions
  loadDoctors: (params?: { page?: number; search?: string; specialty?: string }) => Promise<void>;
  getDoctor: (id: string) => Promise<Doctor | null>;
  getSpecialties: () => Promise<Array<{ specialty: string; doctor_count: number }>>;

  // Record Actions
  setSelectedPatient: (patientId: string) => void;
  setSelectedRecord: (recordId: string | null) => void;
  loadMedicalRecords: (patientId: string) => Promise<MedicalRecord[]>;

  // UI Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setIsEditing: (editing: boolean) => void;

  // Health Check
  healthCheck: () => Promise<boolean>;
}

export const useApiHealthStore = create<ApiHealthState>((set, get) => ({
  // Initial State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  patients: [],
  doctors: [],
  selectedPatientId: null,
  selectedRecordId: null,

  isEditingRecord: false,
  theme: 'light',
  searchQuery: '',

  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  // Auth Actions
  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.login(credentials);

      if (response.success && response.user && response.token) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Load initial data after successful login
        await get().loadPatients();
        await get().loadDoctors();

        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  register: async (userData: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.register(userData);

      if (response.success && response.user && response.token) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Load initial data after successful registration
        await get().loadPatients();
        await get().loadDoctors();

        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        patients: [],
        doctors: [],
        selectedPatientId: null,
        selectedRecordId: null,
        error: null,
      });
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        set({ user: response.data, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Token might be invalid, clear it
      apiService.clearToken();
      set({ user: null, isAuthenticated: false });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  // Patient Actions
  loadPatients: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.getPatients(params);

      if (response.success) {
        set({
          patients: response.data,
          pagination: response.pagination,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to load patients');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load patients';
      set({
        isLoading: false,
        error: errorMessage,
        patients: [],
      });
    }
  },

  createPatient: async (patientData: Partial<Patient>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.createPatient(patientData);

      if (response.success) {
        // Refresh patients list
        await get().loadPatients();
        set({ isLoading: false });
      } else {
        throw new Error('Failed to create patient');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create patient';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  updatePatient: async (id: string, updates: Partial<Patient>) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.updatePatient(id, updates);

      if (response.success) {
        // Update patient in local state
        set((state) => ({
          patients: state.patients.map((patient) =>
            patient.id === id ? { ...patient, ...response.data } : patient
          ),
          isLoading: false,
        }));
      } else {
        throw new Error('Failed to update patient');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update patient';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  deletePatient: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.deletePatient(id);

      if (response.success) {
        // Remove patient from local state
        set((state) => ({
          patients: state.patients.filter((patient) => patient.id !== id),
          selectedPatientId: state.selectedPatientId === id ? null : state.selectedPatientId,
          selectedRecordId: state.selectedPatientId === id ? null : state.selectedRecordId,
          isLoading: false,
        }));
      } else {
        throw new Error('Failed to delete patient');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete patient';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  getPatient: async (id: string) => {
    try {
      const response = await apiService.getPatient(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get patient:', error);
      return null;
    }
  },

  // Doctor Actions
  loadDoctors: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.getDoctors(params);

      if (response.success) {
        set({
          doctors: response.data,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to load doctors');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load doctors';
      set({
        isLoading: false,
        error: errorMessage,
        doctors: [],
      });
    }
  },

  getDoctor: async (id: string) => {
    try {
      const response = await apiService.getDoctor(id);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get doctor:', error);
      return null;
    }
  },

  getSpecialties: async () => {
    try {
      const response = await apiService.getSpecialties();
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to get specialties:', error);
      return [];
    }
  },

  // Record Actions
  setSelectedPatient: (patientId: string) => {
    set({ selectedPatientId: patientId, selectedRecordId: null });
  },

  setSelectedRecord: (recordId: string | null) => {
    set({ selectedRecordId: recordId });
  },

  loadMedicalRecords: async (patientId: string) => {
    try {
      const response = await apiService.getMedicalRecords(patientId);
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to load medical records:', error);
      return [];
    }
  },

  // UI Actions
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    localStorage.setItem('theme', theme);
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setIsEditing: (editing: boolean) => {
    set({ isEditingRecord: editing });
  },

  // Health Check
  healthCheck: async () => {
    try {
      const response = await apiService.healthCheck();
      return response.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },
}));

// Initialize auth state on app load
const initializeAuth = async () => {
  if (apiService.isAuthenticated()) {
    try {
      await useApiHealthStore.getState().getCurrentUser();
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }
};

// Auto-initialize
initializeAuth();

export default useApiHealthStore;