/**
 * Backup Store Slice
 * 
 * Manages backup/restore operations, auto-backup settings, and backup history.
 */

import { StateCreator } from 'zustand';
import BackupService, { type EncryptedBackup, type BackupHistoryEntry, type BackupData } from '../../services/backupService';
import type { Patient, Doctor } from '../../types';

export interface BackupState {
  // State
  backupService: BackupService | null;
  backupHistory: BackupHistoryEntry[];
  autoBackupEnabled: boolean;
  autoBackupInterval: number; // in hours
  lastAutoBackup: string | null;
  isCreatingBackup: boolean;
  isRestoringBackup: boolean;
  lastBackupError: string | null;

  // Actions
  initializeBackupService: (encryptionKey: string) => void;
  createBackup: (patients: Patient[], doctors: Doctor[], isAutoBackup?: boolean) => Promise<EncryptedBackup | null>;
  restoreBackup: (backup: EncryptedBackup) => Promise<BackupData | null>;
  exportBackup: (backup: EncryptedBackup, filename?: string) => Promise<boolean>;
  importBackupFromFile: (file: File) => Promise<EncryptedBackup | null>;
  validateBackup: (backup: EncryptedBackup) => Promise<boolean>;
  getBackupHistory: () => void;
  clearBackupHistory: () => void;
  setAutoBackupEnabled: (enabled: boolean) => void;
  setAutoBackupInterval: (hours: number) => void;
  checkAutoBackup: (patients: Patient[], doctors: Doctor[]) => Promise<void>;
  estimateBackupSize: (patients: Patient[], doctors: Doctor[]) => number;
}

export const createBackupSlice: StateCreator<BackupState> = (set, get) => ({
  // Initial state
  backupService: null,
  backupHistory: [],
  autoBackupEnabled: false,
  autoBackupInterval: 24, // Default: daily
  lastAutoBackup: null,
  isCreatingBackup: false,
  isRestoringBackup: false,
  lastBackupError: null,

  // Initialize backup service with encryption key
  initializeBackupService: (encryptionKey: string) => {
    try {
      const service = new BackupService(encryptionKey);
      const history = service.getBackupHistory();
      
      // Load auto-backup settings
      const settings = localStorage.getItem('fhk_auto_backup_settings');
      let autoBackupEnabled = false;
      let autoBackupInterval = 24;
      let lastAutoBackup = null;

      if (settings) {
        const parsed = JSON.parse(settings);
        autoBackupEnabled = parsed.enabled || false;
        autoBackupInterval = parsed.interval || 24;
        lastAutoBackup = parsed.lastBackup || null;
      }

      set({
        backupService: service,
        backupHistory: history,
        autoBackupEnabled,
        autoBackupInterval,
        lastAutoBackup,
      });
    } catch (error) {
      console.error('Failed to initialize backup service:', error);
      set({ lastBackupError: `Initialization failed: ${error}` });
    }
  },

  // Create a new backup
  createBackup: async (patients: Patient[], doctors: Doctor[], isAutoBackup = false) => {
    const { backupService } = get();
    if (!backupService) {
      set({ lastBackupError: 'Backup service not initialized' });
      return null;
    }

    set({ isCreatingBackup: true, lastBackupError: null });

    try {
      const backup = await backupService.createBackup(patients, doctors, isAutoBackup);
      const history = backupService.getBackupHistory();

      if (isAutoBackup) {
        const lastAutoBackup = new Date().toISOString();
        set({ lastAutoBackup });
        
        // Save auto-backup timestamp
        const settings = {
          enabled: get().autoBackupEnabled,
          interval: get().autoBackupInterval,
          lastBackup: lastAutoBackup,
        };
        localStorage.setItem('fhk_auto_backup_settings', JSON.stringify(settings));
      }

      set({
        backupHistory: history,
        isCreatingBackup: false,
      });

      return backup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isCreatingBackup: false,
        lastBackupError: errorMessage,
      });
      return null;
    }
  },

  // Restore from backup
  restoreBackup: async (backup: EncryptedBackup) => {
    const { backupService } = get();
    if (!backupService) {
      set({ lastBackupError: 'Backup service not initialized' });
      return null;
    }

    set({ isRestoringBackup: true, lastBackupError: null });

    try {
      const restoredData = await backupService.restoreBackup(backup);
      set({ isRestoringBackup: false });
      return restoredData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({
        isRestoringBackup: false,
        lastBackupError: errorMessage,
      });
      return null;
    }
  },

  // Export backup to file
  exportBackup: async (backup: EncryptedBackup, filename?: string) => {
    const { backupService } = get();
    if (!backupService) {
      set({ lastBackupError: 'Backup service not initialized' });
      return false;
    }

    try {
      await backupService.exportBackupToFile(backup, filename);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ lastBackupError: errorMessage });
      return false;
    }
  },

  // Import backup from file
  importBackupFromFile: async (file: File) => {
    const { backupService } = get();
    if (!backupService) {
      set({ lastBackupError: 'Backup service not initialized' });
      return null;
    }

    set({ lastBackupError: null });

    try {
      const backup = await backupService.importBackupFromFile(file);
      return backup;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ lastBackupError: errorMessage });
      return null;
    }
  },

  // Validate backup integrity
  validateBackup: async (backup: EncryptedBackup) => {
    const { backupService } = get();
    if (!backupService) return false;

    try {
      return await backupService.validateBackup(backup);
    } catch (error) {
      return false;
    }
  },

  // Refresh backup history
  getBackupHistory: () => {
    const { backupService } = get();
    if (!backupService) return;

    const history = backupService.getBackupHistory();
    set({ backupHistory: history });
  },

  // Clear backup history
  clearBackupHistory: () => {
    const { backupService } = get();
    if (!backupService) return;

    backupService.clearBackupHistory();
    set({ backupHistory: [] });
  },

  // Enable/disable auto-backup
  setAutoBackupEnabled: (enabled: boolean) => {
    set({ autoBackupEnabled: enabled });

    const settings = {
      enabled,
      interval: get().autoBackupInterval,
      lastBackup: get().lastAutoBackup,
    };
    localStorage.setItem('fhk_auto_backup_settings', JSON.stringify(settings));
  },

  // Set auto-backup interval (in hours)
  setAutoBackupInterval: (hours: number) => {
    set({ autoBackupInterval: hours });

    const settings = {
      enabled: get().autoBackupEnabled,
      interval: hours,
      lastBackup: get().lastAutoBackup,
    };
    localStorage.setItem('fhk_auto_backup_settings', JSON.stringify(settings));
  },

  // Check if auto-backup is needed and create if necessary
  checkAutoBackup: async (patients: Patient[], doctors: Doctor[]) => {
    const { autoBackupEnabled, autoBackupInterval, lastAutoBackup, createBackup } = get();

    if (!autoBackupEnabled) return;

    const now = new Date();
    const intervalMs = autoBackupInterval * 60 * 60 * 1000; // Convert hours to milliseconds

    // Check if it's time for auto-backup
    if (!lastAutoBackup) {
      // First auto-backup
      await createBackup(patients, doctors, true);
      return;
    }

    const lastBackupDate = new Date(lastAutoBackup);
    const timeSinceLastBackup = now.getTime() - lastBackupDate.getTime();

    if (timeSinceLastBackup >= intervalMs) {
      await createBackup(patients, doctors, true);
    }
  },

  // Estimate backup size
  estimateBackupSize: (patients: Patient[], doctors: Doctor[]) => {
    const { backupService } = get();
    if (!backupService) return 0;
    return backupService.estimateBackupSize(patients, doctors);
  },
});
