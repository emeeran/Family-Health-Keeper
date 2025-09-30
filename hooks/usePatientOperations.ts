import { useCallback } from 'react';
import { useHealthStore } from '../stores/useHealthStore';
import { generatePatientPdf } from '../services/pdfService';
import type { Patient } from '../types';

export const usePatientOperations = () => {
  const {
    setSelectedPatient,
    addPatient,
    updatePatient,
    deletePatient,
    openPatientForm,
    closePatientForm,
    exportPatient,
    exportPatientPdf,
    patients,
    patientToEdit
  } = useHealthStore();

  const handleNewPatient = useCallback(() => {
    openPatientForm(null);
  }, [openPatientForm]);

  const handleSelectPatient = useCallback((patientId: string) => {
    setSelectedPatient(patientId);
  }, [setSelectedPatient]);

  const handleEditPatient = useCallback(() => {
    const selectedPatient = patients.find(p => p.id === useHealthStore.getState().selectedPatientId);
    if (selectedPatient) {
      openPatientForm(selectedPatient);
    }
  }, [patients, openPatientForm]);

  const handleDeletePatient = useCallback(() => {
    const selectedPatientId = useHealthStore.getState().selectedPatientId;
    if (!selectedPatientId) return;

    if (window.confirm('Are you sure you want to delete this person and all their records? This action cannot be undone.')) {
      deletePatient(selectedPatientId);
    }
  }, [deletePatient]);

  const handleSavePatient = useCallback((patientData: Partial<Patient>) => {
    if (patientToEdit) {
      // Update existing patient
      updatePatient(patientToEdit.id, patientData);
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
    }
    closePatientForm();
  }, [patientToEdit, updatePatient, addPatient, closePatientForm]);

  const handleExportPatient = useCallback((patientId: string) => {
    exportPatient(patientId);
  }, [exportPatient]);

  const handleExportPatientPdf = useCallback(async (patientId: string) => {
    exportPatientPdf(patientId);
  }, [exportPatientPdf]);

  
  return {
    handleNewPatient,
    handleSelectPatient,
    handleEditPatient,
    handleDeletePatient,
    handleSavePatient,
    handleExportPatient,
    handleExportPatientPdf,
    closePatientForm
  };
};