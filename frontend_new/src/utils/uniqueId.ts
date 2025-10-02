import { Patient, Doctor, MedicalRecord, Medication } from '../types';

// Simple UUID generator for browser environments
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Generate timestamp-based IDs with UUID fallback for uniqueness
export const generatePatientId = (): string => {
  return `patient-${Date.now()}-${generateUUID().slice(0, 8)}`;
};

export const generateDoctorId = (): string => {
  return `doctor-${Date.now()}-${generateUUID().slice(0, 8)}`;
};

export const generateMedicalRecordId = (): string => {
  return `record-${Date.now()}-${generateUUID().slice(0, 8)}`;
};

export const generateMedicationId = (): string => {
  return `med-${Date.now()}-${generateUUID().slice(0, 8)}`;
};

export const generateHospitalId = (): string => {
  return `hid-${Date.now()}-${generateUUID().slice(0, 8)}`;
};

// Duplicate detection functions
export const isDuplicatePatient = (patient: Omit<Patient, 'id'>, existingPatients: Patient[]): boolean => {
  return existingPatients.some(existing => {
    // Check for exact name match with other criteria
    if (existing.name.toLowerCase() === patient.name.toLowerCase()) {
      // If date of birth is available, check that too
      if (patient.dateOfBirth && existing.dateOfBirth) {
        return patient.dateOfBirth === existing.dateOfBirth;
      }
      // If email is available, check that
      if (patient.contactInfo?.email && existing.contactInfo?.email) {
        return patient.contactInfo.email.toLowerCase() === existing.contactInfo.email.toLowerCase();
      }
      // If phone is available, check that
      if (patient.contactInfo?.phone && existing.contactInfo?.phone) {
        return patient.contactInfo.phone === existing.contactInfo.phone;
      }
      // If only name matches and we have other identifying info, consider it a potential duplicate
      return true;
    }
    return false;
  });
};

export const isDuplicateDoctor = (doctor: Omit<Doctor, 'id'>, existingDoctors: Doctor[]): boolean => {
  return existingDoctors.some(existing => {
    // Check for exact name and specialty match
    if (existing.name.toLowerCase() === doctor.name.toLowerCase() &&
        existing.specialty.toLowerCase() === doctor.specialty.toLowerCase()) {
      // If email is available, check that
      if (doctor.contactInfo?.email && existing.contactInfo?.email) {
        return doctor.contactInfo.email.toLowerCase() === existing.contactInfo.email.toLowerCase();
      }
      // If clinic phone is available, check that
      if (doctor.contactInfo?.clinicPhone && existing.contactInfo?.clinicPhone) {
        return doctor.contactInfo.clinicPhone === existing.contactInfo.clinicPhone;
      }
      // If mobile is available, check that
      if (doctor.contactInfo?.mobile && existing.contactInfo?.mobile) {
        return doctor.contactInfo.mobile === existing.contactInfo.mobile;
      }
      // If only name and specialty match, consider it a potential duplicate
      return true;
    }
    return false;
  });
};

export const isDuplicateMedicalRecord = (
  record: Omit<MedicalRecord, 'id'>,
  existingRecords: MedicalRecord[]
): boolean => {
  return existingRecords.some(existing => {
    // Check for same doctor, same date, and similar complaint
    return existing.doctorId === record.doctorId &&
           existing.date === record.date &&
           existing.complaint.toLowerCase() === record.complaint.toLowerCase();
  });
};

export const isDuplicateMedication = (
  medication: Omit<Medication, 'id'>,
  existingMedications: Medication[]
): boolean => {
  return existingMedications.some(existing => {
    // Check for same name, strength, and dosage
    return existing.name.toLowerCase() === medication.name.toLowerCase() &&
           (existing.strength || '') === (medication.strength || '') &&
           existing.dosage.toLowerCase() === medication.dosage.toLowerCase();
  });
};

// Find existing item by potential duplicate criteria
export const findDuplicatePatient = (
  patient: Omit<Patient, 'id'>,
  existingPatients: Patient[]
): Patient | undefined => {
  return existingPatients.find(existing => {
    if (existing.name.toLowerCase() === patient.name.toLowerCase()) {
      if (patient.dateOfBirth && existing.dateOfBirth) {
        return patient.dateOfBirth === existing.dateOfBirth;
      }
      if (patient.contactInfo?.email && existing.contactInfo?.email) {
        return patient.contactInfo.email.toLowerCase() === existing.contactInfo.email.toLowerCase();
      }
      if (patient.contactInfo?.phone && existing.contactInfo?.phone) {
        return patient.contactInfo.phone === existing.contactInfo.phone;
      }
      // If only name matches and we have other identifying info, consider it a potential duplicate
      return true;
    }
    return false;
  });
};

export const findDuplicateDoctor = (
  doctor: Omit<Doctor, 'id'>,
  existingDoctors: Doctor[]
): Doctor | undefined => {
  return existingDoctors.find(existing => {
    if (existing.name.toLowerCase() === doctor.name.toLowerCase() &&
        existing.specialty.toLowerCase() === doctor.specialty.toLowerCase()) {
      if (doctor.contactInfo?.email && existing.contactInfo?.email) {
        return doctor.contactInfo.email.toLowerCase() === existing.contactInfo.email.toLowerCase();
      }
      if (doctor.contactInfo?.clinicPhone && existing.contactInfo?.clinicPhone) {
        return doctor.contactInfo.clinicPhone === existing.contactInfo.clinicPhone;
      }
      if (doctor.contactInfo?.mobile && existing.contactInfo?.mobile) {
        return doctor.contactInfo.mobile === existing.contactInfo.mobile;
      }
      // If only name and specialty match, consider it a potential duplicate
      return true;
    }
    return false;
  });
};