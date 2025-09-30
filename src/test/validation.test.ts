import { describe, it, expect, test } from 'vitest';
import {
  patientSchema,
  doctorSchema,
  medicalRecordSchema,
  medicationSchema,
  validatePatient,
  validateDoctor,
  validateMedicalRecord,
  validateMedication,
  safeValidatePatient,
  safeValidateDoctor,
  safeValidateMedicalRecord,
  safeValidateMedication,
} from '../../utils/validation';

describe('Validation Schemas', () => {
  describe('Patient Schema', () => {
    it('should validate a valid patient', () => {
      const validPatient = {
        id: 'patient-1',
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        contactInfo: {
          phone: '+1234567890',
          email: 'john@example.com',
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'spouse',
          phone: '+1234567891',
        },
        medicalHistory: 'No significant medical history',
        allergies: ['Penicillin'],
        conditions: ['Asthma'],
      };

      const result = patientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
    });

    it('should reject patient with invalid name', () => {
      const invalidPatient = {
        name: '', // Empty name
        dateOfBirth: '1990-01-01',
      };

      const result = patientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });

    it('should reject patient with invalid date format', () => {
      const invalidPatient = {
        name: 'John Doe',
        dateOfBirth: '01/01/1990', // Invalid format
      };

      const result = patientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });

    it('should reject patient with invalid email', () => {
      const invalidPatient = {
        name: 'John Doe',
        contactInfo: {
          email: 'invalid-email',
        },
      };

      const result = patientSchema.safeParse(invalidPatient);
      expect(result.success).toBe(false);
    });

    it('should accept patient with minimal required fields', () => {
      const minimalPatient = {
        id: 'patient-1',
        name: 'John Doe',
        medicalHistory: '',
      };

      const result = patientSchema.safeParse(minimalPatient);
      expect(result.success).toBe(true);
    });

    it('should validate patient with notable events', () => {
      const patientWithEvents = {
        id: 'patient-1',
        name: 'John Doe',
        medicalHistory: '',
        notableEvents: [
          {
            type: 'Vaccination',
            date: '2023-01-01',
            description: 'COVID-19 booster shot'
          }
        ]
      };

      const result = patientSchema.safeParse(patientWithEvents);
      expect(result.success).toBe(true);
    });

    it('should reject patient with invalid notable event date', () => {
      const patientWithInvalidEvent = {
        id: 'patient-1',
        name: 'John Doe',
        medicalHistory: '',
        notableEvents: [
          {
            type: 'Vaccination',
            date: '01/01/2023', // Invalid format
            description: 'COVID-19 booster shot'
          }
        ]
      };

      const result = patientSchema.safeParse(patientWithInvalidEvent);
      expect(result.success).toBe(false);
    });

    it('should validate patient with hospital IDs', () => {
      const patientWithHospitalIds = {
        id: 'patient-1',
        name: 'John Doe',
        medicalHistory: '',
        hospitalIds: [
          {
            id: 'hid-1',
            hospitalName: 'General Hospital',
            patientId: 'PAT001'
          }
        ]
      };

      const result = patientSchema.safeParse(patientWithHospitalIds);
      expect(result.success).toBe(true);
    });
  });

  describe('Doctor Schema', () => {
    it('should validate a valid doctor', () => {
      const validDoctor = {
        id: 'doctor-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
      };

      const result = doctorSchema.safeParse(validDoctor);
      expect(result.success).toBe(true);
    });

    it('should reject doctor with empty name', () => {
      const invalidDoctor = {
        name: '',
        specialty: 'Cardiology',
      };

      const result = doctorSchema.safeParse(invalidDoctor);
      expect(result.success).toBe(false);
    });

    it('should reject doctor with empty specialty', () => {
      const invalidDoctor = {
        name: 'Dr. Smith',
        specialty: '',
      };

      const result = doctorSchema.safeParse(invalidDoctor);
      expect(result.success).toBe(false);
    });
  });

  describe('Medical Record Schema', () => {
    it('should validate a valid medical record', () => {
      const validRecord = {
        date: '2023-01-01',
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
        investigations: 'ECG, Blood tests',
        diagnosis: 'Anxiety',
        prescription: 'Alprazolam 0.25mg',
        notes: 'Patient responds well to treatment',
        documents: [],
      };

      const result = medicalRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
    });

    it('should reject medical record with invalid date', () => {
      const invalidRecord = {
        date: '01/01/2023', // Invalid format
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
      };

      const result = medicalRecordSchema.safeParse(invalidRecord);
      expect(result.success).toBe(false);
    });

    it('should reject medical record without doctorId', () => {
      const invalidRecord = {
        date: '2023-01-01',
        complaint: 'Chest pain',
      };

      const result = medicalRecordSchema.safeParse(invalidRecord);
      expect(result.success).toBe(false);
    });
  });

  describe('Medication Schema', () => {
    it('should validate a valid medication', () => {
      const validMedication = {
        id: 'med-1',
        name: 'Lisinopril',
        strength: '10mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        timings: ['08:00'],
        prescribedBy: 'Dr. Smith',
        startDate: '2023-01-01',
        notes: 'Take with food',
      };

      const result = medicationSchema.safeParse(validMedication);
      expect(result.success).toBe(true);
    });

    it('should reject medication without name', () => {
      const invalidMedication = {
        dosage: '1 tablet',
        frequency: 'Once daily',
      };

      const result = medicationSchema.safeParse(invalidMedication);
      expect(result.success).toBe(false);
    });

    it('should accept medication with minimal required fields', () => {
      const minimalMedication = {
        id: 'med-1',
        name: 'Aspirin',
      };

      const result = medicationSchema.safeParse(minimalMedication);
      expect(result.success).toBe(true);
    });
  });
});

describe('Validation Functions', () => {
  describe('Strict Validation Functions', () => {
    it('validatePatient should return validated data for valid input', () => {
      const validPatient = { id: 'patient-1', name: 'John Doe', medicalHistory: '' };
      const result = validatePatient(validPatient);
      expect(result).toEqual(validPatient);
    });

    it('validatePatient should throw error for invalid input', () => {
      const invalidPatient = { name: '' };
      expect(() => validatePatient(invalidPatient)).toThrow();
    });

    it('validateDoctor should return validated data for valid input', () => {
      const validDoctor = {
        id: 'doctor-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        contactInfo: {
          clinicPhone: 'Ph 02 12345678',
          mobile: '0987654321',
          email: 'dr.smith@example.com',
          address: '123 Medical Center Dr'
        }
      };
      const result = validateDoctor(validDoctor);
      expect(result).toEqual(validDoctor);
    });

    it('validateDoctor should validate contact information', () => {
      const doctorWithInvalidPhone = {
        id: 'doctor-2',
        name: 'Dr. Jones',
        specialty: 'Pediatrics',
        contactInfo: {
          clinicPhone: 'invalid-phone',
          mobile: '123',
          email: 'invalid-email'
        }
      };

      expect(() => validateDoctor(doctorWithInvalidPhone)).toThrow();
    });

    it('validateMedicalRecord should return validated data for valid input', () => {
      const validRecord = {
        id: 'record-1',
        date: '2023-01-01',
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        documents: [],
      };
      const result = validateMedicalRecord(validRecord);
      expect(result).toEqual(validRecord);
    });

    it('validateMedication should return validated data for valid input', () => {
      const validMedication = { id: 'med-1', name: 'Aspirin' };
      const result = validateMedication(validMedication);
      expect(result).toEqual(validMedication);
    });
  });

  describe('Safe Validation Functions', () => {
    it('safeValidatePatient should return result for valid input', () => {
      const validPatient = { id: 'patient-1', name: 'John Doe', medicalHistory: '' };
      const result = safeValidatePatient(validPatient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPatient);
      }
    });

    it('safeValidatePatient should return error for invalid input', () => {
      const invalidPatient = { name: '' };
      const result = safeValidatePatient(invalidPatient);
      expect(result.success).toBe(false);
    });

    it('safeValidateDoctor should return result for valid input', () => {
      const validDoctor = { id: 'doctor-1', name: 'Dr. Smith', specialty: 'Cardiology' };
      const result = safeValidateDoctor(validDoctor);
      expect(result.success).toBe(true);
    });

    it('safeValidateMedicalRecord should return result for valid input', () => {
      const validRecord = {
        id: 'record-1',
        date: '2023-01-01',
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        documents: [],
      };
      const result = safeValidateMedicalRecord(validRecord);
      expect(result.success).toBe(true);
    });

    it('safeValidateMedication should return result for valid input', () => {
      const validMedication = { id: 'med-1', name: 'Aspirin' };
      const result = safeValidateMedication(validMedication);
      expect(result.success).toBe(true);
    });
  });
});