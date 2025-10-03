import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { databaseService } from '../../services/databaseService';
import type { Patient, Doctor } from '../../types';

describe('DatabaseService', () => {
  beforeEach(async () => {
    await databaseService.init();
    await databaseService.clearAll();
  });

  afterEach(async () => {
    await databaseService.clearAll();
  });

  describe('Patient Operations', () => {
    it('should save and retrieve patients', async () => {
      const patient: Patient = {
        id: 'test-patient-1',
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'A+',
        contactNumber: '1234567890',
        email: 'test@example.com',
        address: '123 Test St',
        medicalHistory: 'No significant medical history',
        allergies: ['Penicillin'],
        records: [],
        reminders: [],
        currentMedications: []
      };

      await databaseService.savePatient(patient);

      const retrievedPatients = await databaseService.getAllPatients();
      expect(retrievedPatients).toHaveLength(1);
      expect(retrievedPatients[0]).toEqual(patient);

      const retrievedPatient = await databaseService.getPatient('test-patient-1');
      expect(retrievedPatient).toEqual(patient);
    });

    it('should update existing patients', async () => {
      const patient: Patient = {
        id: 'test-patient-1',
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'A+',
        contactNumber: '1234567890',
        email: 'test@example.com',
        address: '123 Test St',
        medicalHistory: 'No significant medical history',
        allergies: ['Penicillin'],
        records: [],
        reminders: [],
        currentMedications: []
      };

      await databaseService.savePatient(patient);

      const updatedPatient = { ...patient, name: 'Updated Test Patient' };
      await databaseService.savePatient(updatedPatient);

      const retrievedPatient = await databaseService.getPatient('test-patient-1');
      expect(retrievedPatient?.name).toBe('Updated Test Patient');
    });

    it('should delete patients', async () => {
      const patient: Patient = {
        id: 'test-patient-1',
        name: 'Test Patient',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'A+',
        contactNumber: '1234567890',
        email: 'test@example.com',
        address: '123 Test St',
        medicalHistory: 'No significant medical history',
        allergies: ['Penicillin'],
        records: [],
        reminders: [],
        currentMedications: []
      };

      await databaseService.savePatient(patient);
      await databaseService.deletePatient('test-patient-1');

      const retrievedPatient = await databaseService.getPatient('test-patient-1');
      expect(retrievedPatient).toBeNull();

      const allPatients = await databaseService.getAllPatients();
      expect(allPatients).toHaveLength(0);
    });

    it('should return null for non-existent patient', async () => {
      const patient = await databaseService.getPatient('non-existent-id');
      expect(patient).toBeNull();
    });
  });

  describe('Doctor Operations', () => {
    it('should save and retrieve doctors', async () => {
      const doctor: Doctor = {
        id: 'test-doctor-1',
        name: 'Test Doctor',
        specialty: 'General Practice',
        contactNumber: '1234567890',
        email: 'doctor@example.com',
        address: '123 Medical Center'
      };

      await databaseService.saveDoctor(doctor);

      const retrievedDoctors = await databaseService.getAllDoctors();
      expect(retrievedDoctors).toHaveLength(1);
      expect(retrievedDoctors[0]).toEqual(doctor);

      const retrievedDoctor = await databaseService.getDoctor('test-doctor-1');
      expect(retrievedDoctor).toEqual(doctor);
    });

    it('should update existing doctors', async () => {
      const doctor: Doctor = {
        id: 'test-doctor-1',
        name: 'Test Doctor',
        specialty: 'General Practice',
        contactNumber: '1234567890',
        email: 'doctor@example.com',
        address: '123 Medical Center'
      };

      await databaseService.saveDoctor(doctor);

      const updatedDoctor = { ...doctor, name: 'Updated Test Doctor' };
      await databaseService.saveDoctor(updatedDoctor);

      const retrievedDoctor = await databaseService.getDoctor('test-doctor-1');
      expect(retrievedDoctor?.name).toBe('Updated Test Doctor');
    });

    it('should delete doctors', async () => {
      const doctor: Doctor = {
        id: 'test-doctor-1',
        name: 'Test Doctor',
        specialty: 'General Practice',
        contactNumber: '1234567890',
        email: 'doctor@example.com',
        address: '123 Medical Center'
      };

      await databaseService.saveDoctor(doctor);
      await databaseService.deleteDoctor('test-doctor-1');

      const retrievedDoctor = await databaseService.getDoctor('test-doctor-1');
      expect(retrievedDoctor).toBeNull();

      const allDoctors = await databaseService.getAllDoctors();
      expect(allDoctors).toHaveLength(0);
    });

    it('should return null for non-existent doctor', async () => {
      const doctor = await databaseService.getDoctor('non-existent-id');
      expect(doctor).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid patient data gracefully', async () => {
      const invalidPatient = {
        id: 'invalid-patient',
        name: ''
      } as Patient;

      await expect(databaseService.savePatient(invalidPatient)).rejects.toThrow();
    });

    it('should handle database operations when not initialized', async () => {
      // Create a new instance without initialization
      const freshDatabaseService = { ...databaseService };
      await freshDatabaseService.clearAll();

      const testPatient: Patient = {
        id: 'test-patient',
        name: 'Test',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'A+',
        contactNumber: '1234567890',
        email: 'test@example.com',
        address: 'Test Address',
        medicalHistory: '',
        allergies: [],
        records: [],
        reminders: [],
        currentMedications: []
      };

      await expect(freshDatabaseService.savePatient(testPatient)).resolves.not.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency across operations', async () => {
      const patient1: Patient = {
        id: 'patient-1',
        name: 'Patient One',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        bloodGroup: 'A+',
        contactNumber: '1234567890',
        email: 'patient1@example.com',
        address: 'Address 1',
        medicalHistory: '',
        allergies: [],
        records: [],
        reminders: [],
        currentMedications: []
      };

      const patient2: Patient = {
        id: 'patient-2',
        name: 'Patient Two',
        dateOfBirth: '1992-02-02',
        gender: 'Female',
        bloodGroup: 'B+',
        contactNumber: '0987654321',
        email: 'patient2@example.com',
        address: 'Address 2',
        medicalHistory: '',
        allergies: [],
        records: [],
        reminders: [],
        currentMedications: []
      };

      await databaseService.savePatient(patient1);
      await databaseService.savePatient(patient2);

      const allPatients = await databaseService.getAllPatients();
      expect(allPatients).toHaveLength(2);
      expect(allPatients.find(p => p.id === 'patient-1')).toEqual(patient1);
      expect(allPatients.find(p => p.id === 'patient-2')).toEqual(patient2);

      await databaseService.deletePatient('patient-1');

      const remainingPatients = await databaseService.getAllPatients();
      expect(remainingPatients).toHaveLength(1);
      expect(remainingPatients[0]).toEqual(patient2);
    });
  });
});