import React from 'react';
import PatientDetails from '../presentational/PatientDetails';
import { useHealthStore } from '../stores/useHealthStore';
import type { Patient, MedicalRecord, Doctor, Document, Reminder, Medication } from '../types';

const PatientContainer: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    selectedRecordId,
    formState,
    isEditingRecord,
    doctors,
    addDocument: addDocumentToRecord,
    deleteDocument,
    renameDocument,
    addReminder,
    toggleReminder,
    deleteReminder,
    addMedication,
    updateMedication,
    deleteMedication,
    setFormState,
    setIsEditing
  } = useHealthStore();

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormState(id, value);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedPatientId || !selectedRecordId) return;

    const MAX_FILE_SIZE_MB = 10;

    Array.from(files).forEach(file => {
      const docType = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : null);

      if (!docType) {
        // TODO: Replace with contextual validation
        alert(`Unsupported file type: "${file.name}". Only images and PDFs are allowed.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        // TODO: Replace with contextual validation
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
        };

        addDocumentToRecord(selectedPatientId, selectedRecordId, newDoc);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (!selectedPatientId || !selectedRecordId) return;
    deleteDocument(selectedPatientId, selectedRecordId, documentId);
  };

  const handleRenameDocument = (documentId: string, newName: string) => {
    if (!selectedPatientId || !selectedRecordId) return;
    renameDocument(selectedPatientId, selectedRecordId, documentId, newName);
  };

  const handleAddReminder = (patientId: string, reminderData: Omit<Reminder, 'id' | 'completed'>) => {
    addReminder(patientId, reminderData);
  };

  const handleToggleReminder = (patientId: string, reminderId: string) => {
    toggleReminder(patientId, reminderId);
  };

  const handleDeleteReminder = (patientId: string, reminderId: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    deleteReminder(patientId, reminderId);
  };

  const handleAddMedication = (patientId: string, medicationData: Omit<Medication, 'id'>) => {
    addMedication(patientId, medicationData);
  };

  const handleUpdateMedication = (patientId: string, updatedMedication: Medication) => {
    updateMedication(patientId, updatedMedication);
  };

  const handleDeleteMedication = (patientId: string, medicationId: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;
    deleteMedication(patientId, medicationId);
  };

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
      {selectedPatient ? (
        formState ? (
          <PatientDetails
            patient={selectedPatient}
            selectedRecord={formState}
            onFormChange={handleFormChange}
            onFileUpload={handleFileUpload}
            onDeleteDocument={handleDeleteDocument}
            onRenameDocument={handleRenameDocument}
            isEditing={isEditingRecord}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onDeleteReminder={handleDeleteReminder}
            onAddMedication={handleAddMedication}
            onUpdateMedication={handleUpdateMedication}
            onDeleteMedication={handleDeleteMedication}
            doctors={doctors}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl">folder_open</span>
              <p className="mt-4 text-lg font-medium">No records available</p>
              <p>This person has no medical records yet. Add a new record to get started.</p>
            </div>
          </div>
        )
      ) : (
        <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl">waving_hand</span>
            <p className="mt-4 text-lg font-medium">Welcome to Family Health Keeper</p>
            <p>Select a person from the sidebar to view their records, or add a new person to begin.</p>
          </div>
        </div>
      )}
    </main>
  );
};

export default PatientContainer;