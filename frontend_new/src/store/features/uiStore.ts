import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  searchQuery: string;
  isPatientFormModalOpen: boolean;
  isRecordFormModalOpen: boolean;
  patientToEdit: any; // Patient | null
  recordToEdit: any; // MedicalRecord | null

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  openPatientForm: (patient: any) => void;
  closePatientForm: () => void;
  openRecordForm: (record: any) => void;
  closeRecordForm: () => void;
  initializeTheme: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: 'light',
  searchQuery: '',
  isPatientFormModalOpen: false,
  isRecordFormModalOpen: false,
  patientToEdit: null,
  recordToEdit: null,

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    // Store theme preference in localStorage (non-sensitive data)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  openPatientForm: (patient: any) => {
    set({
      isPatientFormModalOpen: true,
      patientToEdit: patient
    });
  },

  closePatientForm: () => {
    set({
      isPatientFormModalOpen: false,
      patientToEdit: null
    });
  },

  openRecordForm: (record: any) => {
    set({
      isRecordFormModalOpen: true,
      recordToEdit: record
    });
  },

  closeRecordForm: () => {
    set({
      isRecordFormModalOpen: false,
      recordToEdit: null
    });
  },

  initializeTheme: () => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        set({ theme: savedTheme });
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        set({ theme: 'dark' });
      }
    }
  }
}));