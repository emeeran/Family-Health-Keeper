import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, MedicalRecord, Doctor, Document, Reminder, Medication } from '../types';

interface HealthState {
  // Patient and Record State
  patients: Patient[];
  doctors: Doctor[];
  selectedPatientId: string | null;
  selectedRecordId: string | null;

  // UI State
  isEditingRecord: boolean;
  isEditingPatient: boolean;
  theme: 'light' | 'dark';

  // Form State
  formState: MedicalRecord | null;
  originalRecord: MedicalRecord | null;
  isFormDirty: boolean;

  // Modal State
  isPatientFormModalOpen: boolean;
  isRecordFormModalOpen: boolean;
  isDoctorModalOpen: boolean;
  patientToEdit: Patient | null;
  recordToEdit: MedicalRecord | null;
  doctorToEdit: Doctor | null;

  // Search State
  searchQuery: string;

  // Actions
  // Patient Actions
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, patient: Partial<Patient>) => void;
  deletePatient: (id: string) => void;

  // Record Actions
  setSelectedPatient: (patientId: string) => void;
  setSelectedRecord: (recordId: string) => void;
  addRecord: (patientId: string, record: MedicalRecord) => void;
  updateRecord: (patientId: string, recordId: string, record: Partial<MedicalRecord>) => void;
  deleteRecord: (patientId: string, recordId: string) => void;

  // Form Actions
  setFormStateRecord: (record: MedicalRecord | null) => void;
  setOriginalRecord: (record: MedicalRecord | null) => void;
  updateFormField: (field: keyof MedicalRecord, value: string) => void;
  setFormDirty: (dirty: boolean) => void;
  toggleEditMode: () => void;

  // UI Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // Modal Actions
  openPatientForm: (patient: Patient | null) => void;
  closePatientForm: () => void;
  openRecordForm: (record: MedicalRecord | null) => void;
  closeRecordForm: () => void;
  openDoctorModal: (doctor: Doctor | null) => void;
  closeDoctorModal: () => void;

  // Doctor Actions
  setDoctors: (doctors: Doctor[]) => void;
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;

  // Search Actions
  setSearchQuery: (query: string) => void;

  // Document Actions
  addDocumentToRecord: (patientId: string, recordId: string, document: Document) => void;
  updateDocument: (patientId: string, recordId: string, documentId: string, updates: Partial<Document>) => void;
  deleteDocument: (patientId: string, recordId: string, documentId: string) => void;

  // Reminder Actions
  addReminder: (patientId: string, reminder: Reminder) => void;
  toggleReminder: (patientId: string, reminderId: string) => void;
  deleteReminder: (patientId: string, reminderId: string) => void;

  // Medication Actions
  addMedication: (patientId: string, medication: Omit<Medication, 'id'>) => void;
  updateMedication: (patientId: string, medication: Medication) => void;
  deleteMedication: (patientId: string, medicationId: string) => void;

  // Utility Actions
  markRecordAsRead: (patientId: string, recordId: string) => void;
  uploadDocument: (patientId: string, recordId: string, files: File[]) => void;
  renameDocument: (patientId: string, recordId: string, documentId: string, newName: string) => void;
  setIsEditing: (editing: boolean) => void;
  updateDoctorData: (doctor: Partial<Doctor>) => void;
  exportPatient: (patientId: string) => void;
  exportPatientPdf: (patientId: string) => void;
  setFormState: (field: string, value: string) => void;
  initializeData: () => Promise<void>;
  isEditing: boolean;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      // Initial State
      patients: [],
      doctors: [],
      selectedPatientId: null,
      selectedRecordId: null,
      isEditingRecord: false,
      isEditingPatient: false,
      theme: 'light',
      formState: null,
      originalRecord: null,
      isFormDirty: false,
      isPatientFormModalOpen: false,
      isRecordFormModalOpen: false,
      isDoctorModalOpen: false,
      patientToEdit: null,
      recordToEdit: null,
      doctorToEdit: null,
      searchQuery: '',

      // Patient Actions
      setPatients: (patients) => set({ patients }),

      addPatient: (patient) => set((state) => ({
        patients: [...state.patients, patient],
        selectedPatientId: patient.id,
        selectedRecordId: patient.records[0]?.id || null
      })),

      updatePatient: (id, updates) => set((state) => ({
        patients: state.patients.map(p =>
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      deletePatient: (id) => set((state) => {
        const newPatients = state.patients.filter(p => p.id !== id);
        let newSelectedPatientId = state.selectedPatientId === id ? null : state.selectedPatientId;
        let newSelectedRecordId = state.selectedRecordId;

        if (newSelectedPatientId === null) {
          newSelectedRecordId = null;
        }

        return {
          patients: newPatients,
          selectedPatientId: newSelectedPatientId,
          selectedRecordId: newSelectedRecordId
        };
      }),

      // Record Actions
      setSelectedPatient: (patientId) => set((state) => {
        const patient = state.patients.find(p => p.id === patientId);
        return {
          selectedPatientId: patientId,
          selectedRecordId: patient?.records[0]?.id || null,
          isEditingRecord: false,
          formState: patient?.records[0] || null,
          originalRecord: patient?.records[0] || null
        };
      }),

      setSelectedRecord: (recordId) => set((state) => {
        const patient = state.patients.find(p => p.id === state.selectedPatientId);
        const record = patient?.records.find(r => r.id === recordId);

        return {
          selectedRecordId: recordId,
          isEditingRecord: false,
          formState: record || null,
          originalRecord: record || null
        };
      }),

      addRecord: (patientId, record) => set((state) => ({
        patients: state.patients.map(p =>
          p.id === patientId
            ? { ...p, records: [record, ...p.records] }
            : p
        ),
        selectedRecordId: record.id,
        formState: record,
        originalRecord: record
      })),

      updateRecord: (patientId, recordId, updates) => set((state) => {
        const updatedPatients = state.patients.map(p => {
          if (p.id === patientId) {
            const updatedRecords = p.records.map(r =>
              r.id === recordId ? { ...r, ...updates } : r
            );
            return { ...p, records: updatedRecords };
          }
          return p;
        });

        const updatedFormState = state.formState?.id === recordId
          ? { ...state.formState, ...updates }
          : state.formState;

        return {
          patients: updatedPatients,
          formState: updatedFormState,
          originalRecord: updatedFormState
        };
      }),

      deleteRecord: (patientId, recordId) => set((state) => {
        const updatedPatients = state.patients.map(p => {
          if (p.id === patientId) {
            const updatedRecords = p.records.filter(r => r.id !== recordId);
            return { ...p, records: updatedRecords };
          }
          return p;
        });

        const patient = updatedPatients.find(p => p.id === patientId);
        const newSelectedRecordId = patient?.records[0]?.id || null;

        return {
          patients: updatedPatients,
          selectedRecordId: newSelectedRecordId,
          formState: patient?.records[0] || null,
          originalRecord: patient?.records[0] || null
        };
      }),

      // Form Actions
      setFormStateRecord: (record) => set({ formState: record }),
      setOriginalRecord: (record) => set({ originalRecord: record }),

      setFormDirty: (dirty) => set({ isFormDirty: dirty }),

      toggleEditMode: () => set((state) => {
        if (!state.isEditingRecord && state.formState) {
          return {
            isEditingRecord: true,
            originalRecord: { ...state.formState }
          };
        } else {
          return {
            isEditingRecord: false,
            isFormDirty: false
          };
        }
      }),

      // UI Actions
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),

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

      openDoctorModal: (doctor) => set({
        isDoctorModalOpen: true,
        doctorToEdit: doctor
      }),

      closeDoctorModal: () => set({
        isDoctorModalOpen: false,
        doctorToEdit: null
      }),

      // Doctor Actions
      setDoctors: (doctors) => set({ doctors }),

      addDoctor: (doctor) => set((state) => ({
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

      // Search Actions
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Document Actions
      addDocumentToRecord: (patientId, recordId, document) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedRecords = p.records.map(r =>
              r.id === recordId
                ? { ...r, documents: [...r.documents, document] }
                : r
            );
            return { ...p, records: updatedRecords };
          }
          return p;
        })
      })),

      updateDocument: (patientId, recordId, documentId, updates) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedRecords = p.records.map(r => {
              if (r.id === recordId) {
                const updatedDocuments = r.documents.map(d =>
                  d.id === documentId ? { ...d, ...updates } : d
                );
                return { ...r, documents: updatedDocuments };
              }
              return r;
            });
            return { ...p, records: updatedRecords };
          }
          return p;
        })
      })),

      deleteDocument: (patientId, recordId, documentId) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedRecords = p.records.map(r => {
              if (r.id === recordId) {
                const updatedDocuments = r.documents.filter(d => d.id !== documentId);
                return { ...r, documents: updatedDocuments };
              }
              return r;
            });
            return { ...p, records: updatedRecords };
          }
          return p;
        })
      })),

      // Reminder Actions
      addReminder: (patientId, reminder) => set((state) => ({
        patients: state.patients.map(p =>
          p.id === patientId
            ? { ...p, reminders: [...(p.reminders || []), reminder] }
            : p
        )
      })),

      toggleReminder: (patientId, reminderId) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedReminders = (p.reminders || []).map(r =>
              r.id === reminderId ? { ...r, completed: !r.completed } : r
            );
            return { ...p, reminders: updatedReminders };
          }
          return p;
        })
      })),

      deleteReminder: (patientId, reminderId) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedReminders = (p.reminders || []).filter(r => r.id !== reminderId);
            return { ...p, reminders: updatedReminders };
          }
          return p;
        })
      })),

      // Medication Actions
      addMedication: (patientId, medication) => set((state) => ({
        patients: state.patients.map(p =>
          p.id === patientId
            ? { ...p, currentMedications: [...(p.currentMedications || []), medication] }
            : p
        )
      })),

      updateMedication: (patientId, medication) => set((state) => ({
        patients: state.patients.map(p =>
          p.id === patientId
            ? {
                ...p,
                currentMedications: (p.currentMedications || []).map(m =>
                  m.id === medication.id ? medication : m
                )
              }
            : p
        )
      })),

      deleteMedication: (patientId, medicationId) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedMeds = (p.currentMedications || []).filter(m => m.id !== medicationId);
            return { ...p, currentMedications: updatedMeds };
          }
          return p;
        })
      })),

      // Utility Actions
      markRecordAsRead: (patientId, recordId) => set((state) => ({
        patients: state.patients.map(p =>
          p.id === patientId
            ? {
                ...p,
                records: p.records.map(r =>
                  r.id === recordId ? { ...r, isNew: false } : r
                )
              }
            : p
        )
      })),

      uploadDocument: (patientId, recordId, files) => set((state) => {
        const newDocuments = files.map(file => {
          const docType = file.type.startsWith('image/') ? 'image' :
                         file.type === 'application/pdf' ? 'pdf' : null;

          if (!docType) return null;

          return {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            type: docType,
            url: URL.createObjectURL(file),
          };
        }).filter(Boolean);

        return {
          patients: state.patients.map(p => {
            if (p.id === patientId) {
              const updatedRecords = p.records.map(r =>
                r.id === recordId
                  ? { ...r, documents: [...r.documents, ...newDocuments] }
                  : r
              );
              return { ...p, records: updatedRecords };
            }
            return p;
          })
        };
      }),

      renameDocument: (patientId, recordId, documentId, newName) => set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId) {
            const updatedRecords = p.records.map(r => {
              if (r.id === recordId) {
                const updatedDocuments = r.documents.map(d =>
                  d.id === documentId ? { ...d, name: newName } : d
                );
                return { ...r, documents: updatedDocuments };
              }
              return r;
            });
            return { ...p, records: updatedRecords };
          }
          return p;
        })
      })),

      setIsEditing: (editing) => set({ isEditingRecord: editing }),

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

      exportPatient: (patientId) => {
        const patient = get().patients.find(p => p.id === patientId);
        if (!patient) return;

        const dataStr = JSON.stringify(patient, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${patient.name.replace(/\s+/g, '_')}_health_record.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },

      exportPatientPdf: async (patientId) => {
        const { generatePatientPdf } = await import('../services/pdfService');
        const patient = get().patients.find(p => p.id === patientId);
        const doctors = get().doctors;

        if (!patient) return;

        try {
          alert("Generating PDF... This may take a moment.");
          await generatePatientPdf(patient, doctors);
        } catch (error) {
          console.error("Failed to generate PDF:", error);
          alert("An error occurred while generating the PDF. Please check the console for details.");
        }
      },

      setFormState: (field, value) => set((state) => {
        if (!state.formState) return state;

        const updatedFormState = { ...state.formState, [field]: value };
        const isDirty = JSON.stringify(updatedFormState) !== JSON.stringify(state.originalRecord);

        return {
          formState: updatedFormState,
          isFormDirty: isDirty
        };
      }),

      initializeData: async () => {
        const { PATIENTS, DOCTORS } = await import('../constants');
        const state = get();

        if (state.patients.length === 0) {
          set({ patients: PATIENTS });
        }

        if (state.doctors.length === 0) {
          set({ doctors: DOCTORS });
        }

        // Initialize theme
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');

        set({ theme });

        // Apply theme to DOM
        const root = window.document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    }),
    {
      name: 'health-storage',
      partialize: (state) => ({
        patients: state.patients,
        doctors: state.doctors,
        theme: state.theme
      })
    }
  )
);