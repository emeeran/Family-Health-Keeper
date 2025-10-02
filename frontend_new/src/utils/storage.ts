import type { Patient, Doctor } from '../types';

export class StorageService {
  private static readonly PATIENTS_KEY = 'fhk_patients';
  private static readonly DOCTORS_KEY = 'fhk_doctors';
  private static readonly THEME_KEY = 'fhk_theme';
  private static readonly BACKUP_KEY = 'fhk_backup';

  // Patient storage
  static savePatients(patients: Patient[]): void {
    try {
      localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(patients));
      this.createBackup(patients);
    } catch (error) {
      console.error('Failed to save patients:', error);
    }
  }

  static loadPatients(): Patient[] {
    try {
      const stored = localStorage.getItem(this.PATIENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load patients:', error);
      return [];
    }
  }

  // Doctor storage
  static saveDoctors(doctors: Doctor[]): void {
    try {
      localStorage.setItem(this.DOCTORS_KEY, JSON.stringify(doctors));
    } catch (error) {
      console.error('Failed to save doctors:', error);
    }
  }

  static loadDoctors(): Doctor[] {
    try {
      const stored = localStorage.getItem(this.DOCTORS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load doctors:', error);
      return [];
    }
  }

  // Theme storage
  static saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  static loadTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(this.THEME_KEY);
      return (stored as 'light' | 'dark') || 'light';
    } catch (error) {
      console.error('Failed to load theme:', error);
      return 'light';
    }
  }

  // Backup functionality
  static createBackup(patients: Patient[]): void {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        patients: patients,
        version: '1.0'
      };
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  static loadBackup(): { patients: Patient[]; timestamp: string } | null {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  // Export functionality
  static exportToJSON(patient: Patient): string {
    return JSON.stringify(patient, null, 2);
  }

  static exportAllToJSON(patients: Patient[]): string {
    return JSON.stringify({
      exportDate: new Date().toISOString(),
      version: '1.0',
      patients: patients
    }, null, 2);
  }

  // Import functionality
  static importFromJSON(jsonString: string): { patients: Patient[]; errors: string[] } {
    const errors: string[] = [];
    let patients: Patient[] = [];

    try {
      const data = JSON.parse(jsonString);

      if (data.patients && Array.isArray(data.patients)) {
        patients = data.patients;
      } else if (Array.isArray(data)) {
        patients = data;
      } else {
        errors.push('Invalid JSON format: expected patients array or object with patients property');
      }
    } catch (error) {
      errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { patients, errors };
  }

  // Clear storage
  static clearAll(): void {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('fhk_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  // Get storage info
  static getStorageInfo(): {
    totalSize: number;
    patientsCount: number;
    doctorsCount: number;
    backupAvailable: boolean;
  } {
    let totalSize = 0;
    let patientsCount = 0;
    let doctorsCount = 0;
    let backupAvailable = false;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('fhk_')) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;

          if (key === this.PATIENTS_KEY) {
            try {
              patientsCount = JSON.parse(value).length;
            } catch (error) {
              // Ignore parse errors
            }
          } else if (key === this.DOCTORS_KEY) {
            try {
              doctorsCount = JSON.parse(value).length;
            } catch (error) {
              // Ignore parse errors
            }
          } else if (key === this.BACKUP_KEY) {
            backupAvailable = true;
          }
        }
      }
    });

    return {
      totalSize,
      patientsCount,
      doctorsCount,
      backupAvailable
    };
  }
}