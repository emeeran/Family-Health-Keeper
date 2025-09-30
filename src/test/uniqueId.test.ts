import { describe, it, expect } from 'vitest';
import {
  generatePatientId,
  generateDoctorId,
  generateMedicalRecordId,
  generateMedicationId,
  isDuplicatePatient,
  isDuplicateDoctor,
  isDuplicateMedicalRecord,
  isDuplicateMedication,
  findDuplicatePatient,
  findDuplicateDoctor
} from '../../utils/uniqueId';
import type { Patient, Doctor, MedicalRecord, Medication } from '../../types';

describe('Unique ID Generation', () => {
  it('should generate unique patient IDs', () => {
    const id1 = generatePatientId();
    const id2 = generatePatientId();

    expect(id1).toMatch(/^patient-\d+-[a-f0-9]{8}$/);
    expect(id2).toMatch(/^patient-\d+-[a-f0-9]{8}$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate unique doctor IDs', () => {
    const id1 = generateDoctorId();
    const id2 = generateDoctorId();

    expect(id1).toMatch(/^doctor-\d+-[a-f0-9]{8}$/);
    expect(id2).toMatch(/^doctor-\d+-[a-f0-9]{8}$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate unique medical record IDs', () => {
    const id1 = generateMedicalRecordId();
    const id2 = generateMedicalRecordId();

    expect(id1).toMatch(/^record-\d+-[a-f0-9]{8}$/);
    expect(id2).toMatch(/^record-\d+-[a-f0-9]{8}$/);
    expect(id1).not.toBe(id2);
  });

  it('should generate unique medication IDs', () => {
    const id1 = generateMedicationId();
    const id2 = generateMedicationId();

    expect(id1).toMatch(/^med-\d+-[a-f0-9]{8}$/);
    expect(id2).toMatch(/^med-\d+-[a-f0-9]{8}$/);
    expect(id1).not.toBe(id2);
  });
});

describe('Duplicate Detection', () => {
  describe('Patient Duplicate Detection', () => {
    const existingPatients: Patient[] = [
      {
        id: 'patient-1',
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        contactInfo: { email: 'john@example.com' },
        hospitalIds: [],
        records: [],
        reminders: [],
        currentMedications: [],
        avatarUrl: '',
        medicalHistory: ''
      },
      {
        id: 'patient-2',
        name: 'Jane Smith',
        dateOfBirth: '1985-05-15',
        hospitalIds: [],
        records: [],
        reminders: [],
        currentMedications: [],
        avatarUrl: '',
        medicalHistory: ''
      }
    ];

    it('should detect duplicate patient by name and date of birth', () => {
      const newPatient = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        hospitalIds: [],
        records: [],
        reminders: [],
        currentMedications: [],
        avatarUrl: '',
        medicalHistory: ''
      };

      expect(isDuplicatePatient(newPatient, existingPatients)).toBe(true);
    });

    it('should detect duplicate patient by name and email', () => {
      const newPatient = {
        name: 'John Doe',
        contactInfo: { email: 'john@example.com' },
        hospitalIds: [],
        records: [],
        reminders: [],
        currentMedications: [],
        avatarUrl: '',
        medicalHistory: ''
      };

      expect(isDuplicatePatient(newPatient, existingPatients)).toBe(true);
    });

    it('should not detect duplicate when names are different', () => {
      const newPatient = {
        name: 'Bob Johnson',
        dateOfBirth: '1990-01-01',
        hospitalIds: [],
        records: [],
        reminders: [],
        currentMedications: [],
        avatarUrl: '',
        medicalHistory: ''
      };

      expect(isDuplicatePatient(newPatient, existingPatients)).toBe(false);
    });

    it('should find existing duplicate patient', () => {
      const newPatient = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        hospitalIds: [],
        records: [],
        reminders: [],
        currentMedications: [],
        avatarUrl: '',
        medicalHistory: ''
      };

      const duplicate = findDuplicatePatient(newPatient, existingPatients);
      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe('patient-1');
    });
  });

  describe('Doctor Duplicate Detection', () => {
    const existingDoctors: Doctor[] = [
      {
        id: 'doctor-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        contactInfo: { email: 'smith@example.com' }
      },
      {
        id: 'doctor-2',
        name: 'Dr. Johnson',
        specialty: 'Pediatrics'
      }
    ];

    it('should detect duplicate doctor by name and specialty', () => {
      const newDoctor = {
        name: 'Dr. Smith',
        specialty: 'Cardiology'
      };

      expect(isDuplicateDoctor(newDoctor, existingDoctors)).toBe(true);
    });

    it('should detect duplicate doctor by name, specialty, and email', () => {
      const newDoctor = {
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        contactInfo: { email: 'smith@example.com' }
      };

      expect(isDuplicateDoctor(newDoctor, existingDoctors)).toBe(true);
    });

    it('should not detect duplicate when specialty is different', () => {
      const newDoctor = {
        name: 'Dr. Smith',
        specialty: 'Neurology'
      };

      expect(isDuplicateDoctor(newDoctor, existingDoctors)).toBe(false);
    });

    it('should find existing duplicate doctor', () => {
      const newDoctor = {
        name: 'Dr. Smith',
        specialty: 'Cardiology'
      };

      const duplicate = findDuplicateDoctor(newDoctor, existingDoctors);
      expect(duplicate).toBeDefined();
      expect(duplicate?.id).toBe('doctor-1');
    });
  });

  describe('Medical Record Duplicate Detection', () => {
    const existingRecords: MedicalRecord[] = [
      {
        id: 'record-1',
        date: '2023-01-01',
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        documents: []
      }
    ];

    it('should detect duplicate medical record by doctor, date, and complaint', () => {
      const newRecord = {
        date: '2023-01-01',
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        documents: []
      };

      expect(isDuplicateMedicalRecord(newRecord, existingRecords)).toBe(true);
    });

    it('should not detect duplicate when date is different', () => {
      const newRecord = {
        date: '2023-01-02',
        doctorId: 'doctor-1',
        complaint: 'Chest pain',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: '',
        documents: []
      };

      expect(isDuplicateMedicalRecord(newRecord, existingRecords)).toBe(false);
    });
  });

  describe('Medication Duplicate Detection', () => {
    const existingMedications: Medication[] = [
      {
        id: 'med-1',
        name: 'Lisinopril',
        strength: '10mg',
        dosage: '1 tablet'
      }
    ];

    it('should detect duplicate medication by name, strength, and dosage', () => {
      const newMedication = {
        name: 'Lisinopril',
        strength: '10mg',
        dosage: '1 tablet'
      };

      expect(isDuplicateMedication(newMedication, existingMedications)).toBe(true);
    });

    it('should not detect duplicate when dosage is different', () => {
      const newMedication = {
        name: 'Lisinopril',
        strength: '10mg',
        dosage: '2 tablets'
      };

      expect(isDuplicateMedication(newMedication, existingMedications)).toBe(false);
    });

    it('should not detect duplicate when strength is different', () => {
      const newMedication = {
        name: 'Lisinopril',
        strength: '20mg',
        dosage: '1 tablet'
      };

      expect(isDuplicateMedication(newMedication, existingMedications)).toBe(false);
    });
  });
});