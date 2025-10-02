import { useMemoizedCallback } from './usePerformanceOptimizations';
import type { Patient, MedicalRecord, Document } from '../types';

export const useAppHandlers = (
  selectedPatientId: string,
  selectedPatient: Patient | null,
  selectedRecordId: string | null,
  patientToEdit: Patient | null,
  recordToEdit: MedicalRecord | null,
  formState: MedicalRecord | null,
  setSelectedPatient: (id: string) => void,
  setSelectedRecord: (id: string) => void,
  updateFormState: (id: string, value: string) => void,
  openPatientForm: (patient: Patient | null) => void,
  closePatientForm: () => void,
  openRecordForm: (record: MedicalRecord | null) => void,
  closeRecordForm: () => void,
  updatePatient: (id: string, data: Partial<Patient>) => void,
  addPatient: (patient: Patient) => void,
  addRecord: (patientId: string, record: MedicalRecord) => void,
  updateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => void,
  deleteRecord: (patientId: string, recordId: string) => void,
  deletePatient: (id: string) => void,
  setIsEditing: (editing: boolean) => void,
  measureOperation: (name: string, fn: () => void) => void,
  announce: (message: string) => void
) => {
  const handleSelectPatient = useMemoizedCallback((patientId: string) => {
    setSelectedPatient(patientId);
  }, [setSelectedPatient]);

  const handleSelectRecord = useMemoizedCallback((recordId: string) => {
    setSelectedRecord(recordId);
  }, [setSelectedRecord]);

  const handleFormChange = useMemoizedCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    updateFormState(id, value);
  }, [updateFormState]);

  const handleNewPatient = useMemoizedCallback(() => {
    openPatientForm(null);
  }, [openPatientForm]);

  const handleEditPatient = useMemoizedCallback(() => {
    if (!selectedPatient) return;
    openPatientForm(selectedPatient);
  }, [selectedPatient, openPatientForm]);

  const handleUpdatePatient = useMemoizedCallback((updatedPatient: Patient) => {
    updatePatient(updatedPatient.id, updatedPatient);
  }, [updatePatient]);

  const handleSavePatient = useMemoizedCallback((patientData: Partial<Patient>) => {
    measureOperation('savePatient', () => {
      if (patientToEdit) {
        // Update existing patient
        updatePatient(patientToEdit.id, patientData);
        announce(`Patient ${patientData.name} updated successfully`);
      } else {
        // Create new patient
        const newPatient: Patient = {
          id: `p-${Date.now()}`,
          name: patientData.name || '',
          hospitalIds: patientData.hospitalIds || [],
          avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
          medicalHistory: patientData.medicalHistory || '',
          records: [],
          reminders: [],
          appointments: [],
          currentMedications: [],
          dateOfBirth: patientData.dateOfBirth,
          gender: patientData.gender,
          contactInfo: patientData.contactInfo,
          emergencyContact: patientData.emergencyContact,
          allergies: patientData.allergies,
          conditions: patientData.conditions,
          surgeries: patientData.surgeries,
          notableEvents: patientData.notableEvents,
          medicalImages: patientData.medicalImages,
          familyMedicalHistory: patientData.familyMedicalHistory,
        };
        addPatient(newPatient);
        announce(`New patient ${patientData.name} added successfully`);
      }
      closePatientForm();
    });
  }, [patientToEdit, updatePatient, addPatient, closePatientForm, measureOperation, announce]);

  const handleNewRecord = useMemoizedCallback(() => {
    if (!selectedPatientId) {
      alert("Please select a person first.");
      return;
    }
    openRecordForm(null);
  }, [selectedPatientId, openRecordForm]);

  const handleSaveRecord = useMemoizedCallback(() => {
    if (!formState || !selectedPatientId) {
      return;
    }

    try {
      if (formState.id.startsWith('new-')) {
        // New record - add it
        const newRecord: MedicalRecord = {
          ...formState,
          id: `rec-${Date.now()}`,
          isNew: false
        };
        addRecord(selectedPatientId, newRecord);
      } else {
        // Existing record - update it
        updateRecord(selectedPatientId, formState.id, formState);
      }
      setIsEditing(false);
      alert('Record saved!');
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record. Please try again.');
    }
  }, [formState, selectedPatientId, addRecord, updateRecord, setIsEditing]);

  const handleSaveRecordForm = useMemoizedCallback((recordData: Omit<MedicalRecord, 'id' | 'documents'>, files?: File[]) => {
    if (!selectedPatientId) return;

    if (recordToEdit) {
      // Update existing record
      const updatedRecord: MedicalRecord = {
        ...recordToEdit,
        ...recordData,
        documents: recordToEdit.documents, // Preserve existing documents
      };
      updateRecord(selectedPatientId, recordToEdit.id, updatedRecord);
    } else {
      // Create new record
      const newRecord: MedicalRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        documents: [],
        isNew: true,
      };
      addRecord(selectedPatientId, newRecord);
    }

    closeRecordForm();
  }, [selectedPatientId, recordToEdit, updateRecord, addRecord, closeRecordForm]);

  const handleDeleteRecord = useMemoizedCallback(() => {
    if (!selectedPatientId || !selectedRecordId || selectedRecordId.startsWith('new-')) {
      alert("No record selected to delete.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(selectedPatientId, selectedRecordId);
    }
  }, [selectedPatientId, selectedRecordId, deleteRecord]);

  const handleEditRecordModal = useMemoizedCallback((record: MedicalRecord) => {
    openRecordForm(record);
  }, [openRecordForm]);

  const handleDeleteRecordDirect = useMemoizedCallback((recordId: string) => {
    if (!selectedPatientId) {
      alert("No patient selected.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      deleteRecord(selectedPatientId, recordId);
    }
  }, [selectedPatientId, deleteRecord]);

  const handleDeletePatient = useMemoizedCallback(() => {
    if (!selectedPatientId) return;
    if (window.confirm('Are you sure you want to delete this person and all their records? This action cannot be undone.')) {
        deletePatient(selectedPatientId);
    }
  }, [selectedPatientId, deletePatient]);

  const handleFileUpload = useMemoizedCallback((files: FileList | null) => {
    if (!files || !selectedPatientId || !selectedRecordId) return;

    const MAX_FILE_SIZE_MB = 10;
    Array.from(files).forEach(file => {
        const docType = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : null);

        if (!docType) {
            alert(`Unsupported file type: "${file.name}". Only images and PDFs are allowed.`);
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            alert(`File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const newDoc: Document = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                type: docType,
                url: e.target?.result as string,
                uploadedAt: new Date().toISOString()
            };
            // TODO: Add document to record via store
        };
        reader.readAsDataURL(file);
    });
  }, [selectedPatientId, selectedRecordId]);

  return {
    handleSelectPatient,
    handleSelectRecord,
    handleFormChange,
    handleNewPatient,
    handleEditPatient,
    handleUpdatePatient,
    handleSavePatient,
    handleNewRecord,
    handleSaveRecord,
    handleSaveRecordForm,
    handleDeleteRecord,
    handleEditRecordModal,
    handleDeleteRecordDirect,
    handleDeletePatient,
    handleFileUpload
  };
};