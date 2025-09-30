import React from 'react';
import Sidebar from '../presentational/Sidebar';
import { useHealthStore } from '../stores/useHealthStore';
import { usePatientOperations } from '../hooks/usePatientOperations';
import { useRecordOperations } from '../hooks/useRecordOperations';
import { useDoctorOperations } from '../hooks/useDoctorOperations';
import type { Patient, MedicalRecord, Doctor } from '../types';

const SidebarContainer: React.FC = () => {
  const {
    patients,
    doctors,
    selectedPatientId,
    selectedRecordId,
    searchQuery,
    setSearchQuery
  } = useHealthStore();

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  // Custom hooks for operations
  const patientOperations = usePatientOperations();
  const recordOperations = useRecordOperations();
  const doctorOperations = useDoctorOperations();

  return (
    <Sidebar
      patients={patients}
      selectedPatient={selectedPatient}
      selectedPatientId={selectedPatientId}
      selectedRecordId={selectedRecordId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      // Patient operations
      onNewPatient={patientOperations.handleNewPatient}
      onSelectPatient={patientOperations.handleSelectPatient}
      onEditPatient={patientOperations.handleEditPatient}
      onDeletePatient={patientOperations.handleDeletePatient}
      onExportPatient={patientOperations.handleExportPatient}
      onExportPatientPdf={patientOperations.handleExportPatientPdf}
      // Record operations
      onNewRecord={recordOperations.handleNewRecord}
      onSelectRecord={recordOperations.handleSelectRecord}
      onEditRecord={recordOperations.handleEdit}
      onSaveRecord={recordOperations.handleSaveRecord}
      onDeleteRecord={recordOperations.handleDeleteRecord}
      onEditRecordModal={recordOperations.handleEditRecordModal}
      onDeleteRecordDirect={recordOperations.handleDeleteRecordDirect}
      // Doctor operations
      doctors={doctors}
      onOpenDoctorModal={doctorOperations.handleOpenDoctorModal}
      onDeleteDoctor={doctorOperations.handleDeleteDoctor}
      // UI state
      isEditing={recordOperations.isEditingRecord}
      isFormDirty={recordOperations.isFormDirty}
      isRecordSelected={!!selectedRecordId && !selectedRecordId.startsWith('new-')}
    />
  );
};

export default SidebarContainer;