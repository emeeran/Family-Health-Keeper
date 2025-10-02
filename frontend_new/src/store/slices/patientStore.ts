import { create } from 'zustand';
import type { Patient, MedicalRecord, Document, Reminder, Medication } from '../../types';
import type { StoreSlice } from '../types';
import { generatePatientId, generateMedicalRecordId, generateMedicationId, isDuplicatePatient, isDuplicateMedicalRecord, isDuplicateMedication, findDuplicatePatient } from '../../utils/uniqueId';

interface PatientState {
  patients: Patient[];
  selectedPatientId: string | null;
  selectedRecordId: string | null;

  // Actions
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Omit<Patient, 'id'>) => { success: boolean; error?: string; patient?: Patient };
  addPatientWithId: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  setSelectedPatient: (patientId: string) => void;
  setSelectedRecord: (recordId: string) => void;
  addRecord: (patientId: string, record: Omit<MedicalRecord, 'id'>) => { success: boolean; error?: string; record?: MedicalRecord };
  addRecordWithId: (patientId: string, record: MedicalRecord) => void;
  updateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => void;
  deleteRecord: (patientId: string, recordId: string) => void;
  markRecordAsRead: (patientId: string, recordId: string) => void;

  // Document Actions
  addDocumentToRecord: (patientId: string, recordId: string, document: Document) => void;
  updateDocument: (patientId: string, recordId: string, documentId: string, updates: Partial<Document>) => void;
  deleteDocument: (patientId: string, recordId: string, documentId: string) => void;
  uploadDocument: (patientId: string, recordId: string, files: File[]) => void;
  renameDocument: (patientId: string, recordId: string, documentId: string, newName: string) => void;

  // Reminder Actions
  addReminder: (patientId: string, reminder: Reminder) => void;
  toggleReminder: (patientId: string, reminderId: string) => void;
  deleteReminder: (patientId: string, reminderId: string) => void;

  // Medication Actions
  addMedication: (patientId: string, medication: Omit<Medication, 'id'>) => { success: boolean; error?: string; medication?: Medication };
  updateMedication: (patientId: string, medication: Medication) => void;
  deleteMedication: (patientId: string, medicationId: string) => void;

  // Utility Actions
  exportPatient: (patientId: string) => void;
  exportPatientPdf: (patientId: string) => Promise<void>;
}

const usePatientStoreBase = create<PatientState>()((set, get) => ({
  patients: [],
  selectedPatientId: null,
  selectedRecordId: null,

  // Patient Actions
  setPatients: (patients) => set({ patients }),

  addPatient: (patientData) => {
    const state = get();

    // Check for duplicates
    if (isDuplicatePatient(patientData, state.patients)) {
      const duplicate = findDuplicatePatient(patientData, state.patients);
      return {
        success: false,
        error: `A patient with the name "${patientData.name}" already exists${duplicate ? ` (ID: ${duplicate.id})` : ''}`
      };
    }

    // Generate unique ID and create patient
    const patient: Patient = {
      ...patientData,
      id: generatePatientId(),
      hospitalIds: patientData.hospitalIds || [],
      records: patientData.records || [],
      reminders: patientData.reminders || [],
      currentMedications: patientData.currentMedications || [],
      avatarUrl: patientData.avatarUrl || '',
      medicalHistory: patientData.medicalHistory || ''
    };

    set((currentState) => ({
      patients: [...currentState.patients, patient],
      selectedPatientId: patient.id,
      selectedRecordId: patient.records[0]?.id || null
    }));

    return { success: true, patient };
  },

  addPatientWithId: (patient) => set((state) => ({
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

  setSelectedPatient: (patientId) => set((state) => {
    const patient = state.patients.find(p => p.id === patientId);
    return {
      selectedPatientId: patientId,
      selectedRecordId: patient?.records[0]?.id || null
    };
  }),

  setSelectedRecord: (recordId) => set({ selectedRecordId: recordId }),

  addRecord: (patientId, recordData) => {
    const state = get();
    const patient = state.patients.find(p => p.id === patientId);

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // Check for duplicates
    if (isDuplicateMedicalRecord(recordData, patient.records)) {
      return {
        success: false,
        error: 'A medical record with the same doctor, date, and complaint already exists'
      };
    }

    // Generate unique ID and create record
    const record: MedicalRecord = {
      ...recordData,
      id: generateMedicalRecordId(),
      documents: recordData.documents || []
    };

    set((currentState) => ({
      patients: currentState.patients.map(p =>
        p.id === patientId
          ? { ...p, records: [record, ...p.records] }
          : p
      ),
      selectedRecordId: record.id
    }));

    return { success: true, record };
  },

  addRecordWithId: (patientId, record) => set((state) => ({
    patients: state.patients.map(p =>
      p.id === patientId
        ? { ...p, records: [record, ...p.records] }
        : p
    ),
    selectedRecordId: record.id
  })),

  updateRecord: (patientId, recordId, updates) => set((state) => ({
    patients: state.patients.map(p => {
      if (p.id === patientId) {
        const updatedRecords = p.records.map(r =>
          r.id === recordId ? { ...r, ...updates } : r
        );
        return { ...p, records: updatedRecords };
      }
      return p;
    })
  })),

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
      selectedRecordId: newSelectedRecordId
    };
  }),

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
  addMedication: (patientId, medicationData) => {
    const state = get();
    const patient = state.patients.find(p => p.id === patientId);

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // Check for duplicates
    if (isDuplicateMedication(medicationData, patient.currentMedications || [])) {
      return {
        success: false,
        error: 'A medication with the same name, strength, and dosage already exists'
      };
    }

    // Generate unique ID and create medication
    const medication: Medication = {
      ...medicationData,
      id: generateMedicationId()
    };

    set((currentState) => ({
      patients: currentState.patients.map(p =>
        p.id === patientId
          ? { ...p, currentMedications: [...(p.currentMedications || []), medication] }
          : p
      )
    }));

    return { success: true, medication };
  },

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
    const { generatePatientPdf } = await import('../../services/pdfService');
    const patient = get().patients.find(p => p.id === patientId);

    if (!patient) return;

    try {
      alert("Generating PDF... This may take a moment.");
      await generatePatientPdf(patient, []);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("An error occurred while generating the PDF. Please check the console for details.");
    }
  },
}));

export const usePatientStore: StoreSlice<PatientState> = {
  useStore: usePatientStoreBase,
  getState: usePatientStoreBase.getState,
  subscribe: usePatientStoreBase.subscribe,
};