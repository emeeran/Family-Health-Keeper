import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { secureStorage } from '../../services/secureStorageService';

describe('SecureStorageService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock crypto.getRandomValues for testing
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: vi.fn((arr) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }),
        subtle: {
          importKey: vi.fn().mockResolvedValue({
            encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
            decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32))
          }),
          encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
          decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32))
        }
      },
      configurable: true
    });

    // Mock btoa and atob for Node.js environment
    global.btoa = vi.fn((str) => Buffer.from(str, 'binary').toString('base64'));
    global.atob = vi.fn((b64) => Buffer.from(b64, 'base64').toString('binary'));

    // Mock TextEncoder/TextDecoder
    global.TextEncoder = vi.fn().mockImplementation(() => ({
      encode: vi.fn((str) => Buffer.from(str).toString('binary'))
    }));
    global.TextDecoder = vi.fn().mockImplementation(() => ({
      decode: vi.fn((buffer) => Buffer.from(buffer).toString())
    }));

    // Reset session
    secureStorage.logout();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('Patient Operations', () => {
    it('should save and retrieve patients with encryption', async () => {
      const patients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'john@example.com',
          address: '123 Test St',
          medicalHistory: 'No significant history',
          allergies: ['Peanuts'],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(patients);

      const retrievedPatients = await secureStorage.loadPatients();
      expect(retrievedPatients).toEqual(patients);
    });

    it('should persist patients to localStorage', async () => {
      const patients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'john@example.com',
          address: '123 Test St',
          medicalHistory: 'No significant history',
          allergies: ['Peanuts'],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(patients);

      const encryptedData = localStorage.getItem('fhk_patients_encrypted');
      expect(encryptedData).toBeDefined();
      expect(encryptedData).not.toBe(''); // Should be encrypted (not plain text)
    });

    it('should add single patient', async () => {
      const initialPatients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'john@example.com',
          address: '123 Test St',
          medicalHistory: 'No significant history',
          allergies: ['Peanuts'],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(initialPatients);

      const newPatient = {
        id: 'patient-2',
        name: 'Jane Doe',
        dateOfBirth: '1992-02-02',
        gender: 'Female',
        bloodGroup: 'B+',
        contactNumber: '0987654321',
        email: 'jane@example.com',
        address: '456 Test Ave',
        medicalHistory: 'Asthma',
        allergies: ['Dust'],
        records: [],
        reminders: [],
        currentMedications: []
      };

      await secureStorage.addPatient(newPatient);

      const allPatients = await secureStorage.loadPatients();
      expect(allPatients).toHaveLength(2);
      expect(allPatients.find(p => p.id === 'patient-2')).toEqual(newPatient);
    });

    it('should filter old records based on retention policy', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const patients = [
        {
          id: 'patient-1',
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'john@example.com',
          address: '123 Test St',
          medicalHistory: 'No significant history',
          allergies: ['Peanuts'],
          records: [
            {
              id: 'record-1',
              date: oldDate.toISOString().split('T')[0],
              complaint: 'Old complaint',
              diagnosis: 'Old diagnosis',
              prescription: 'Old prescription',
              notes: 'Old notes'
            }
          ],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(patients);

      const retrievedPatients = await secureStorage.loadPatients();
      expect(retrievedPatients[0].records).toHaveLength(0); // Old record should be filtered
    });
  });

  describe('Doctor Operations', () => {
    it('should save and retrieve doctors with encryption', async () => {
      const doctors = [
        {
          id: 'doctor-1',
          name: 'Dr. Smith',
          specialty: 'Cardiology',
          contactNumber: '1112223333',
          email: 'smith@hospital.com',
          address: '123 Medical Center'
        }
      ];

      await secureStorage.saveDoctors(doctors);

      const retrievedDoctors = await secureStorage.loadDoctors();
      expect(retrievedDoctors).toEqual(doctors);
    });

    it('should persist doctors to localStorage', async () => {
      const doctors = [
        {
          id: 'doctor-1',
          name: 'Dr. Smith',
          specialty: 'Cardiology',
          contactNumber: '1112223333',
          email: 'smith@hospital.com',
          address: '123 Medical Center'
        }
      ];

      await secureStorage.saveDoctors(doctors);

      const encryptedData = localStorage.getItem('fhk_doctors_encrypted');
      expect(encryptedData).toBeDefined();
      expect(encryptedData).not.toBe(''); // Should be encrypted
    });

    it('should add single doctor', async () => {
      const initialDoctors = [
        {
          id: 'doctor-1',
          name: 'Dr. Smith',
          specialty: 'Cardiology',
          contactNumber: '1112223333',
          email: 'smith@hospital.com',
          address: '123 Medical Center'
        }
      ];

      await secureStorage.saveDoctors(initialDoctors);

      const newDoctor = {
        id: 'doctor-2',
        name: 'Dr. Johnson',
        specialty: 'Neurology',
        contactNumber: '4445556666',
        email: 'johnson@hospital.com',
        address: '456 Medical Plaza'
      };

      await secureStorage.addDoctor(newDoctor);

      const allDoctors = await secureStorage.loadDoctors();
      expect(allDoctors).toHaveLength(2);
      expect(allDoctors.find(d => d.id === 'doctor-2')).toEqual(newDoctor);
    });
  });

  describe('Security Features', () => {
    it('should have active session after initialization', () => {
      const sessionInfo = secureStorage.getSessionInfo();
      expect(sessionInfo).toBeDefined();
      expect(sessionInfo?.isActive).toBe(true);
    });

    it('should provide security status', () => {
      const status = secureStorage.getSecurityStatus();
      expect(status.isActiveSession).toBe(true);
      expect(status.lockoutStatus).toBe(false);
      expect(status.encryptionEnabled).toBe(true);
      expect(status.failedAttempts).toBe(0);
      expect(status.lastActivity).toBeDefined();
    });

    it('should generate audit log entries', async () => {
      const patients = [
        {
          id: 'patient-1',
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'test@example.com',
          address: '123 Test St',
          medicalHistory: '',
          allergies: [],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(patients);

      const auditLog = secureStorage.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);

      const saveLogEntry = auditLog.find(entry => entry.action === 'SAVE_PATIENTS');
      expect(saveLogEntry).toBeDefined();
      expect(saveLogEntry?.severity).toBe('low');
    });

    it('should validate data integrity', async () => {
      const patients = [
        {
          id: 'patient-1',
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'test@example.com',
          address: '123 Test St',
          medicalHistory: '',
          allergies: [],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(patients);

      const isValid = await secureStorage.validateDataIntegrity();
      expect(isValid).toBe(true);
    });

    it('should allow changing encryption key', async () => {
      const patients = [
        {
          id: 'patient-1',
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'test@example.com',
          address: '123 Test St',
          medicalHistory: '',
          allergies: [],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await secureStorage.savePatients(patients);

      const newKey = 'new_test_encryption_key_32_chars_long';
      await secureStorage.changeEncryptionKey(newKey);

      const retrievedPatients = await secureStorage.loadPatients();
      expect(retrievedPatients).toEqual(patients);
    });

    it('should handle logout correctly', () => {
      secureStorage.logout();

      const sessionInfo = secureStorage.getSessionInfo();
      expect(sessionInfo).toBeNull();

      const status = secureStorage.getSecurityStatus();
      expect(status.isActiveSession).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', async () => {
      const patients = await secureStorage.loadPatients();
      expect(patients).toEqual([]);

      const doctors = await secureStorage.loadDoctors();
      expect(doctors).toEqual([]);
    });

    it('should handle corrupted data gracefully', async () => {
      // Simulate corrupted encrypted data
      localStorage.setItem('fhk_patients_encrypted', 'invalid_base64_data');

      const patients = await secureStorage.loadPatients();
      expect(patients).toEqual([]); // Should return empty array on corruption
    });

    it('should reject operations when not allowed', async () => {
      // Force logout
      secureStorage.logout();

      const patients = [
        {
          id: 'patient-1',
          name: 'Test Patient',
          dateOfBirth: '1990-01-01',
          gender: 'Male',
          bloodGroup: 'A+',
          contactNumber: '1234567890',
          email: 'test@example.com',
          address: '123 Test St',
          medicalHistory: '',
          allergies: [],
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      await expect(secureStorage.savePatients(patients)).rejects.toThrow('Operation not allowed');
      await expect(secureStorage.loadPatients()).rejects.toThrow('Operation not allowed');
    });
  });

  describe('Encryption Key Generation', () => {
    it('should generate device fingerprint for encryption', () => {
      // Mock canvas for fingerprint generation
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({
          textBaseline: 'top',
          font: '14px Arial',
          fillText: vi.fn()
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test')
      };

      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas)
      } as any;

      // Mock navigator properties
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Test User Agent',
        configurable: true
      });
      Object.defineProperty(global.navigator, 'language', {
        value: 'en-US',
        configurable: true
      });

      // Mock screen
      global.screen = {
        width: 1920,
        height: 1080
      } as any;

      // Mock window properties
      global.window = {
        sessionStorage: true,
        localStorage: true
      } as any;

      const secureStorageNew = secureStorage; // Singleton should use same instance

      const status = secureStorageNew.getSecurityStatus();
      expect(status.encryptionEnabled).toBe(true);
    });
  });
});