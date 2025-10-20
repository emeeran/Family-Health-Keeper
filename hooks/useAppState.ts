/**
 * Custom hook for managing App state
 * Extracts state management logic from the main App component
 */

import { useState, useEffect, useRef } from 'react';
import type { MedicalRecord, Patient, Doctor } from '../types';
import { useSecureHealthStore } from '../stores/useSecureHealthStore';
import { usePerformanceMonitor } from './usePerformanceOptimizations';

export const useAppState = () => {
  const { measureOperation } = usePerformanceMonitor('AppState');
  
  // Store state
  const {
    selectedPatientId,
    selectedRecordId,
    isEditingRecord,
    theme,
    setSelectedPatient,
    setSelectedRecord,
    setIsEditing,
  } = useSecureHealthStore();

  // UI State for modals and forms (handled locally since they're UI concerns)
  const [formState, setFormStateData] = useState<MedicalRecord | null>(null);
  const [originalRecord, setOriginalRecord] = useState<MedicalRecord | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isPatientFormModalOpen, setIsPatientFormModalOpen] = useState(false);
  const [isRecordFormModalOpen, setIsRecordFormModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<MedicalRecord | null>(null);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  // Set up previous values ref
  const previousValuesRef = useRef({
    selectedPatientId,
    selectedRecordId,
    formStateId: null as string | null
  });

  // Update form state when selection changes
  useEffect(() => {
    return measureOperation('updateFormState', () => {
      // Prevent infinite loop by checking if values actually changed
      const prev = previousValuesRef.current;
      const valuesChanged =
        prev.selectedPatientId !== selectedPatientId ||
        prev.selectedRecordId !== selectedRecordId;

      if (!valuesChanged) {
        return;
      }

      // Don't reset formState if we're creating a new record (ID starts with "new-")
      if (selectedRecordId?.startsWith('new-')) {
        return;
      }

      // Get the current patient and record
      const { patients } = useSecureHealthStore.getState();
      const patient = patients.find(p => p.id === selectedPatientId);
      let record = null;

      if (patient && selectedRecordId) {
        // Only look for a record if selectedRecordId is set
        record = patient.records.find(r => r.id === selectedRecordId) || null;
      }

      // Always update formState when selection changes (including to null)
      setFormStateRecord(record);
      setOriginalRecord(record);
      if (record) {
        setIsEditing(false); // Default to read-only when a record is selected
      }

      // Update the ref with current values
      previousValuesRef.current = {
        selectedPatientId,
        selectedRecordId,
        formStateId: record?.id || null
      };
    });
  }, [selectedPatientId, selectedRecordId, measureOperation, setIsEditing]);

  // Apply theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Modal handlers
  const openPatientForm = (patient: Patient | null) => {
    setPatientToEdit(patient);
    setIsPatientFormModalOpen(true);
  };

  const closePatientForm = () => {
    setIsPatientFormModalOpen(false);
    setPatientToEdit(null);
  };

  const openRecordForm = (record: MedicalRecord | null) => {
    setRecordToEdit(record);
    setIsRecordFormModalOpen(true);
  };

  const closeRecordForm = () => {
    setIsRecordFormModalOpen(false);
    setRecordToEdit(null);
  };

  const openDoctorModal = (doctor: Doctor | null) => {
    setDoctorToEdit(doctor);
    setIsDoctorModalOpen(true);
  };

  const closeDoctorModal = () => {
    setIsDoctorModalOpen(false);
    setDoctorToEdit(null);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const setFormStateRecord = (record: MedicalRecord | null) => {
    setFormStateData(record);
  };

  const toggleEditMode = () => {
    if (formState) {
      setIsEditing(!isEditingRecord);
    }
  };

  const updateFormState = (field: string, value: string) => {
    if (formState) {
      setFormStateData({ ...formState, [field]: value });
      setIsFormDirty(true);
    }
  };

  return {
    // State
    formState,
    originalRecord,
    isFormDirty,
    isPatientFormModalOpen,
    isRecordFormModalOpen,
    isDoctorModalOpen,
    isMobileSidebarOpen,
    isSidebarCollapsed,
    patientToEdit,
    recordToEdit,
    doctorToEdit,
    
    // Actions
    openPatientForm,
    closePatientForm,
    openRecordForm,
    closeRecordForm,
    openDoctorModal,
    closeDoctorModal,
    toggleMobileSidebar,
    toggleSidebarCollapse,
    setFormStateRecord,
    toggleEditMode,
    updateFormState,
  };
};