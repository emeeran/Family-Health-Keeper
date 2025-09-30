import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import type { Patient, MedicalRecord, Doctor, Document, Reminder, Medication } from '../types';

interface SecureHealthState {
  // Patient and Record State
  patients: Patient[];
  doctors: Doctor[];
  selectedPatientId: string | null;
  selectedRecordId: string | null;

  // UI State (can remain in Zustand)
  isEditingRecord: boolean;
  theme: 'light' | 'dark';

  // Search State
  searchQuery: string;

  // Actions - Patients (using secure storage)
  loadPatients: () => Promise<void>;
  savePatients: () => Promise<void>;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  // Actions - Doctors (using secure storage)
  loadDoctors: () => Promise<void>;
  saveDoctors: () => Promise<void>;
  addDoctor: (doctor: Doctor) => Promise<void>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  // Actions - Records
  setSelectedPatient: (patientId: string) => void;
  setSelectedRecord: (recordId: string) => void;
  addRecord: (patientId: string, record: MedicalRecord) => Promise<void>;
  updateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => Promise<void>;
  deleteRecord: (patientId: string, recordId: string) => Promise<void>;

  // Actions - UI
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setIsEditing: (editing: boolean) => void;

  // Utility Actions
  clearAllData: () => Promise<void>;
  getAuditLog: () => any[];
}

export const useSecureHealthStore = create<SecureHealthState>((set, get) => ({
  // Initial State
  patients: [],
  doctors: [],
  selectedPatientId: null,
  selectedRecordId: null,
  isEditingRecord: false,
  theme: 'light',
  searchQuery: '',

  // Patient Actions
  loadPatients: async () => {
    try {
      const patients = await secureStorage.loadPatients();
      set({ patients });
    } catch (error) {
      console.error('Failed to load patients:', error);
      set({ patients: [] });
    }
  },

  savePatients: async () => {
    try {
      const { patients } = get();
      await secureStorage.savePatients(patients);
    } catch (error) {
      console.error('Failed to save patients:', error);
    }
  },

  addPatient: async (patient: Patient) => {
    try {
      await secureStorage.addPatient(patient);
      const patients = await secureStorage.loadPatients();
      set({ patients });
    } catch (error) {
      console.error('Failed to add patient:', error);
    }
  },

  updatePatient: async (id: string, updates: Partial<Patient>) => {
    try {
      await secureStorage.updatePatient(id, updates);
      const patients = await secureStorage.loadPatients();
      set({ patients });
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  },

  deletePatient: async (id: string) => {
    try {
      await secureStorage.deletePatient(id);
      const patients = await secureStorage.loadPatients();
      set({
        patients,
        selectedPatientId: null,
        selectedRecordId: null
      });
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  },

  // Doctor Actions
  loadDoctors: async () => {
    try {
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to load doctors:', error);
      set({ doctors: [] });
    }
  },

  saveDoctors: async () => {
    try {
      const { doctors } = get();
      await secureStorage.saveDoctors(doctors);
    } catch (error) {
      console.error('Failed to save doctors:', error);
    }
  },

  addDoctor: async (doctor: Doctor) => {
    try {
      await secureStorage.addDoctor?.(doctor);
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to add doctor:', error);
    }
  },

  updateDoctor: async (id: string, updates: Partial<Doctor>) => {
    try {
      await secureStorage.updateDoctor?.(id, updates);
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to update doctor:', error);
    }
  },

  deleteDoctor: async (id: string) => {
    try {
      await secureStorage.deleteDoctor?.(id);
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    }
  },

  // Record Actions
  setSelectedPatient: (patientId: string) => {
    set({
      selectedPatientId: patientId,
      selectedRecordId: null // Reset record selection when patient changes
    });
  },

  setSelectedRecord: (recordId: string) => {
    set({ selectedRecordId: recordId });
  },

  addRecord: async (patientId: string, record: MedicalRecord) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex] = {
          ...updatedPatients[patientIndex],
          records: [...updatedPatients[patientIndex].records, record]
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  },

  updateRecord: async (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

        if (recordIndex !== -1) {
          updatedPatients[patientIndex].records[recordIndex] = {
            ...updatedPatients[patientIndex].records[recordIndex],
            ...updates
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  },

  deleteRecord: async (patientId: string, recordId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].records = updatedPatients[patientIndex].records.filter(r => r.id !== recordId);

        await secureStorage.savePatients(updatedPatients);
        set({
          patients: updatedPatients,
          selectedRecordId: null
        });
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  },

  // UI Actions
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

  setIsEditing: (editing: boolean) => {
    set({ isEditingRecord: editing });
  },

  // Utility Actions
  clearAllData: async () => {
    try {
      await secureStorage.clearAllData();
      set({
        patients: [],
        doctors: [],
        selectedPatientId: null,
        selectedRecordId: null,
        searchQuery: ''
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  },

  getAuditLog: () => {
    return secureStorage.getAuditLog();
  }
}));