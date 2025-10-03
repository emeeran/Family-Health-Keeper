import React, { useState, useEffect } from 'react';
import { BackupManager, BackupData, BackupOptions, RestoreOptions, BackupSchedule, RestoreResult } from '../utils/backup';
import { Patient, Doctor } from '../types';
import { AccessibleButton } from './ui/AccessibleButton';
import { LoadingSpinner } from './ui/LoadingSpinner';
import ConfirmationDialog from './ui/ConfirmationDialog';

interface BackupManagerProps {
  patients: Patient[];
  doctors: Doctor[];
  onRestoreComplete: (patients: Patient[], doctors: Doctor[]) => void;
}

export const BackupManagerComponent: React.FC<BackupManagerProps> = ({
  patients,
  doctors,
  onRestoreComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeImages: false,
    compression: true,
    encryption: false
  });
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    mergeStrategy: 'merge',
    validateData: true,
    backupBeforeRestore: true
  });
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  useEffect(() => {
    loadSchedules();
    checkScheduledBackups();
  }, []);

  const loadSchedules = () => {
    setSchedules(BackupManager.getSchedules());
  };

  const checkScheduledBackups = () => {
    const dueSchedules = BackupManager.checkScheduledBackups();
    if (dueSchedules.length > 0) {
      // Process due backups
      dueSchedules.forEach(schedule => {
        if (schedule.enabled) {
          createScheduledBackup(schedule);
        }
      });
      loadSchedules();
    }
  };

  const createScheduledBackup = async (schedule: BackupSchedule) => {
    try {
      const backup = await BackupManager.createBackup(patients, doctors, {
        includeImages: schedule.includeImages,
        compression: schedule.compression,
        encryption: schedule.encryption,
        password: schedule.password
      });
      await BackupManager.saveBackupLocally(backup, `scheduled-${schedule.name}-${Date.now()}.json`);
    } catch (error) {
      console.error('Scheduled backup failed:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const backup = await BackupManager.createBackup(patients, doctors, backupOptions);
      await BackupManager.saveBackupLocally(backup);

      showConfirmationDialog(
        'Backup Created',
        'Backup has been created and saved successfully.',
        () => {},
        'success'
      );
    } catch (error) {
      showConfirmationDialog(
        'Backup Failed',
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        () => {},
        'danger'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsLoading(true);
    try {
      const backup = await BackupManager.createBackup(patients, doctors, backupOptions);
      BackupManager.downloadBackup(backup);
    } catch (error) {
      showConfirmationDialog(
        'Download Failed',
        `Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
        () => {},
        'danger'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const backupData = await BackupManager.loadBackupFromFile(file);

      showConfirmationDialog(
        'Confirm Restore',
        `Are you sure you want to restore from backup? This will modify your current data.`,
        () => performRestore(backupData),
        'warning'
      );
    } catch (error) {
      showConfirmationDialog(
        'Invalid File',
        `Failed to load backup file: ${error instanceof Error ? error.message : 'Invalid file format'}`,
        () => {},
        'danger'
      );
    } finally {
      setIsLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const performRestore = async (backupData: BackupData) => {
    setIsLoading(true);
    try {
      const result = await BackupManager.restoreFromBackup(
        backupData,
        patients,
        doctors,
        restoreOptions
      );

      if (result.success) {
        // Get the restored data
        const restoredResult = await BackupManager.restoreFromBackup(
          backupData,
          patients,
          doctors,
          { ...restoreOptions, backupBeforeRestore: false }
        );

        if (restoredResult.success) {
          // For demo purposes, we'll simulate the restored data
          // In a real implementation, this would come from the restore result
          onRestoreComplete(backupData.patients, backupData.doctors);
        }

        showConfirmationDialog(
          'Restore Complete',
          `Data restored successfully.\nPatients added: ${result.patientsAdded}\nPatients updated: ${result.patientsUpdated}\nDoctors added: ${result.doctorsAdded}\nDoctors updated: ${result.doctorsUpdated}`,
          () => {},
          'success'
        );
      } else {
        showConfirmationDialog(
          'Restore Failed',
          `Failed to restore data: ${result.message}`,
          () => {},
          'danger'
        );
      }
    } catch (error) {
      showConfirmationDialog(
        'Restore Error',
        `An error occurred during restore: ${error instanceof Error ? error.message : 'Unknown error'}`,
        () => {},
        'danger'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    const newSchedule = BackupManager.createSchedule({
      name: `Daily Backup ${new Date().toLocaleDateString()}`,
      frequency: 'daily',
      time: '02:00',
      includeImages: false,
      compression: true,
      encryption: false,
      enabled: true
    });

    setSchedules(BackupManager.getSchedules());
    showConfirmationDialog(
      'Schedule Created',
      'Backup schedule has been created successfully.',
      () => {},
      'success'
    );
  };

  const handleToggleSchedule = (scheduleId: string, enabled: boolean) => {
    BackupManager.updateSchedule(scheduleId, { enabled });
    setSchedules(BackupManager.getSchedules());
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    showConfirmationDialog(
      'Delete Schedule',
      'Are you sure you want to delete this backup schedule?',
      () => {
        BackupManager.deleteSchedule(scheduleId);
        setSchedules(BackupManager.getSchedules());
      },
      'danger'
    );
  };

  const showConfirmationDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'info'
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const hideConfirmationDialog = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner size="lg" message="Processing backup/restore..." />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Backup & Restore</h2>

        {/* Backup Options */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium">Backup Options</h3>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupOptions.includeImages}
                onChange={(e) => setBackupOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Include medical images (increases file size)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupOptions.compression}
                onChange={(e) => setBackupOptions(prev => ({ ...prev, compression: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Compress backup data</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupOptions.encryption}
                onChange={(e) => setBackupOptions(prev => ({ ...prev, encryption: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Encrypt backup data</span>
            </label>
          </div>
        </div>

        {/* Backup Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <AccessibleButton
            onClick={handleCreateBackup}
            variant="primary"
            icon="backup"
          >
            Save Backup Locally
          </AccessibleButton>

          <AccessibleButton
            onClick={handleDownloadBackup}
            variant="secondary"
            icon="download"
          >
            Download Backup File
          </AccessibleButton>
        </div>

        {/* Restore Options */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium">Restore Options</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Merge Strategy</label>
              <select
                value={restoreOptions.mergeStrategy}
                onChange={(e) => setRestoreOptions(prev => ({
                  ...prev,
                  mergeStrategy: e.target.value as 'replace' | 'merge' | 'merge-preserve'
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="replace">Replace all data</option>
                <option value="merge">Merge with existing data</option>
                <option value="merge-preserve">Merge, preserve existing entries</option>
              </select>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={restoreOptions.validateData}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Validate data before restore</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={restoreOptions.backupBeforeRestore}
                onChange={(e) => setRestoreOptions(prev => ({ ...prev, backupBeforeRestore: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <span>Create backup before restore</span>
            </label>
          </div>
        </div>

        {/* Restore Actions */}
        <div className="mb-6">
          <label className="block">
            <span className="sr-only">Choose backup file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
        </div>

        {/* Scheduled Backups */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Scheduled Backups</h3>
            <AccessibleButton
              onClick={handleCreateSchedule}
              variant="outline"
              icon="add"
            >
              Create Schedule
            </AccessibleButton>
          </div>

          {schedules.length === 0 ? (
            <p className="text-gray-500 italic">No scheduled backups configured.</p>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{schedule.name}</h4>
                      <p className="text-sm text-gray-600">
                        {schedule.frequency} at {schedule.time}
                      </p>
                      <p className="text-xs text-gray-500">
                        Next backup: {formatDate(schedule.nextBackup)}
                        {schedule.lastBackup && ` • Last: ${formatDate(schedule.lastBackup)}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => handleToggleSchedule(schedule.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Enabled</span>
                      </label>
                      <AccessibleButton
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        variant="ghost"
                        icon="delete"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        onConfirm={() => {
          confirmationDialog.onConfirm();
          hideConfirmationDialog();
        }}
        onCancel={hideConfirmationDialog}
        type={confirmationDialog.type}
      />
    </div>
  );
};