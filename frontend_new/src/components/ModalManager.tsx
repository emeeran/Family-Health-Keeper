import React, { memo } from 'react';
import PatientFormModal from './PatientFormModal';
import PatientEditModal from './PatientEditModal';
import RecordFormModal from './RecordFormModal';
import DoctorEditModal from './DoctorEditModal';
import type { Patient, MedicalRecord, Doctor } from '../types';

interface ModalManagerProps {
  isAddingPatient: boolean;
  isEditingPatient: boolean;
  isAddingRecord: boolean;
  patientToEdit: Patient | null;
  recordToEdit: MedicalRecord | null;
  doctorToEdit: Doctor | null;
  selectedPatientId: string;
  onClosePatientForm: () => void;
  onClosePatientEdit: () => void;
  onCloseRecordForm: () => void;
  onCloseDoctorEdit: () => void;
  onSavePatient: (patientData: Partial<Patient>) => void;
  onSaveRecord: () => void;
  onSaveDoctor: (doctorData: Partial<Doctor>) => void;
}

const ModalManager: React.FC<ModalManagerProps> = ({
  isAddingPatient,
  isEditingPatient,
  isAddingRecord,
  patientToEdit,
  recordToEdit,
  doctorToEdit,
  selectedPatientId,
  onClosePatientForm,
  onClosePatientEdit,
  onCloseRecordForm,
  onCloseDoctorEdit,
  onSavePatient,
  onSaveRecord,
  onSaveDoctor
}) => {
  return (
    <>
      {isAddingPatient && (
        <PatientFormModal
          patient={patientToEdit}
          onClose={onClosePatientForm}
          onSave={onSavePatient}
        />
      )}

      {isEditingPatient && (
        <PatientEditModal
          patient={patientToEdit}
          onClose={onClosePatientEdit}
          onSave={onSavePatient}
        />
      )}

      {isAddingRecord && (
        <RecordFormModal
          patientId={selectedPatientId}
          record={recordToEdit}
          onClose={onCloseRecordForm}
          onSave={onSaveRecord}
        />
      )}

      {doctorToEdit && (
        <DoctorEditModal
          doctor={doctorToEdit}
          onClose={onCloseDoctorEdit}
          onSave={onSaveDoctor}
        />
      )}
    </>
  );
};

export default memo(ModalManager);