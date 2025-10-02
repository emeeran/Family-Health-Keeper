import { create } from 'zustand';
import { usePatientStore } from './patientStore';
import type { MedicalRecord, Document, Reminder, Medication } from '../../types';

interface MedicalRecordState {
  selectedRecordId: string | null;
  isEditingRecord: boolean;
  formState: MedicalRecord | null;
  originalRecord: MedicalRecord | null;
  isFormDirty: boolean;

  // Actions
  setSelectedRecord: (recordId: string | null) => void;
  setFormStateRecord: (record: MedicalRecord | null) => void;
  setOriginalRecord: (record: MedicalRecord | null) => void;
  setIsEditing: (editing: boolean) => void;
  setFormDirty: (dirty: boolean) => void;
  updateFormField: (field: keyof MedicalRecord, value: string) => void;

  // Record operations
  addRecord: (patientId: string, record: MedicalRecord) => void;
  updateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => void;
  deleteRecord: (patientId: string, recordId: string) => void;

  // Document operations
  addDocument: (patientId: string, recordId: string, document: Document) => void;
  updateDocument: (patientId: string, recordId: string, documentId: string, updates: Partial<Document>) => void;
  deleteDocument: (patientId: string, recordId: string, documentId: string) => void;
  renameDocument: (patientId: string, recordId: string, documentId: string, newName: string) => void;

  // Reminder operations
  addReminder: (patientId: string, reminder: Reminder) => void;
  toggleReminder: (patientId: string, reminderId: string) => void;
  deleteReminder: (patientId: string, reminderId: string) => void;

  // Medication operations
  addMedication: (patientId: string, medication: Omit<Medication, 'id'>) => void;
  updateMedication: (patientId: string, medication: Medication) => void;
  deleteMedication: (patientId: string, medicationId: string) => void;
}

export const useMedicalRecordStore = create<MedicalRecordState>((set, get) => ({
  selectedRecordId: null,
  isEditingRecord: false,
  formState: null,
  originalRecord: null,
  isFormDirty: false,

  setSelectedRecord: (recordId: string | null) => {
    set({ selectedRecordId: recordId });
  },

  setFormStateRecord: (record: MedicalRecord | null) => {
    set({ formState: record });
  },

  setOriginalRecord: (record: MedicalRecord | null) => {
    set({ originalRecord: record });
  },

  setIsEditing: (editing: boolean) => {
    set({ isEditingRecord: editing });
  },

  setFormDirty: (dirty: boolean) => {
    set({ isFormDirty: dirty });
  },

  updateFormField: (field: keyof MedicalRecord, value: string) => {
    const { formState } = get();
    if (formState) {
      const updatedFormState = { ...formState, [field]: value };
      const { originalRecord } = get();
      const isDirty = JSON.stringify(updatedFormState) !== JSON.stringify(originalRecord);

      set({
        formState: updatedFormState,
        isFormDirty: isDirty
      });
    }
  },

  addRecord: (patientId: string, record: MedicalRecord) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      updatedPatients[patientIndex] = {
        ...updatedPatients[patientIndex],
        records: [...updatedPatients[patientIndex].records, record]
      };

      usePatientStore.setState({ patients: updatedPatients });
    }
  },

  updateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

      if (recordIndex !== -1) {
        updatedPatients[patientIndex].records[recordIndex] = {
          ...updatedPatients[patientIndex].records[recordIndex],
          ...updates
        };

        usePatientStore.setState({ patients: updatedPatients });
      }
    }
  },

  deleteRecord: (patientId: string, recordId: string) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      updatedPatients[patientIndex].records = updatedPatients[patientIndex].records.filter(r => r.id !== recordId);

      usePatientStore.setState({
        patients: updatedPatients,
        selectedRecordId: get().selectedRecordId === recordId ? null : get().selectedRecordId
      });
    }
  },

  addDocument: (patientId: string, recordId: string, document: Document) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

      if (recordIndex !== -1) {
        updatedPatients[patientIndex].records[recordIndex] = {
          ...updatedPatients[patientIndex].records[recordIndex],
          documents: [...updatedPatients[patientIndex].records[recordIndex].documents, document]
        };

        usePatientStore.setState({ patients: updatedPatients });
      }
    }
  },

  deleteDocument: (patientId: string, recordId: string, documentId: string) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

      if (recordIndex !== -1) {
        updatedPatients[patientIndex].records[recordIndex] = {
          ...updatedPatients[patientIndex].records[recordIndex],
          documents: updatedPatients[patientIndex].records[recordIndex].documents.filter(d => d.id !== documentId)
        };

        usePatientStore.setState({ patients: updatedPatients });
      }
    }
  },

  renameDocument: (patientId: string, recordId: string, documentId: string, newName: string) => {
    get().updateDocument(patientId, recordId, documentId, { name: newName });
  },

  addReminder: (patientId: string, reminder: Reminder) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      updatedPatients[patientIndex] = {
        ...updatedPatients[patientIndex],
        reminders: [...updatedPatients[patientIndex].reminders, reminder]
      };

      usePatientStore.setState({ patients: updatedPatients });
    }
  },

  toggleReminder: (patientId: string, reminderId: string) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      const reminderIndex = updatedPatients[patientIndex].reminders.findIndex(r => r.id === reminderId);

      if (reminderIndex !== -1) {
        updatedPatients[patientIndex].reminders[reminderIndex] = {
          ...updatedPatients[patientIndex].reminders[reminderIndex],
          completed: !updatedPatients[patientIndex].reminders[reminderIndex].completed
        };

        usePatientStore.setState({ patients: updatedPatients });
      }
    }
  },

  deleteReminder: (patientId: string, reminderId: string) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      updatedPatients[patientIndex].reminders = updatedPatients[patientIndex].reminders.filter(r => r.id !== reminderId);

      usePatientStore.setState({ patients: updatedPatients });
    }
  },

  addMedication: (patientId: string, medicationData: Omit<Medication, 'id'>) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const medication: Medication = {
        ...medicationData,
        id: `med-${Date.now()}`
      };

      const updatedPatients = [...patients];
      updatedPatients[patientIndex] = {
        ...updatedPatients[patientIndex],
        currentMedications: [...updatedPatients[patientIndex].currentMedications, medication]
      };

      usePatientStore.setState({ patients: updatedPatients });
    }
  },

  updateMedication: (patientId: string, medication: Medication) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      const medicationIndex = updatedPatients[patientIndex].currentMedications.findIndex(m => m.id === medication.id);

      if (medicationIndex !== -1) {
        updatedPatients[patientIndex].currentMedications[medicationIndex] = medication;
        usePatientStore.setState({ patients: updatedPatients });
      }
    }
  },

  deleteMedication: (patientId: string, medicationId: string) => {
    const { patients } = usePatientStore.getState();
    const patientIndex = patients.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const updatedPatients = [...patients];
      updatedPatients[patientIndex].currentMedications = updatedPatients[patientIndex].currentMedications.filter(m => m.id !== medicationId);

      usePatientStore.setState({ patients: updatedPatients });
    }
  }
}));