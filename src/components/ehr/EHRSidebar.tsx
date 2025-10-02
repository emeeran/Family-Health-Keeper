import React, { memo, useState, useCallback } from 'react';
import { useOptimizedApp } from '../../contexts/OptimizedAppContext';
import { useOptimizedPatientData } from '../../hooks/useOptimizedPatientData';
import { useToast } from '../../hooks/useToast';
import { Patient } from '../../types';
import PatientEditModal from '../modals/PatientEditModal';
import DoctorEditModal from '../DoctorEditModal';
import RecordFormModal from '../modals/RecordFormModal';
import { databaseService } from '../../services/databaseService';
import './EHRSidebar.css';

interface PatientItemProps {
  patient: Patient;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onAddRecord: (patient: Patient) => void;
}

const PatientItem = memo(({ patient, isActive, onSelect, onEdit, onDelete, onAddRecord }: PatientItemProps) => {
  const handleSelect = useCallback(() => {
    onSelect(patient.id);
  }, [onSelect, patient.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(patient);
  }, [onEdit, patient]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(patient.id);
  }, [onDelete, patient.id]);

  const handleAddRecord = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddRecord(patient);
  }, [onAddRecord, patient]);

  return (
    <div className={`ehr-patient-item ${isActive ? 'active' : ''}`}>
      <div className="patient-main" onClick={handleSelect}>
        <div className="patient-avatar">
          <img src={patient.avatarUrl || `https://picsum.photos/seed/${patient.id}/40/40`} alt={patient.name} />
        </div>
        <div className="patient-info">
          <div className="patient-name">{patient.name}</div>
          <div className="patient-meta">
            {patient.gender} • {Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))}y
            {patient.allergies && patient.allergies.length > 0 && (
              <span className="allergy-indicator">⚠️</span>
            )}
          </div>
        </div>
      </div>
      <div className="patient-actions">
        <button
          className="action-btn add-record"
          onClick={handleAddRecord}
          title="Add Medical Record"
        >
          <span className="material-symbols-outlined">add_chart</span>
        </button>
        <button
          className="action-btn edit"
          onClick={handleEdit}
          title="Edit Patient"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button
          className="action-btn delete"
          onClick={handleDelete}
          title="Delete Patient"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
});

PatientItem.displayName = 'PatientItem';

export const EHRSidebar = memo(function EHRSidebar() {
  const { state, actions } = useOptimizedApp();
  const { setCurrentPatient } = useOptimizedPatientData();
  const { showSuccess, showError } = useToast();

  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<Patient | null>(null);

  const handlePatientSelect = useCallback((patientId: string) => {
    setCurrentPatient(patientId);
  }, [setCurrentPatient]);

  const handleAddPatient = useCallback(() => {
    setEditingPatient(null);
    setShowPatientModal(true);
  }, []);

  const handleEditPatient = useCallback((patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientModal(true);
  }, []);

  const handleAddRecord = useCallback((patient: Patient) => {
    setSelectedPatientForRecord(patient);
    setCurrentPatient(patient.id);
    setShowRecordModal(true);
  }, [setCurrentPatient]);

  const handleDeletePatient = useCallback(async (patientId: string) => {
    if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      try {
        await actions.deletePatient(patientId);
        showSuccess('Patient deleted successfully');
      } catch (error) {
        showError('Failed to delete patient');
      }
    }
  }, [actions, showSuccess, showError]);

  const handleManageDoctors = useCallback(() => {
    setEditingPatient(null); // Reset editing patient
    setShowDoctorModal(true);
  }, []);

  const handleSaveDoctor = useCallback(async (doctorData: any) => {
    try {
      const newDoctor = {
        ...doctorData,
        id: `doc-${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      await databaseService.saveDoctor(newDoctor);
      showSuccess('Doctor added successfully');
      setShowDoctorModal(false);
    } catch (error) {
      console.error('Error saving doctor:', error);
      showError('Failed to save doctor');
    }
  }, [showSuccess, showError]);

  const handleSaveRecord = useCallback(async (recordData: any, files?: File[]) => {
    if (!selectedPatientForRecord) return;

    try {
      const newRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        patientId: selectedPatientForRecord.id,
        documents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to database
      await databaseService.saveMedicalRecord(newRecord);

      // Handle file attachments if any
      if (files && files.length > 0) {
        // TODO: Handle file uploads and attach to record
        console.log('Files to upload:', files);
      }

      showSuccess('Medical record added successfully');
      setShowRecordModal(false);
      setSelectedPatientForRecord(null);
    } catch (error) {
      console.error('Error saving medical record:', error);
      showError('Failed to save medical record');
    }
  }, [selectedPatientForRecord, showSuccess, showError]);

  return (
    <>
      <aside className="ehr-sidebar">
        <div className="ehr-sidebar-header">
          <div className="logo-section">
            <div className="logo">
              <span className="material-symbols-outlined">medical_services</span>
              <span className="logo-text">HealthKeeper</span>
            </div>
            <div className="logo-subtitle">EHR System</div>
          </div>
        </div>

        <div className="ehr-family-section">
          <div className="section-header">
            <h2>FAMILY MEMBERS</h2>
            <div className="action-buttons">
              <button
                className="add-btn primary"
                onClick={handleAddPatient}
                title="Add Family Member"
              >
                <span className="material-symbols-outlined">person_add</span>
              </button>
              <button
                className="add-btn secondary"
                onClick={() => selectedPatientForRecord && handleAddRecord(selectedPatientForRecord)}
                disabled={!selectedPatientForRecord}
                title="Add Record for Selected Member"
              >
                <span className="material-symbols-outlined">add_chart</span>
              </button>
            </div>
          </div>

          <div className="ehr-patient-list">
            {state.patients.map(patient => (
              <PatientItem
                key={patient.id}
                patient={patient}
                isActive={state.currentPatientId === patient.id}
                onSelect={handlePatientSelect}
                onEdit={handleEditPatient}
                onDelete={handleDeletePatient}
                onAddRecord={handleAddRecord}
              />
            ))}

            {state.patients.length === 0 && (
              <div className="empty-patients">
                <span className="material-symbols-outlined empty-icon">group_add</span>
                <p>No family members added yet</p>
                <button className="add-first-patient" onClick={handleAddPatient}>
                  Add Your First Family Member
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ehr-sidebar-footer">
          <button className="manage-doctors-btn" onClick={handleManageDoctors}>
            <span className="material-symbols-outlined">stethoscope</span>
            Manage Doctors
          </button>
          <div className="system-info">
            <div className="status-indicator online">
              <span className="status-dot"></span>
              System Online
            </div>
            <div className="backup-status">
              Last backup: 2 hours ago
            </div>
          </div>
        </div>
      </aside>

      {showPatientModal && (
        <PatientEditModal
          isOpen={showPatientModal}
          patient={editingPatient}
          onClose={() => setShowPatientModal(false)}
          onSave={async (patientData) => {
            try {
              await actions.savePatient(patientData);
              showSuccess('Patient saved successfully');
              setShowPatientModal(false);
              setEditingPatient(null);
            } catch (error) {
              showError('Failed to save patient');
            }
          }}
          doctors={state.doctors}
        />
      )}

      {showDoctorModal && (
        <DoctorEditModal
          isOpen={showDoctorModal}
          doctor={null}
          onClose={() => setShowDoctorModal(false)}
          onSave={handleSaveDoctor}
        />
      )}

      {showRecordModal && (
        <RecordFormModal
          isOpen={showRecordModal}
          onClose={() => {
            setShowRecordModal(false);
            setSelectedPatientForRecord(null);
          }}
          onSave={async (recordData, files) => {
            try {
              await handleSaveRecord(recordData, files);
              showSuccess('Medical record saved successfully');
              setShowRecordModal(false);
              setSelectedPatientForRecord(null);
            } catch (error) {
              showError('Failed to save medical record');
            }
          }}
          editData={null}
          doctors={state.doctors}
        />
      )}
    </>
  );
});

EHRSidebar.displayName = 'EHRSidebar';