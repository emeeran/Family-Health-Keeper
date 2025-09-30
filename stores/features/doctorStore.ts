import { create } from 'zustand';
import { secureStorage } from '../../utils/secureStorage';
import type { Doctor } from '../../types';

interface DoctorState {
  doctors: Doctor[];
  isDoctorModalOpen: boolean;
  doctorToEdit: Doctor | null;

  // Actions
  loadDoctors: () => Promise<void>;
  saveDoctors: () => Promise<void>;
  addDoctor: (doctor: Doctor) => Promise<void>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;
  openDoctorModal: (doctor: Doctor | null) => void;
  closeDoctorModal: () => void;
  clearDoctors: () => void;
}

export const useDoctorStore = create<DoctorState>((set, get) => ({
  doctors: [],
  isDoctorModalOpen: false,
  doctorToEdit: null,

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

  openDoctorModal: (doctor: Doctor | null) => {
    set({
      isDoctorModalOpen: true,
      doctorToEdit: doctor
    });
  },

  closeDoctorModal: () => {
    set({
      isDoctorModalOpen: false,
      doctorToEdit: null
    });
  },

  clearDoctors: () => {
    set({ doctors: [], isDoctorModalOpen: false, doctorToEdit: null });
  }
}));