import { useCallback } from 'react';
import { useHealthStore } from '../stores/useHealthStore';
import type { Doctor } from '../types';

export const useDoctorOperations = () => {
  const {
    patients,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    openDoctorModal,
    closeDoctorModal
  } = useHealthStore();

  const handleOpenDoctorModal = useCallback((doctor: Doctor | null) => {
    openDoctorModal(doctor);
  }, [openDoctorModal]);

  const handleSaveDoctor = useCallback((doctorData: Omit<Doctor, 'id'> | Doctor) => {
    if ('id' in doctorData) {
      // Editing existing doctor
      updateDoctor(doctorData.id, doctorData);
    } else {
      // Adding new doctor
      const newDoctor: Doctor = { ...doctorData, id: `doc-${Date.now()}` };
      addDoctor(newDoctor);
    }
    closeDoctorModal();
  }, [addDoctor, updateDoctor, closeDoctorModal]);

  const handleDeleteDoctor = useCallback((doctorId: string) => {
    const isDoctorInUse = patients.some(p =>
      p.primaryDoctorId === doctorId ||
      p.records.some(r => r.doctorId === doctorId)
    );

    if (isDoctorInUse) {
      // TODO: Replace with contextual validation
      alert("Cannot delete this doctor because they are assigned to a patient or a record. Please reassign before deleting.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this doctor?")) {
      deleteDoctor(doctorId);
    }
  }, [patients, deleteDoctor]);

  return {
    handleOpenDoctorModal,
    handleSaveDoctor,
    handleDeleteDoctor,
    closeDoctorModal
  };
};