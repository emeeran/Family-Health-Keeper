import React from 'react';
import PatientFormModal from '../presentational/PatientFormModal';
import RecordFormModal from '../presentational/RecordFormModal';
import DoctorEditModal from '../components/DoctorEditModal';
import { useHealthStore } from '../stores/useHealthStore';
import { usePatientOperations } from '../hooks/usePatientOperations';
import { useRecordOperations } from '../hooks/useRecordOperations';
import { useDoctorOperations } from '../hooks/useDoctorOperations';
import type { Patient, MedicalRecord, Doctor } from '../types';

const ModalContainer: React.FC = () => {
  const {
    isPatientFormModalOpen,
    isRecordFormModalOpen,
    isDoctorModalOpen,
    patientToEdit,
    recordToEdit,
    doctorToEdit,
    doctors
  } = useHealthStore();

  const patientOperations = usePatientOperations();
  const recordOperations = useRecordOperations();
  const doctorOperations = useDoctorOperations();

  return (
    <>
      {isPatientFormModalOpen && (
        <PatientFormModal
          isOpen={isPatientFormModalOpen}
          onClose={patientOperations.closePatientForm}
          onSave={patientOperations.handleSavePatient}
          editData={patientToEdit}
        />
      )}

      {isRecordFormModalOpen && (
        <RecordFormModal
          isOpen={isRecordFormModalOpen}
          onClose={recordOperations.closeRecordForm}
          onSave={recordOperations.handleSaveRecordForm}
          editData={recordToEdit}
          doctors={doctors}
        />
      )}

      <DoctorEditModal
        isOpen={isDoctorModalOpen}
        doctor={doctorToEdit}
        onSave={doctorOperations.handleSaveDoctor}
        onClose={doctorOperations.closeDoctorModal}
      />
    </>
  );
};

export default ModalContainer;