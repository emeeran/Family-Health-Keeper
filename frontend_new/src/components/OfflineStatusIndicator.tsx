import React, { useState, useEffect } from 'react';
import { offlineStorage, type OfflineStatus } from '../utils/offlineStorage';

interface OfflineStatusIndicatorProps {
  onClick?: () => void;
}

const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({ onClick }) => {
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const initializeStatus = async () => {
      try {
        await offlineStorage.initialize();
        const currentStatus = offlineStorage.getStatus();
        setStatus(currentStatus);

        // Subscribe to status updates
        offlineStorage.subscribe((newStatus) => {
          setStatus(newStatus);
        });

        // Show offline status when going offline
        if (!currentStatus.isOnline) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Failed to initialize offline status:', error);
      }
    };

    initializeStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setIsVisible(false);
      setTimeout(() => setIsVisible(false), 3000); // Hide after 3 seconds when online
    };

    const handleOffline = () => {
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Toggle visibility
      setIsVisible(!isVisible);
    }
  };

  if (!status) {
    return null;
  }

  return (
    <>
      {/* Status Indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          onClick={handleClick}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            status.isOnline
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          } ${status.hasPendingSync ? 'animate-pulse' : ''}`}
        >
          <span className="material-symbols-outlined text-sm">
            {status.isOnline ? (status.hasPendingSync ? 'sync' : 'wifi') : 'wifi_off'}
          </span>
          <span className="text-sm font-medium">
            {status.isOnline ? (status.hasPendingSync ? 'Syncing...' : 'Online') : 'Offline'}
          </span>
          {status.pendingOperations > 0 && (
            <span className="bg-white text-gray-800 text-xs px-2 py-1 rounded-full">
              {status.pendingOperations}
            </span>
          )}
        </button>
      </div>

      {/* Expanded Status Panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-40 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Connection Status</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`material-symbols-outlined text-2xl ${
                status.isOnline ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
              }`}>
                {status.isOnline ? 'wifi' : 'wifi_off'}
              </span>
              <div>
                <p className="font-medium">
                  {status.isOnline ? 'Connected to Internet' : 'Offline Mode'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {status.isOnline
                    ? 'All features are available'
                    : 'Working with locally stored data'
                  }
                </p>
              </div>
            </div>

            {status.hasPendingSync && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">sync</span>
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      {status.pendingOperations} pending sync operations
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Changes will sync when you reconnect
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status.lastSyncTime && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last sync: {new Date(status.lastSyncTime).toLocaleString()}
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Trigger sync
                  offlineStorage.syncPendingOperations();
                }}
                disabled={!status.isOnline || !status.hasPendingSync}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                  status.isOnline && status.hasPendingSync
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Sync Now
              </button>
              <button
                onClick={() => {
                  // Open offline settings
                  setIsVisible(false);
                  if (onClick) onClick();
                }}
                className="px-3 py-2 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OfflineStatusIndicator;