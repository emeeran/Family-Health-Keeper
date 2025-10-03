/**
 * Data Backup Manager Component
 * 
 * Provides UI for creating, restoring, and managing encrypted backups
 * with auto-backup configuration and backup history.
 */

import React, { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, Clock, CheckCircle, AlertCircle, Trash2, Save, Settings } from 'lucide-react';
import BackupService, { type EncryptedBackup, type BackupHistoryEntry } from '../services/backupService';
import type { Patient, Doctor } from '../types';

interface DataBackupManagerProps {
  patients: Patient[];
  doctors: Doctor[];
  encryptionKey: string;
  onRestoreComplete?: (patients: Patient[], doctors: Doctor[]) => void;
}

export const DataBackupManager: React.FC<DataBackupManagerProps> = ({
  patients,
  doctors,
  encryptionKey,
  onRestoreComplete,
}) => {
  const [backupService] = useState(() => new BackupService(encryptionKey));
  const [backupHistory, setBackupHistory] = useState<BackupHistoryEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentBackup, setCurrentBackup] = useState<EncryptedBackup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(24);
  const [showSettings, setShowSettings] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState<string>('');

  useEffect(() => {
    loadBackupHistory();
    loadAutoBackupSettings();
    updateEstimatedSize();
  }, [patients, doctors]);

  const loadBackupHistory = () => {
    const history = backupService.getBackupHistory();
    setBackupHistory(history);
  };

  const loadAutoBackupSettings = () => {
    try {
      const settings = localStorage.getItem('fhk_auto_backup_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoBackupEnabled(parsed.enabled || false);
        setAutoBackupInterval(parsed.interval || 24);
      }
    } catch (error) {
      console.error('Failed to load auto-backup settings:', error);
    }
  };

  const saveAutoBackupSettings = () => {
    try {
      const settings = {
        enabled: autoBackupEnabled,
        interval: autoBackupInterval,
        lastBackup: null,
      };
      localStorage.setItem('fhk_auto_backup_settings', JSON.stringify(settings));
      setSuccess('Auto-backup settings saved');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to save auto-backup settings');
    }
  };

  const updateEstimatedSize = () => {
    const size = backupService.estimateBackupSize(patients, doctors);
    setEstimatedSize(BackupService.formatSize(size));
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const backup = await backupService.createBackup(patients, doctors, false);
      setCurrentBackup(backup);
      loadBackupHistory();
      setSuccess(`Backup created successfully with ${patients.length} patients and ${doctors.length} doctors`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportBackup = async () => {
    if (!currentBackup) {
      setError('No backup to export. Create a backup first.');
      return;
    }

    try {
      await backupService.exportBackupToFile(currentBackup);
      setSuccess('Backup exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export backup');
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    try {
      const backup = await backupService.importBackupFromFile(file);
      
      // Validate backup
      const isValid = await backupService.validateBackup(backup);
      if (!isValid) {
        setError('Backup validation failed. The file may be corrupted.');
        return;
      }

      setCurrentBackup(backup);
      setSuccess(`Backup imported successfully. Contains ${backup.metadata.itemCount.patients} patients and ${backup.metadata.itemCount.doctors} doctors.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup');
    }

    // Reset file input
    event.target.value = '';
  };

  const handleRestoreBackup = async () => {
    if (!currentBackup) {
      setError('No backup to restore. Import a backup first.');
      return;
    }

    const confirmRestore = window.confirm(
      'This will replace all current data with the backup. Are you sure you want to continue?'
    );

    if (!confirmRestore) return;

    setIsRestoring(true);
    setError(null);
    setSuccess(null);

    try {
      const restoredData = await backupService.restoreBackup(currentBackup);
      
      if (onRestoreComplete) {
        onRestoreComplete(restoredData.data.patients, restoredData.data.doctors);
      }

      setSuccess(`Data restored successfully: ${restoredData.data.patients.length} patients, ${restoredData.data.doctors.length} doctors`);
      setCurrentBackup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClearHistory = () => {
    const confirmClear = window.confirm('Are you sure you want to clear backup history?');
    if (!confirmClear) return;

    backupService.clearBackupHistory();
    loadBackupHistory();
    setSuccess('Backup history cleared');
    setTimeout(() => setSuccess(null), 3000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="backup-manager p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Backup & Restore
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Auto-backup settings"
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Auto-Backup Settings */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Auto-Backup Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-backup-enabled"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor="auto-backup-enabled"
                className="ml-2 text-gray-700 dark:text-gray-300"
              >
                Enable automatic backups
              </label>
            </div>

            {autoBackupEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Backup Interval (hours)
                </label>
                <select
                  value={autoBackupInterval}
                  onChange={(e) => setAutoBackupInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={6}>Every 6 hours</option>
                  <option value={12}>Every 12 hours</option>
                  <option value={24}>Daily</option>
                  <option value={48}>Every 2 days</option>
                  <option value={168}>Weekly</option>
                </select>
              </div>
            )}

            <button
              onClick={saveAutoBackupSettings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Current Data Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Current Data
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-400">
          <div>
            <span className="font-medium">Patients:</span> {patients.length}
          </div>
          <div>
            <span className="font-medium">Doctors:</span> {doctors.length}
          </div>
          <div>
            <span className="font-medium">Est. Size:</span> {estimatedSize}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isCreating ? (
            <>
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Create Backup
            </>
          )}
        </button>

        <button
          onClick={handleExportBackup}
          disabled={!currentBackup}
          className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Backup
        </button>

        <label className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center cursor-pointer">
          <Upload className="w-5 h-5 mr-2" />
          Import Backup
          <input
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </label>
      </div>

      {/* Restore Button */}
      {currentBackup && (
        <div className="mb-6">
          <button
            onClick={handleRestoreBackup}
            disabled={isRestoring}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isRestoring ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Restore Backup ({currentBackup.metadata.itemCount.patients} patients, {currentBackup.metadata.itemCount.doctors} doctors)
              </>
            )}
          </button>
        </div>
      )}

      {/* Backup History */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Backup History
          </h3>
          {backupHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear History
            </button>
          )}
        </div>

        {backupHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No backup history yet</p>
            <p className="text-sm">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {backupHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(entry.timestamp)}
                    </span>
                    {entry.autoBackup && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                        Auto
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {BackupService.formatSize(entry.size)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Patients:</span> {entry.itemCount.patients}
                  </div>
                  <div>
                    <span className="font-medium">Doctors:</span> {entry.itemCount.doctors}
                  </div>
                  <div>
                    <span className="font-medium">Encryption:</span> {entry.encryptionAlgorithm}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataBackupManager;
