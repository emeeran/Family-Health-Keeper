import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePatientStore } from './slices/patientStore';
import { useDoctorStore } from './slices/doctorStore';
import { useUIStore } from './slices/uiStore';
import { useFormStore } from './slices/formStore';
import { useSearchStore } from './slices/searchStore';
import type { AppState } from './types';

/**
 * Unified App Store
 *
 * This store combines all slice stores into a single interface
 * while maintaining the modularity of the slice architecture.
 */

// Type for the complete store interface
interface AppStore extends AppState {
  // Patient Actions
  setPatients: (patients: AppState['patients']) => void;
  addPatient: (patient: Omit<AppState['patients'][0], 'id'>) => { success: boolean; error?: string; patient?: AppState['patients'][0] };
  addPatientWithId: (patient: AppState['patients'][0]) => void;
  updatePatient: (id: string, updates: Partial<AppState['patients'][0]>) => void;
  deletePatient: (id: string) => void;
  setSelectedPatient: (patientId: string) => void;
  setSelectedRecord: (recordId: string) => void;
  addRecord: (patientId: string, record: Omit<AppState['patients'][0]['records'][0], 'id'>) => { success: boolean; error?: string; record?: AppState['patients'][0]['records'][0] };
  addRecordWithId: (patientId: string, record: AppState['patients'][0]['records'][0]) => void;
  updateRecord: (patientId: string, recordId: string, updates: Partial<AppState['patients'][0]['records'][0]>) => void;
  deleteRecord: (patientId: string, recordId: string) => void;
  markRecordAsRead: (patientId: string, recordId: string) => void;
  addDocumentToRecord: (patientId: string, recordId: string, document: AppState['patients'][0]['records'][0]['documents'][0]) => void;
  updateDocument: (patientId: string, recordId: string, documentId: string, updates: Partial<AppState['patients'][0]['records'][0]['documents'][0]>) => void;
  deleteDocument: (patientId: string, recordId: string, documentId: string) => void;
  uploadDocument: (patientId: string, recordId: string, files: File[]) => void;
  renameDocument: (patientId: string, recordId: string, documentId: string, newName: string) => void;
  addReminder: (patientId: string, reminder: AppState['patients'][0]['reminders'][0]) => void;
  toggleReminder: (patientId: string, reminderId: string) => void;
  deleteReminder: (patientId: string, reminderId: string) => void;
  addMedication: (patientId: string, medication: Omit<AppState['patients'][0]['currentMedications'][0], 'id'>) => { success: boolean; error?: string; medication?: AppState['patients'][0]['currentMedications'][0] };
  updateMedication: (patientId: string, medication: AppState['patients'][0]['currentMedications'][0]) => void;
  deleteMedication: (patientId: string, medicationId: string) => void;
  exportPatient: (patientId: string) => void;
  exportPatientPdf: (patientId: string) => Promise<void>;

  // Doctor Actions
  setDoctors: (doctors: AppState['doctors']) => void;
  addDoctor: (doctor: Omit<AppState['doctors'][0], 'id'>) => { success: boolean; error?: string; doctor?: AppState['doctors'][0] };
  addDoctorWithId: (doctor: AppState['doctors'][0]) => void;
  updateDoctor: (id: string, updates: Partial<AppState['doctors'][0]>) => void;
  deleteDoctor: (id: string) => void;
  openDoctorModal: (doctor: AppState['doctors'][0] | null) => void;
  closeDoctorModal: () => void;
  updateDoctorData: (doctor: Partial<AppState['doctors'][0]>) => void;

  // UI Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsEditing: (editing: boolean) => void;
  initializeTheme: () => void;

  // Form Actions
  setFormStateRecord: (record: AppState['formState']) => void;
  setOriginalRecord: (record: AppState['originalRecord']) => void;
  setFormDirty: (dirty: boolean) => void;
  toggleEditMode: () => void;
  updateFormField: (field: keyof AppState['formState'], value: string) => void;
  openPatientForm: (patient: AppState['patientToEdit']) => void;
  closePatientForm: () => void;
  openRecordForm: (record: AppState['recordToEdit']) => void;
  closeRecordForm: () => void;

  // Search Actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  // Cross-cutting Actions
  setFormState: (field: string, value: string) => void;
  initializeData: () => Promise<void>;
}

/**
 * Custom hook that combines all store slices into a unified interface
 */
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // State from all slices
      ...usePatientStore.getState(),
      ...useDoctorStore.getState(),
      ...useUIStore.getState(),
      ...useFormStore.getState(),
      ...useSearchStore.getState(),

      // Actions from Patient Store
      setPatients: (patients) => {
        usePatientStore.getState().setPatients(patients);
        set({ patients });
      },

      addPatient: (patient) => {
        const result = usePatientStore.getState().addPatient(patient);
        if (result.success) {
          const { patients, selectedPatientId, selectedRecordId } = usePatientStore.getState();
          set({ patients, selectedPatientId, selectedRecordId });
        }
        return result;
      },

      addPatientWithId: (patient) => {
        usePatientStore.getState().addPatientWithId(patient);
        const { patients, selectedPatientId, selectedRecordId } = usePatientStore.getState();
        set({ patients, selectedPatientId, selectedRecordId });
      },

      updatePatient: (id, updates) => {
        usePatientStore.getState().updatePatient(id, updates);
        set({ patients: usePatientStore.getState().patients });
      },

      deletePatient: (id) => {
        usePatientStore.getState().deletePatient(id);
        const { patients, selectedPatientId, selectedRecordId } = usePatientStore.getState();
        set({ patients, selectedPatientId, selectedRecordId });
      },

      setSelectedPatient: (patientId) => {
        usePatientStore.getState().setSelectedPatient(patientId);
        const { selectedPatientId, selectedRecordId } = usePatientStore.getState();
        set({ selectedPatientId, selectedRecordId });
      },

      setSelectedRecord: (recordId) => {
        usePatientStore.getState().setSelectedRecord(recordId);
        set({ selectedRecordId });
      },

      addRecord: (patientId, record) => {
        const result = usePatientStore.getState().addRecord(patientId, record);
        if (result.success) {
          const { patients, selectedRecordId } = usePatientStore.getState();
          set({ patients, selectedRecordId });
        }
        return result;
      },

      addRecordWithId: (patientId, record) => {
        usePatientStore.getState().addRecordWithId(patientId, record);
        const { patients, selectedRecordId } = usePatientStore.getState();
        set({ patients, selectedRecordId });
      },

      updateRecord: (patientId, recordId, updates) => {
        usePatientStore.getState().updateRecord(patientId, recordId, updates);
        set({ patients: usePatientStore.getState().patients });
      },

      deleteRecord: (patientId, recordId) => {
        usePatientStore.getState().deleteRecord(patientId, recordId);
        const { patients, selectedRecordId } = usePatientStore.getState();
        set({ patients, selectedRecordId });
      },

      markRecordAsRead: (patientId, recordId) => {
        usePatientStore.getState().markRecordAsRead(patientId, recordId);
        set({ patients: usePatientStore.getState().patients });
      },

      addDocumentToRecord: (patientId, recordId, document) => {
        usePatientStore.getState().addDocumentToRecord(patientId, recordId, document);
        set({ patients: usePatientStore.getState().patients });
      },

      updateDocument: (patientId, recordId, documentId, updates) => {
        usePatientStore.getState().updateDocument(patientId, recordId, documentId, updates);
        set({ patients: usePatientStore.getState().patients });
      },

      deleteDocument: (patientId, recordId, documentId) => {
        usePatientStore.getState().deleteDocument(patientId, recordId, documentId);
        set({ patients: usePatientStore.getState().patients });
      },

      uploadDocument: (patientId, recordId, files) => {
        usePatientStore.getState().uploadDocument(patientId, recordId, files);
        set({ patients: usePatientStore.getState().patients });
      },

      renameDocument: (patientId, recordId, documentId, newName) => {
        usePatientStore.getState().renameDocument(patientId, recordId, documentId, newName);
        set({ patients: usePatientStore.getState().patients });
      },

      addReminder: (patientId, reminder) => {
        usePatientStore.getState().addReminder(patientId, reminder);
        set({ patients: usePatientStore.getState().patients });
      },

      toggleReminder: (patientId, reminderId) => {
        usePatientStore.getState().toggleReminder(patientId, reminderId);
        set({ patients: usePatientStore.getState().patients });
      },

      deleteReminder: (patientId, reminderId) => {
        usePatientStore.getState().deleteReminder(patientId, reminderId);
        set({ patients: usePatientStore.getState().patients });
      },

      addMedication: (patientId, medication) => {
        const result = usePatientStore.getState().addMedication(patientId, medication);
        if (result.success) {
          set({ patients: usePatientStore.getState().patients });
        }
        return result;
      },

      updateMedication: (patientId, medication) => {
        usePatientStore.getState().updateMedication(patientId, medication);
        set({ patients: usePatientStore.getState().patients });
      },

      deleteMedication: (patientId, medicationId) => {
        usePatientStore.getState().deleteMedication(patientId, medicationId);
        set({ patients: usePatientStore.getState().patients });
      },

      exportPatient: (patientId) => {
        usePatientStore.getState().exportPatient(patientId);
      },

      exportPatientPdf: (patientId) => {
        return usePatientStore.getState().exportPatientPdf(patientId);
      },

      // Actions from Doctor Store
      setDoctors: (doctors) => {
        useDoctorStore.getState().setDoctors(doctors);
        set({ doctors });
      },

      addDoctor: (doctor) => {
        const result = useDoctorStore.getState().addDoctor(doctor);
        if (result.success) {
          set({ doctors: useDoctorStore.getState().doctors });
        }
        return result;
      },

      addDoctorWithId: (doctor) => {
        useDoctorStore.getState().addDoctorWithId(doctor);
        set({ doctors: useDoctorStore.getState().doctors });
      },

      updateDoctor: (id, updates) => {
        useDoctorStore.getState().updateDoctor(id, updates);
        set({ doctors: useDoctorStore.getState().doctors });
      },

      deleteDoctor: (id) => {
        useDoctorStore.getState().deleteDoctor(id);
        set({ doctors: useDoctorStore.getState().doctors });
      },

      openDoctorModal: (doctor) => {
        useDoctorStore.getState().openDoctorModal(doctor);
        const { isDoctorModalOpen, doctorToEdit } = useDoctorStore.getState();
        set({ isDoctorModalOpen, doctorToEdit });
      },

      closeDoctorModal: () => {
        useDoctorStore.getState().closeDoctorModal();
        const { isDoctorModalOpen, doctorToEdit } = useDoctorStore.getState();
        set({ isDoctorModalOpen, doctorToEdit });
      },

      updateDoctorData: (doctor) => {
        useDoctorStore.getState().updateDoctorData(doctor);
        const { isDoctorModalOpen, doctorToEdit } = useDoctorStore.getState();
        set({ isDoctorModalOpen, doctorToEdit });
      },

      // Actions from UI Store
      setTheme: (theme) => {
        useUIStore.getState().setTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        useUIStore.getState().toggleTheme();
        set({ theme: useUIStore.getState().theme });
      },

      setIsEditing: (editing) => {
        useUIStore.getState().setIsEditing(editing);
        set({ isEditing: editing });
      },

      initializeTheme: () => {
        useUIStore.getState().initializeTheme();
        set({ theme: useUIStore.getState().theme });
      },

      // Actions from Form Store
      setFormStateRecord: (record) => {
        useFormStore.getState().setFormStateRecord(record);
        const { formState } = useFormStore.getState();
        set({ formState });
      },

      setOriginalRecord: (record) => {
        useFormStore.getState().setOriginalRecord(record);
        const { originalRecord } = useFormStore.getState();
        set({ originalRecord });
      },

      setFormDirty: (dirty) => {
        useFormStore.getState().setFormDirty(dirty);
        set({ isFormDirty: dirty });
      },

      toggleEditMode: () => {
        useFormStore.getState().toggleEditMode();
        const { formState, originalRecord, isFormDirty } = useFormStore.getState();
        // Set the UI editing state when form is toggled
        const isEditing = useFormStore.getState().isFormDirty;
        set({ isEditing, formState, originalRecord, isFormDirty });
      },

      updateFormField: (field, value) => {
        useFormStore.getState().updateFormField(field, value);
        const { formState, isFormDirty } = useFormStore.getState();
        set({ formState, isFormDirty });
      },

      openPatientForm: (patient) => {
        useFormStore.getState().openPatientForm(patient);
        const { isPatientFormModalOpen, patientToEdit } = useFormStore.getState();
        set({ isPatientFormModalOpen, patientToEdit });
      },

      closePatientForm: () => {
        useFormStore.getState().closePatientForm();
        const { isPatientFormModalOpen, patientToEdit } = useFormStore.getState();
        set({ isPatientFormModalOpen, patientToEdit });
      },

      openRecordForm: (record) => {
        useFormStore.getState().openRecordForm(record);
        const { isRecordFormModalOpen, recordToEdit } = useFormStore.getState();
        set({ isRecordFormModalOpen, recordToEdit });
      },

      closeRecordForm: () => {
        useFormStore.getState().closeRecordForm();
        const { isRecordFormModalOpen, recordToEdit } = useFormStore.getState();
        set({ isRecordFormModalOpen, recordToEdit });
      },

      // Actions from Search Store
      setSearchQuery: (query) => {
        useSearchStore.getState().setSearchQuery(query);
        set({ searchQuery: query });
      },

      clearSearch: () => {
        useSearchStore.getState().clearSearch();
        set({ searchQuery: '' });
      },

      // Cross-cutting Actions
      setFormState: (field, value) => {
        if (!get().formState) return;

        const updatedFormState = { ...get().formState, [field]: value };
        const isDirty = JSON.stringify(updatedFormState) !== JSON.stringify(get().originalRecord);

        set({
          formState: updatedFormState,
          isFormDirty: isDirty
        });
      },

      initializeData: async () => {
        const { PATIENTS, DOCTORS } = await import('../constants');
        const state = get();

        // Initialize patients
        if (state.patients.length === 0) {
          set({ patients: PATIENTS });
        }

        // Initialize doctors
        if (state.doctors.length === 0) {
          set({ doctors: DOCTORS });
        }

        // Initialize theme
        state.initializeTheme();
      },
    }),
    {
      name: 'family-health-keeper-app',
      partialize: (state) => ({
        patients: state.patients,
        doctors: state.doctors,
        theme: state.theme
      })
    }
  )
);

// Subscribe to individual slice stores to keep them in sync
usePatientStore.subscribe((patientState) => {
  useAppStore.setState({
    patients: patientState.patients,
    selectedPatientId: patientState.selectedPatientId,
    selectedRecordId: patientState.selectedRecordId
  });
});

useDoctorStore.subscribe((doctorState) => {
  useAppStore.setState({
    doctors: doctorState.doctors,
    doctorToEdit: doctorState.doctorToEdit,
    isDoctorModalOpen: doctorState.isDoctorModalOpen
  });
});

useUIStore.subscribe((uiState) => {
  useAppStore.setState({
    theme: uiState.theme,
    isEditing: uiState.isEditing
  });
});

useFormStore.subscribe((formState) => {
  useAppStore.setState({
    formState: formState.formState,
    originalRecord: formState.originalRecord,
    isFormDirty: formState.isFormDirty,
    isPatientFormModalOpen: formState.isPatientFormModalOpen,
    isRecordFormModalOpen: formState.isRecordFormModalOpen,
    patientToEdit: formState.patientToEdit,
    recordToEdit: formState.recordToEdit
  });
});

useSearchStore.subscribe((searchState) => {
  useAppStore.setState({
    searchQuery: searchState.searchQuery
  });
});