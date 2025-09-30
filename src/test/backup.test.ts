import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BackupManager, BackupData, BackupOptions, RestoreOptions, BackupSchedule } from '../../utils/backup';
import { Patient, Doctor } from '../../types';

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document methods
document.createElement = vi.fn(() => ({
  href: '',
  download: '',
  click: vi.fn()
}));
document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('BackupManager', () => {
  let mockPatients: Patient[];
  let mockDoctors: Doctor[];
  let backupData: BackupData;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // Setup test data
    mockPatients = [
      {
        id: 'patient-1',
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        contactInfo: { phone: '+1234567890', email: 'john@example.com' },
        medicalHistory: 'No significant medical history',
        allergies: ['Penicillin'],
        conditions: ['Asthma'],
        records: [
          {
            id: 'record-1',
            date: '2023-01-01',
            doctorId: 'doctor-1',
            complaint: 'Chest pain',
            diagnosis: 'Anxiety',
            notes: 'Patient responds well to treatment',
            documents: []
          }
        ],
        reminders: [],
        currentMedications: []
      },
      {
        id: 'patient-2',
        name: 'Jane Smith',
        dateOfBirth: '1985-05-15',
        gender: 'female',
        contactInfo: { phone: '+1234567891', email: 'jane@example.com' },
        medicalHistory: 'Healthy',
        records: [],
        reminders: [],
        currentMedications: []
      }
    ];

    mockDoctors = [
      {
        id: 'doctor-1',
        name: 'Dr. Smith',
        specialty: 'Cardiology',
        contactInfo: { phone: '+1234567892', email: 'smith@example.com' }
      },
      {
        id: 'doctor-2',
        name: 'Dr. Johnson',
        specialty: 'General Practice',
        contactInfo: { phone: '+1234567893' }
      }
    ];

    backupData = {
      version: '1.0.0',
      timestamp: '2023-01-01T00:00:00.000Z',
      patients: mockPatients,
      doctors: mockDoctors,
      metadata: {
        totalPatients: 2,
        totalDoctors: 2,
        totalRecords: 1,
        totalMedications: 0,
        totalReminders: 0,
        totalDocuments: 0,
        appVersion: '1.0.0'
      }
    };
  });

  describe('createBackup', () => {
    it('should create a backup with default options', async () => {
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);

      expect(backup).toMatchObject({
        version: '1.0.0',
        patients: expect.any(Array),
        doctors: expect.any(Array),
        metadata: expect.any(Object)
      });

      expect(backup.patients).toHaveLength(2);
      expect(backup.doctors).toHaveLength(2);
      expect(backup.metadata.totalPatients).toBe(2);
      expect(backup.metadata.totalDoctors).toBe(2);
    });

    it('should exclude images when includeImages is false', async () => {
      const patientWithImages: Patient = {
        ...mockPatients[0],
        medicalImages: [
          {
            originalFile: new File([''], 'test.jpg', { type: 'image/jpeg' }),
            compressedFile: new File([''], 'test-compressed.jpg', { type: 'image/jpeg' }),
            originalSize: 1000000,
            compressedSize: 500000,
            compressionRatio: 0.5,
            format: 'jpeg',
            dimensions: { width: 800, height: 600 }
          }
        ]
      };

      const backup = await BackupManager.createBackup(
        [patientWithImages],
        mockDoctors,
        { includeImages: false }
      );

      expect(backup.patients[0].medicalImages).toBeUndefined();
    });

    it('should include images when includeImages is true', async () => {
      const patientWithImages: Patient = {
        ...mockPatients[0],
        medicalImages: [
          {
            originalFile: new File([''], 'test.jpg', { type: 'image/jpeg' }),
            compressedFile: new File([''], 'test-compressed.jpg', { type: 'image/jpeg' }),
            originalSize: 1000000,
            compressedSize: 500000,
            compressionRatio: 0.5,
            format: 'jpeg',
            dimensions: { width: 800, height: 600 }
          }
        ]
      };

      const backup = await BackupManager.createBackup(
        [patientWithImages],
        mockDoctors,
        { includeImages: true }
      );

      expect(backup.patients[0].medicalImages).toBeDefined();
      expect(backup.patients[0].medicalImages).toHaveLength(1);
    });

    it('should calculate metadata correctly', async () => {
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);

      expect(backup.metadata).toMatchObject({
        totalPatients: 2,
        totalDoctors: 2,
        totalRecords: 1,
        totalMedications: 0,
        totalReminders: 0,
        totalDocuments: 0
      });
    });
  });

  describe('saveBackupLocally', () => {
    it('should save backup to localStorage', async () => {
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);
      const backupId = await BackupManager.saveBackupLocally(backup, 'test-backup.json');

      expect(backupId).toMatch(/^backup-\d+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'family-health-keeper-backups',
        expect.any(String)
      );

      // Verify the saved data structure
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0]).toMatchObject({
        id: backupId,
        filename: 'test-backup.json',
        data: expect.objectContaining({
          version: '1.0.0',
          patients: expect.any(Array),
          doctors: expect.any(Array)
        }),
        size: expect.any(Number),
        createdAt: expect.any(String)
      });
    });

    it('should limit stored backups to 10', async () => {
      // Create 11 backups
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);

      for (let i = 0; i < 11; i++) {
        await BackupManager.saveBackupLocally(backup, `backup-${i}.json`);
      }

      const callData = JSON.parse(localStorageMock.setItem.mock.calls[10][1]);
      expect(callData).toHaveLength(10);
      expect(callData[0].filename).toBe('backup-10.json'); // Most recent first
    });
  });

  describe('getStoredBackups', () => {
    it('should return empty array when no backups exist', () => {
      const backups = BackupManager.getStoredBackups();
      expect(backups).toEqual([]);
    });

    it('should return stored backups', async () => {
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);
      await BackupManager.saveBackupLocally(backup, 'test-backup.json');

      const backups = BackupManager.getStoredBackups();
      expect(backups).toHaveLength(1);
      expect(backups[0].filename).toBe('test-backup.json');
    });
  });

  describe('deleteBackup', () => {
    it('should delete existing backup', async () => {
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);
      const backupId = await BackupManager.saveBackupLocally(backup);

      const result = BackupManager.deleteBackup(backupId);
      expect(result).toBe(true);

      const backups = BackupManager.getStoredBackups();
      expect(backups).toHaveLength(0);
    });

    it('should return false for non-existent backup', () => {
      const result = BackupManager.deleteBackup('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('downloadBackup', () => {
    it('should trigger download', async () => {
      const backup = await BackupManager.createBackup(mockPatients, mockDoctors);

      BackupManager.downloadBackup(backup, 'test-backup.json');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore with replace strategy', async () => {
      const result = await BackupManager.restoreFromBackup(
        backupData,
        [],
        [],
        { mergeStrategy: 'replace' }
      );

      expect(result.success).toBe(true);
      expect(result.patientsAdded).toBe(2);
      expect(result.patientsUpdated).toBe(0);
      expect(result.doctorsAdded).toBe(2);
      expect(result.doctorsUpdated).toBe(0);
    });

    it('should restore with merge strategy', async () => {
      const existingPatients: Patient[] = [
        {
          id: 'patient-1',
          name: 'John Doe (Modified)',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          contactInfo: { phone: '+1234567890' },
          medicalHistory: 'Updated history',
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      const existingDoctors: Doctor[] = [
        {
          id: 'doctor-1',
          name: 'Dr. Smith (Modified)',
          specialty: 'Cardiology',
          contactInfo: { phone: '+1234567892' }
        }
      ];

      const result = await BackupManager.restoreFromBackup(
        backupData,
        existingPatients,
        existingDoctors,
        { mergeStrategy: 'merge' }
      );

      expect(result.success).toBe(true);
      expect(result.patientsAdded).toBe(1); // patient-2 is new
      expect(result.patientsUpdated).toBe(1); // patient-1 is updated
      expect(result.doctorsAdded).toBe(1); // doctor-2 is new
      expect(result.doctorsUpdated).toBe(1); // doctor-1 is updated
    });

    it('should restore with merge-preserve strategy', async () => {
      const existingPatients: Patient[] = [
        {
          id: 'patient-1',
          name: 'John Doe (Original)',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          contactInfo: { phone: '+1234567890' },
          medicalHistory: 'Original history',
          records: [],
          reminders: [],
          currentMedications: []
        }
      ];

      const result = await BackupManager.restoreFromBackup(
        backupData,
        existingPatients,
        [],
        { mergeStrategy: 'merge-preserve' }
      );

      expect(result.success).toBe(true);
      expect(result.patientsAdded).toBe(1); // Only patient-2 is added
      expect(result.patientsUpdated).toBe(0); // patient-1 is preserved
    });

    it('should validate backup data when validateData is true', async () => {
      const invalidBackup = { ...backupData, version: undefined };

      const result = await BackupManager.restoreFromBackup(
        invalidBackup,
        [],
        [],
        { validateData: true }
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing or invalid version');
    });

    it('should skip validation when validateData is false', async () => {
      const invalidBackup = { ...backupData, version: undefined };

      const result = await BackupManager.restoreFromBackup(
        invalidBackup,
        [],
        [],
        { validateData: false }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('loadBackupFromFile', () => {
    it('should load backup from valid JSON file', async () => {
      const file = new File([JSON.stringify(backupData)], 'backup.json', {
        type: 'application/json'
      });

      const loadedBackup = await BackupManager.loadBackupFromFile(file);
      expect(loadedBackup).toEqual(backupData);
    });

    it('should reject invalid JSON file', async () => {
      const file = new File(['invalid json'], 'backup.json', {
        type: 'application/json'
      });

      await expect(BackupManager.loadBackupFromFile(file)).rejects.toThrow('Invalid backup file format');
    });
  });

  describe('backup scheduling', () => {
    it('should create backup schedule', () => {
      const schedule: Omit<BackupSchedule, 'id' | 'nextBackup'> = {
        name: 'Test Schedule',
        frequency: 'daily',
        time: '02:00',
        includeImages: false,
        compression: true,
        encryption: false,
        enabled: true
      };

      const createdSchedule = BackupManager.createSchedule(schedule);

      expect(createdSchedule).toMatchObject({
        ...schedule,
        id: expect.stringMatching(/^schedule-\d+$/),
        nextBackup: expect.any(String)
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'family-health-keeper-schedules',
        expect.any(String)
      );
    });

    it('should get schedules', () => {
      const schedule = BackupManager.createSchedule({
        name: 'Test Schedule',
        frequency: 'daily',
        time: '02:00',
        includeImages: false,
        compression: true,
        encryption: false,
        enabled: true
      });

      const schedules = BackupManager.getSchedules();
      expect(schedules).toHaveLength(1);
      expect(schedules[0].id).toBe(schedule.id);
    });

    it('should update schedule', () => {
      const schedule = BackupManager.createSchedule({
        name: 'Test Schedule',
        frequency: 'daily',
        time: '02:00',
        includeImages: false,
        compression: true,
        encryption: false,
        enabled: true
      });

      const updated = BackupManager.updateSchedule(schedule.id, { enabled: false });
      expect(updated).toBe(true);

      const schedules = BackupManager.getSchedules();
      expect(schedules[0].enabled).toBe(false);
    });

    it('should delete schedule', () => {
      const schedule = BackupManager.createSchedule({
        name: 'Test Schedule',
        frequency: 'daily',
        time: '02:00',
        includeImages: false,
        compression: true,
        encryption: false,
        enabled: true
      });

      const deleted = BackupManager.deleteSchedule(schedule.id);
      expect(deleted).toBe(true);

      const schedules = BackupManager.getSchedules();
      expect(schedules).toHaveLength(0);
    });

    it('should check scheduled backups', () => {
      // Create a schedule with nextBackup in the past
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const schedule = BackupManager.createSchedule({
        name: 'Past Schedule',
        frequency: 'daily',
        time: '02:00',
        includeImages: false,
        compression: true,
        encryption: false,
        enabled: true
      });

      // Manually set nextBackup to past
      BackupManager.updateSchedule(schedule.id, { nextBackup: pastDate });

      const dueSchedules = BackupManager.checkScheduledBackups();
      expect(dueSchedules).toHaveLength(1);
      expect(dueSchedules[0].id).toBe(schedule.id);
    });
  });

  describe('utility methods', () => {
    it('should validate backup data correctly', () => {
      const validData = {
        version: '1.0.0',
        timestamp: '2023-01-01T00:00:00.000Z',
        patients: [],
        doctors: []
      };

      const validation = BackupManager['validateBackupData'](validData);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid backup data', () => {
      const invalidData = {
        version: undefined,
        timestamp: 'invalid-date',
        patients: 'not-an-array',
        doctors: []
      };

      const validation = BackupManager['validateBackupData'](invalidData);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should calculate next backup time correctly', () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 60000); // 1 minute in future
      const timeString = futureTime.toTimeString().slice(0, 5);

      const nextBackup = BackupManager['calculateNextBackup']('daily', timeString);
      const nextDate = new Date(nextBackup);

      expect(nextDate).toBeInstanceOf(Date);
      expect(nextDate.getTime()).toBeGreaterThan(now.getTime());
    });
  });
});