import { create } from 'zustand';
import type { Patient, MedicalRecord, Doctor } from '../../types';
import type { StoreSlice } from '../types';

interface FormState {
  // Form State
  formState: MedicalRecord | null;
  originalRecord: MedicalRecord | null;
  isFormDirty: boolean;

  // Modal State
  isPatientFormModalOpen: boolean;
  isRecordFormModalOpen: boolean;
  patientToEdit: Patient | null;
  recordToEdit: MedicalRecord | null;

  // Actions
  setFormStateRecord: (record: MedicalRecord | null) => void;
  setOriginalRecord: (record: MedicalRecord | null) => void;
  setFormDirty: (dirty: boolean) => void;
  toggleEditMode: () => void;
  updateFormField: (field: keyof MedicalRecord, value: string) => void;
  openPatientForm: (patient: Patient | null) => void;
  closePatientForm: () => void;
  openRecordForm: (record: MedicalRecord | null) => void;
  closeRecordForm: () => void;
}

const useFormStoreBase = create<FormState>()((set, get) => ({
  formState: null,
  originalRecord: null,
  isFormDirty: false,
  isPatientFormModalOpen: false,
  isRecordFormModalOpen: false,
  patientToEdit: null,
  recordToEdit: null,

  // Form Actions
  setFormStateRecord: (record) => set({ formState: record }),

  setOriginalRecord: (record) => set({ originalRecord: record }),

  setFormDirty: (dirty) => set({ isFormDirty: dirty }),

  toggleEditMode: () => set((state) => {
    if (!state.isFormDirty && state.formState) {
      return {
        isFormDirty: true,
        originalRecord: { ...state.formState }
      };
    } else {
      return {
        isFormDirty: false
      };
    }
  }),

  updateFormField: (field, value) => set((state) => {
    if (!state.formState) return state;

    const updatedFormState = { ...state.formState, [field]: value };
    const isDirty = JSON.stringify(updatedFormState) !== JSON.stringify(state.originalRecord);

    return {
      formState: updatedFormState,
      isFormDirty: isDirty
    };
  }),

  // Modal Actions
  openPatientForm: (patient) => set({
    isPatientFormModalOpen: true,
    patientToEdit: patient
  }),

  closePatientForm: () => set({
    isPatientFormModalOpen: false,
    patientToEdit: null
  }),

  openRecordForm: (record) => set({
    isRecordFormModalOpen: true,
    recordToEdit: record
  }),

  closeRecordForm: () => set({
    isRecordFormModalOpen: false,
    recordToEdit: null
  }),
}));

export const useFormStore: StoreSlice<FormState> = {
  useStore: useFormStoreBase,
  getState: useFormStoreBase.getState,
  subscribe: useFormStoreBase.subscribe,
};