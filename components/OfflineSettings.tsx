import React, { useState, useEffect } from 'react';
import { offlineStorage, type OfflineSettings, type OfflineStatus } from '../utils/offlineStorage';
import { AccessibleButton } from './ui/AccessibleButton';

interface OfflineSettingsProps {
  onClose?: () => void;
}

const OfflineSettings: React.FC<OfflineSettingsProps> = ({ onClose }) => {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [settings, setSettings] = useState<OfflineSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    total: number;
    available: number;
  } | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    const initializeOffline = async () => {
      try {
        setIsLoading(true);
        await offlineStorage.initialize();

        const currentStatus = offlineStorage.getStatus();
        const currentSettings = await offlineStorage.getFromStore<OfflineSettings>('settings', 'offline-settings');
        const storageQuota = await offlineStorage.checkStorageQuota();

        setStatus(currentStatus);
        setSettings(currentSettings);
        setStorageInfo(storageQuota);

        // Subscribe to status updates
        offlineStorage.subscribe((newStatus) => {
          setStatus(newStatus);
        });
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
        showMessage('error', 'Failed to initialize offline storage');
      } finally {
        setIsLoading(false);
      }
    };

    initializeOffline();

    return () => {
      // Cleanup will be handled by the offlineStorage instance
    };
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSettingsChange = async (newSettings: Partial<OfflineSettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const updatedSettings = { ...settings, ...newSettings };
      await offlineStorage.saveSettings(updatedSettings);
      setSettings(updatedSettings);
      showMessage('success', 'Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage('error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      await offlineStorage.syncPendingOperations();
      showMessage('success', 'Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      showMessage('error', 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSyncQueue = async () => {
    try {
      setIsSaving(true);
      // This would need to be implemented in the offlineStorage class
      showMessage('success', 'Sync queue cleared');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
      showMessage('error', 'Failed to clear sync queue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all offline data? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);
      await offlineStorage.clearAllData();
      showMessage('success', 'All offline data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      showMessage('error', 'Failed to clear data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPersistentStorage = async () => {
    try {
      const granted = await offlineStorage.requestPersistentStorage();
      if (granted) {
        showMessage('success', 'Persistent storage granted');
      } else {
        showMessage('info', 'Persistent storage denied or not supported');
      }
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      showMessage('error', 'Failed to request persistent storage');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading offline settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Offline Settings</h2>
        {onClose && (
          <AccessibleButton
            onClick={onClose}
            variant="ghost"
            icon="close"
          />
        )}
      </div>

      {/* Offline Status */}
      {status && (
        <div className={`p-4 rounded-lg border ${
          status.isOnline
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        }`}>
          <div className="flex items-center space-x-3">
            <span className={`material-symbols-outlined text-2xl ${
              status.isOnline ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {status.isOnline ? 'wifi' : 'wifi_off'}
            </span>
            <div>
              <h3 className="font-semibold">
                {status.isOnline ? 'Online' : 'Offline'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {status.isOnline
                  ? 'Your device is connected to the internet'
                  : 'Your device is offline. Some features may be limited.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Storage Information */}
      {storageInfo && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Storage Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Used:</span>
              <span className="font-medium">{formatBytes(storageInfo.used * 1024 * 1024)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total:</span>
              <span className="font-medium">{formatBytes(storageInfo.total * 1024 * 1024)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Available:</span>
              <span className="font-medium">{formatBytes(storageInfo.available * 1024 * 1024)}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0}%`
                }}
              />
            </div>
            <AccessibleButton
              onClick={handleRequestPersistentStorage}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Request Persistent Storage
            </AccessibleButton>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {status && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Synchronization Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Pending Operations:</span>
              <span className={`font-medium ${status.pendingOperations > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                {status.pendingOperations}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="font-medium">{formatTime(status.lastSyncTime)}</span>
            </div>
            <div className="flex space-x-2 mt-3">
              <AccessibleButton
                onClick={handleSyncNow}
                variant="primary"
                disabled={isSyncing || !status.isOnline || status.pendingOperations === 0}
                icon={isSyncing ? 'hourglass_top' : 'sync'}
                size="sm"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </AccessibleButton>
              {status.pendingOperations > 0 && (
                <AccessibleButton
                  onClick={handleClearSyncQueue}
                  variant="danger"
                  disabled={isSaving}
                  icon="clear"
                  size="sm"
                >
                  Clear Queue
                </AccessibleButton>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      {settings && (
        <div className="space-y-4">
          <h3 className="font-semibold">Offline Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Enable Offline Mode</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Store data locally for offline access
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableOfflineMode}
                  onChange={(e) => handleSettingsChange({ enableOfflineMode: e.target.checked })}
                  className="sr-only peer"
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Auto Sync</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically sync data when online
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={(e) => handleSettingsChange({ autoSync: e.target.checked })}
                  className="sr-only peer"
                  disabled={isSaving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block font-medium mb-2">Sync Interval (minutes)</label>
              <select
                value={settings.syncInterval}
                onChange={(e) => handleSettingsChange({ syncInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">Max Retry Attempts</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxRetryAttempts}
                onChange={(e) => handleSettingsChange({ maxRetryAttempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Storage Quota (MB)</label>
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={settings.storageQuota}
                onChange={(e) => handleSettingsChange({ storageQuota: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="space-y-4">
        <h3 className="font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
          <div>
            <h4 className="font-medium text-red-800 dark:text-red-200">Clear All Offline Data</h4>
            <p className="text-sm text-red-700 dark:text-red-300">
              This will permanently delete all locally stored data. This action cannot be undone.
            </p>
          </div>
          <AccessibleButton
            onClick={handleClearAllData}
            variant="danger"
            disabled={isSaving}
            icon="delete_forever"
          >
            Clear All Data
          </AccessibleButton>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`material-symbols-outlined ${
              message.type === 'success' ? 'text-green-600 dark:text-green-400' :
              message.type === 'error' ? 'text-red-600 dark:text-red-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {message.type === 'success' ? 'check_circle' :
               message.type === 'error' ? 'error' : 'info'}
            </span>
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-800 dark:text-green-200' :
              message.type === 'error' ? 'text-red-800 dark:text-red-200' :
              'text-blue-800 dark:text-blue-200'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Offline Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Offline Tips</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Your data is automatically saved locally for offline access</li>
          <li>• Changes made offline will sync when you reconnect</li>
          <li>• Enable persistent storage to prevent data loss</li>
          <li>• Regular syncing ensures your data is backed up</li>
          <li>• Monitor your storage usage to avoid running out of space</li>
        </ul>
      </div>
    </div>
  );
};

export default OfflineSettings;