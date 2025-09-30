import { useCallback } from 'react';
import { useHealthStore } from '../stores/useHealthStore';
import type { MedicalRecord, Document } from '../types';

export const useRecordOperations = () => {
  const {
    patients,
    doctors,
    selectedPatientId,
    selectedRecordId,
    formState,
    isEditingRecord,
    isFormDirty,
    setSelectedRecord,
    addRecord,
    updateRecord,
    deleteRecord,
    openRecordForm,
    closeRecordForm,
    setIsEditing,
    setFormStateRecord,
    setOriginalRecord,
    recordToEdit
  } = useHealthStore();

  const handleNewRecord = useCallback(() => {
    if (!selectedPatientId) {
      // TODO: Replace with contextual validation
      alert("Please select a person first.");
      return;
    }
    openRecordForm(null);
  }, [selectedPatientId, openRecordForm]);

  const handleSelectRecord = useCallback((recordId: string) => {
    setSelectedRecord(recordId);
  }, [setSelectedRecord]);

  const handleEdit = useCallback(() => {
    if (formState) {
      openRecordForm(formState);
    }
  }, [formState, openRecordForm]);

  const handleSaveRecord = useCallback(() => {
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
      // TODO: Replace with contextual validation
      alert('Record saved!');
    } catch (error) {
      console.error('Failed to save record:', error);
      // TODO: Replace with contextual validation
      alert('Failed to save record. Please try again.');
    }
  }, [formState, selectedPatientId, addRecord, updateRecord, setIsEditing]);

  const handleSaveRecordForm = useCallback((recordData: Omit<MedicalRecord, 'id' | 'documents'>, files?: File[]) => {
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

  const handleDeleteRecord = useCallback(() => {
    if (!selectedPatientId || !selectedRecordId || selectedRecordId.startsWith('new-')) {
      // TODO: Replace with contextual validation
      alert("No record selected to delete.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(selectedPatientId, selectedRecordId);
    }
  }, [selectedPatientId, selectedRecordId, deleteRecord]);

  const handleEditRecordModal = useCallback((record: MedicalRecord) => {
    openRecordForm(record);
  }, [openRecordForm]);

  const handleDeleteRecordDirect = useCallback((recordId: string) => {
    if (!selectedPatientId) {
      // TODO: Replace with contextual validation
      alert("No patient selected.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      deleteRecord(selectedPatientId, recordId);
    }
  }, [selectedPatientId, deleteRecord]);

  
  return {
    handleNewRecord,
    handleSelectRecord,
    handleEdit,
    handleSaveRecord,
    handleSaveRecordForm,
    handleDeleteRecord,
    handleEditRecordModal,
    handleDeleteRecordDirect,
    closeRecordForm,
    // State for container
    isEditingRecord,
    isFormDirty
  };
};