import type { Patient, MedicalRecord, Doctor } from '../types';

/**
 * Combined application state type
 */
export interface AppState {
  patients: Patient[];
  doctors: Doctor[];
  selectedPatientId: string | null;
  selectedRecordId: string | null;
  isEditing: boolean;
  theme: 'light' | 'dark';
  formState: MedicalRecord | null;
  originalRecord: MedicalRecord | null;
  isFormDirty: boolean;
  isPatientFormModalOpen: boolean;
  isRecordFormModalOpen: boolean;
  isDoctorModalOpen: boolean;
  patientToEdit: Patient | null;
  recordToEdit: MedicalRecord | null;
  doctorToEdit: Doctor | null;
  searchQuery: string;
}

/**
 * Store slice base interface
 */
export interface StoreSlice<T> {
  useStore: () => T;
  getState: () => T;
  subscribe: (callback: (state: T) => void) => () => void;
}