import { create } from 'zustand';
import { secureStorage } from '../../utils/secureStorage';
import type { Patient } from '../../types';

interface PatientState {
  patients: Patient[];
  selectedPatientId: string | null;

  // Actions
  loadPatients: () => Promise<void>;
  savePatients: () => Promise<void>;
  setSelectedPatient: (patientId: string | null) => void;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  clearPatients: () => void;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  selectedPatientId: null,

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

  setSelectedPatient: (patientId: string | null) => {
    set({ selectedPatientId: patientId });
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
        selectedPatientId: get().selectedPatientId === id ? null : get().selectedPatientId
      });
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  },

  clearPatients: () => {
    set({ patients: [], selectedPatientId: null });
  }
}));