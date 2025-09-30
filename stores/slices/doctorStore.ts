import { create } from 'zustand';
import type { Doctor } from '../../types';
import type { StoreSlice } from '../types';
import { generateDoctorId, isDuplicateDoctor, findDuplicateDoctor } from '../../utils/uniqueId';

interface DoctorState {
  doctors: Doctor[];
  doctorToEdit: Doctor | null;
  isDoctorModalOpen: boolean;

  // Actions
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => { success: boolean; error?: string; doctor?: Doctor };
  addDoctorWithId: (doctor: Doctor) => void;
  updateDoctor: (id: string, updates: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  openDoctorModal: (doctor: Doctor | null) => void;
  closeDoctorModal: () => void;
  updateDoctorData: (doctor: Partial<Doctor>) => void;
}

const useDoctorStoreBase = create<DoctorState>()((set, get) => ({
  doctors: [],
  doctorToEdit: null,
  isDoctorModalOpen: false,

  // Doctor Actions
  setDoctors: (doctors) => set({ doctors }),

  addDoctor: (doctorData) => {
    const state = get();

    // Check for duplicates
    if (isDuplicateDoctor(doctorData, state.doctors)) {
      const duplicate = findDuplicateDoctor(doctorData, state.doctors);
      return {
        success: false,
        error: `A doctor with the name "${doctorData.name}" and specialty "${doctorData.specialty}" already exists${duplicate ? ` (ID: ${duplicate.id})` : ''}`
      };
    }

    // Generate unique ID and create doctor
    const doctor: Doctor = {
      ...doctorData,
      id: generateDoctorId()
    };

    set((currentState) => ({
      doctors: [...currentState.doctors, doctor]
    }));

    return { success: true, doctor };
  },

  addDoctorWithId: (doctor) => set((state) => ({
    doctors: [...state.doctors, doctor]
  })),

  updateDoctor: (id, updates) => set((state) => ({
    doctors: state.doctors.map(d =>
      d.id === id ? { ...d, ...updates } : d
    )
  })),

  deleteDoctor: (id) => set((state) => ({
    doctors: state.doctors.filter(d => d.id !== id)
  })),

  openDoctorModal: (doctor) => set({
    isDoctorModalOpen: true,
    doctorToEdit: doctor
  }),

  closeDoctorModal: () => set({
    isDoctorModalOpen: false,
    doctorToEdit: null
  }),

  updateDoctorData: (doctor) => set((state) => {
    if ('id' in doctor) {
      return {
        isDoctorModalOpen: true,
        doctorToEdit: doctor as Doctor
      };
    } else {
      return {
        isDoctorModalOpen: true,
        doctorToEdit: null
      };
    }
  }),
}));

export const useDoctorStore: StoreSlice<DoctorState> = {
  useStore: useDoctorStoreBase,
  getState: useDoctorStoreBase.getState,
  subscribe: useDoctorStoreBase.subscribe,
};