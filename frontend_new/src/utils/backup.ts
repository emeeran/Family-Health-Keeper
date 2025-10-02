/**
 * Backup and restore utilities for Family Health Keeper
 * Handles data export, import, backup scheduling, and restore capabilities
 */

import { Patient, Doctor, MedicalRecord, Medication, Reminder, CompressionResult } from '../types';

export interface BackupData {
  version: string;
  timestamp: string;
  patients: Patient[];
  doctors: Doctor[];
  metadata: {
    totalPatients: number;
    totalDoctors: number;
    totalRecords: number;
    totalMedications: number;
    totalReminders: number;
    totalDocuments: number;
    appVersion: string;
  };
}

export interface BackupOptions {
  includeImages?: boolean;
  compression?: boolean;
  encryption?: boolean;
  password?: string;
}

export interface RestoreOptions {
  mergeStrategy?: 'replace' | 'merge' | 'merge-preserve';
  validateData?: boolean;
  backupBeforeRestore?: boolean;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  patientsAdded?: number;
  patientsUpdated?: number;
  doctorsAdded?: number;
  doctorsUpdated?: number;
  errors?: string[];
}

export interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  includeImages: boolean;
  compression: boolean;
  encryption: boolean;
  password?: string;
  lastBackup?: string;
  nextBackup: string;
  enabled: boolean;
}

export class BackupManager {
  private static readonly STORAGE_KEY = 'family-health-keeper-backups';
  private static readonly SCHEDULE_KEY = 'family-health-keeper-schedules';
  private static readonly VERSION = '1.0.0';

  /**
   * Create a backup of all application data
   */
  static async createBackup(
    patients: Patient[],
    doctors: Doctor[],
    options: BackupOptions = {}
  ): Promise<BackupData> {
    const {
      includeImages = false,
      compression = true,
      encryption = false,
      password
    } = options;

    // Calculate metadata
    const metadata = this.calculateMetadata(patients, doctors);

    // Prepare backup data
    let backupData: BackupData = {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      patients: includeImages ? patients : this.removeImagesFromPatients(patients),
      doctors,
      metadata
    };

    // Apply compression if enabled
    if (compression) {
      backupData = await this.compressData(backupData);
    }

    // Apply encryption if enabled
    if (encryption && password) {
      backupData = await this.encryptData(backupData, password);
    }

    return backupData;
  }

  /**
   * Save backup to local storage
   */
  static async saveBackupLocally(
    backupData: BackupData,
    filename?: string
  ): Promise<string> {
    const backupId = `backup-${Date.now()}`;
    const backups = this.getStoredBackups();

    const backupEntry = {
      id: backupId,
      filename: filename || `backup-${backupData.timestamp}.json`,
      data: backupData,
      size: JSON.stringify(backupData).length,
      createdAt: new Date().toISOString()
    };

    // Limit to 10 most recent backups
    backups.unshift(backupEntry);
    if (backups.length > 10) {
      backups.splice(10);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
    return backupId;
  }

  /**
   * Download backup as file
   */
  static downloadBackup(backupData: BackupData, filename?: string): void {
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `family-health-keeper-backup-${backupData.timestamp}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Restore data from backup
   */
  static async restoreFromBackup(
    backupData: BackupData,
    currentPatients: Patient[],
    currentDoctors: Doctor[],
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    const {
      mergeStrategy = 'merge',
      validateData = true,
      backupBeforeRestore = true
    } = options;

    try {
      // Validate backup data
      if (validateData) {
        const validation = this.validateBackupData(backupData);
        if (!validation.valid) {
          return {
            success: false,
            message: 'Invalid backup data',
            errors: validation.errors
          };
        }
      }

      // Create backup before restore if requested
      if (backupBeforeRestore) {
        const preRestoreBackup = await this.createBackup(currentPatients, currentDoctors);
        await this.saveBackupLocally(preRestoreBackup, `pre-restore-${Date.now()}.json`);
      }

      // Apply merge strategy
      let restoredPatients: Patient[] = [];
      let restoredDoctors: Doctor[] = [];
      let patientsAdded = 0;
      let patientsUpdated = 0;
      let doctorsAdded = 0;
      let doctorsUpdated = 0;

      switch (mergeStrategy) {
        case 'replace':
          restoredPatients = backupData.patients;
          restoredDoctors = backupData.doctors;
          patientsAdded = backupData.patients.length;
          doctorsAdded = backupData.doctors.length;
          break;

        case 'merge':
          const mergedPatients = this.mergePatients(currentPatients, backupData.patients);
          const mergedDoctors = this.mergeDoctors(currentDoctors, backupData.doctors);

          restoredPatients = mergedPatients.patients;
          restoredDoctors = mergedDoctors.doctors;
          patientsAdded = mergedPatients.added;
          patientsUpdated = mergedPatients.updated;
          doctorsAdded = mergedDoctors.added;
          doctorsUpdated = mergedDoctors.updated;
          break;

        case 'merge-preserve':
          const preservedPatients = this.mergePatientsPreserve(currentPatients, backupData.patients);
          const preservedDoctors = this.mergeDoctorsPreserve(currentDoctors, backupData.doctors);

          restoredPatients = preservedPatients.patients;
          restoredDoctors = preservedDoctors.doctors;
          patientsAdded = preservedPatients.added;
          patientsUpdated = preservedPatients.updated;
          doctorsAdded = preservedDoctors.added;
          doctorsUpdated = preservedDoctors.updated;
          break;
      }

      return {
        success: true,
        message: 'Data restored successfully',
        patientsAdded,
        patientsUpdated,
        doctorsAdded,
        doctorsUpdated
      };

    } catch (error) {
      return {
        success: false,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Load backup from file
   */
  static async loadBackupFromFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Get stored backups
   */
  static getStoredBackups(): Array<{
    id: string;
    filename: string;
    data: BackupData;
    size: number;
    createdAt: string;
  }> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Delete stored backup
   */
  static deleteBackup(backupId: string): boolean {
    const backups = this.getStoredBackups();
    const filtered = backups.filter(b => b.id !== backupId);

    if (filtered.length === backups.length) {
      return false; // Backup not found
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }

  /**
   * Backup scheduling
   */
  static createSchedule(schedule: Omit<BackupSchedule, 'id' | 'nextBackup'>): BackupSchedule {
    const newSchedule: BackupSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      nextBackup: this.calculateNextBackup(schedule.frequency, schedule.time)
    };

    const schedules = this.getSchedules();
    schedules.push(newSchedule);
    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(schedules));

    return newSchedule;
  }

  static getSchedules(): BackupSchedule[] {
    const stored = localStorage.getItem(this.SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static updateSchedule(scheduleId: string, updates: Partial<BackupSchedule>): boolean {
    const schedules = this.getSchedules();
    const index = schedules.findIndex(s => s.id === scheduleId);

    if (index === -1) return false;

    schedules[index] = { ...schedules[index], ...updates };
    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(schedules));
    return true;
  }

  static deleteSchedule(scheduleId: string): boolean {
    const schedules = this.getSchedules();
    const filtered = schedules.filter(s => s.id !== scheduleId);

    if (filtered.length === schedules.length) return false;

    localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(filtered));
    return true;
  }

  static checkScheduledBackups(): BackupSchedule[] {
    const schedules = this.getSchedules();
    const now = new Date();
    const dueSchedules = schedules.filter(s =>
      s.enabled && new Date(s.nextBackup) <= now
    );

    // Update next backup times for due schedules
    dueSchedules.forEach(schedule => {
      this.updateSchedule(schedule.id, {
        lastBackup: now.toISOString(),
        nextBackup: this.calculateNextBackup(schedule.frequency, schedule.time)
      });
    });

    return dueSchedules;
  }

  // Private helper methods
  private static calculateMetadata(patients: Patient[], doctors: Doctor[]) {
    const totalRecords = patients.reduce((sum, p) => sum + p.records.length, 0);
    const totalMedications = patients.reduce((sum, p) => sum + (p.currentMedications?.length || 0), 0);
    const totalReminders = patients.reduce((sum, p) => sum + (p.reminders?.length || 0), 0);
    const totalDocuments = patients.reduce((sum, p) => sum + (p.medicalImages?.length || 0), 0);

    return {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalRecords,
      totalMedications,
      totalReminders,
      totalDocuments,
      appVersion: this.VERSION
    };
  }

  private static removeImagesFromPatients(patients: Patient[]): Patient[] {
    return patients.map(patient => ({
      ...patient,
      medicalImages: undefined
    }));
  }

  private static async compressData(data: BackupData): Promise<BackupData> {
    // In a real implementation, this would use actual compression
    // For now, we'll just return the data as-is
    return data;
  }

  private static async encryptData(data: BackupData, password: string): Promise<BackupData> {
    // In a real implementation, this would use actual encryption
    // For now, we'll just return the data as-is
    return data;
  }

  private static validateBackupData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.version || typeof data.version !== 'string') {
      errors.push('Missing or invalid version');
    }

    if (!data.timestamp || typeof data.timestamp !== 'string') {
      errors.push('Missing or invalid timestamp');
    }

    if (!Array.isArray(data.patients)) {
      errors.push('Invalid patients data');
    }

    if (!Array.isArray(data.doctors)) {
      errors.push('Invalid doctors data');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static mergePatients(
    current: Patient[],
    backup: Patient[]
  ): { patients: Patient[]; added: number; updated: number } {
    const result: Patient[] = [...current];
    let added = 0;
    let updated = 0;

    backup.forEach(backupPatient => {
      const existingIndex = result.findIndex(p => p.id === backupPatient.id);

      if (existingIndex === -1) {
        result.push(backupPatient);
        added++;
      } else {
        // Update existing patient, preserve newer records
        const existingPatient = result[existingIndex];
        const mergedPatient = {
          ...backupPatient,
          // Merge records, keeping the most recent versions
          records: this.mergeRecords(existingPatient.records, backupPatient.records)
        };
        result[existingIndex] = mergedPatient;
        updated++;
      }
    });

    return { patients: result, added, updated };
  }

  private static mergeDoctors(
    current: Doctor[],
    backup: Doctor[]
  ): { doctors: Doctor[]; added: number; updated: number } {
    const result: Doctor[] = [...current];
    let added = 0;
    let updated = 0;

    backup.forEach(backupDoctor => {
      const existingIndex = result.findIndex(d => d.id === backupDoctor.id);

      if (existingIndex === -1) {
        result.push(backupDoctor);
        added++;
      } else {
        result[existingIndex] = backupDoctor;
        updated++;
      }
    });

    return { doctors: result, added, updated };
  }

  private static mergePatientsPreserve(
    current: Patient[],
    backup: Patient[]
  ): { patients: Patient[]; added: number; updated: number } {
    const result: Patient[] = [...current];
    let added = 0;
    let updated = 0;

    backup.forEach(backupPatient => {
      const existingIndex = result.findIndex(p => p.id === backupPatient.id);

      if (existingIndex === -1) {
        result.push(backupPatient);
        added++;
      }
      // Don't update existing patients in preserve mode
    });

    return { patients: result, added, updated };
  }

  private static mergeDoctorsPreserve(
    current: Doctor[],
    backup: Doctor[]
  ): { doctors: Doctor[]; added: number; updated: number } {
    const result: Doctor[] = [...current];
    let added = 0;
    let updated = 0;

    backup.forEach(backupDoctor => {
      const existingIndex = result.findIndex(d => d.id === backupDoctor.id);

      if (existingIndex === -1) {
        result.push(backupDoctor);
        added++;
      }
      // Don't update existing doctors in preserve mode
    });

    return { doctors: result, added, updated };
  }

  private static mergeRecords(current: MedicalRecord[], backup: MedicalRecord[]): MedicalRecord[] {
    const merged = [...current];

    backup.forEach(backupRecord => {
      const existingIndex = merged.findIndex(r => r.id === backupRecord.id);

      if (existingIndex === -1) {
        merged.push(backupRecord);
      } else {
        // Keep the record with the more recent date
        const existingRecord = merged[existingIndex];
        if (new Date(backupRecord.date) > new Date(existingRecord.date)) {
          merged[existingIndex] = backupRecord;
        }
      }
    });

    return merged;
  }

  private static calculateNextBackup(frequency: 'daily' | 'weekly' | 'monthly', time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    let next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    if (frequency === 'daily') {
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
    } else if (frequency === 'weekly') {
      next.setDate(next.getDate() + (7 - now.getDay()));
      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }
    } else if (frequency === 'monthly') {
      next.setDate(1);
      next.setMonth(next.getMonth() + 1);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next.toISOString();
  }
}