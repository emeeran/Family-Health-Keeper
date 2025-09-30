import React, { useState, useEffect } from 'react';
import { secureStorage } from '../services/secureStorageService';

interface SecurityStatus {
  isActiveSession: boolean;
  lockoutStatus: boolean;
  failedAttempts: number;
  encryptionEnabled: boolean;
  lastActivity: Date | null;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const SecurityDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [newEncryptionKey, setNewEncryptionKey] = useState('');
  const [showKeyChange, setShowKeyChange] = useState(false);

  useEffect(() => {
    if (isOpen) {
      updateSecurityStatus();
      updateAuditLog();
    }
  }, [isOpen]);

  const updateSecurityStatus = () => {
    const status = secureStorage.getSecurityStatus();
    setSecurityStatus(status);
  };

  const updateAuditLog = () => {
    const log = secureStorage.getAuditLog().slice(-20).reverse(); // Show last 20 entries
    setAuditLog(log);
  };

  const handleRefresh = () => {
    updateSecurityStatus();
    updateAuditLog();
  };

  const handleLogout = () => {
    secureStorage.logout();
    setIsOpen(false);
    // Force page reload to clear any sensitive data
    window.location.reload();
  };

  const handleChangeEncryptionKey = async () => {
    if (!newEncryptionKey || newEncryptionKey.length < 16) {
      alert('Encryption key must be at least 16 characters long.');
      return;
    }

    try {
      await secureStorage.changeEncryptionKey(newEncryptionKey);
      alert('Encryption key changed successfully!');
      setNewEncryptionKey('');
      setShowKeyChange(false);
      updateSecurityStatus();
    } catch (error) {
      alert('Failed to change encryption key. Please try again.');
    }
  };

  const handleDataIntegrityCheck = async () => {
    const isValid = await secureStorage.validateDataIntegrity();
    alert(`Data integrity check: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
    updateAuditLog();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-colors duration-200"
        title="Security Dashboard"
      >
        <span className="material-symbols-outlined">security</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Security Dashboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Monitor and manage application security
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Refresh"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Security Status */}
          <div className="w-1/3 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Security Status
            </h3>

            {securityStatus && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Session Status
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      securityStatus.isActiveSession
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {securityStatus.isActiveSession ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Account Lockout
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      securityStatus.lockoutStatus
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    }`}>
                      {securityStatus.lockoutStatus ? 'Locked' : 'Normal'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Encryption
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      securityStatus.encryptionEnabled
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                    }`}>
                      {securityStatus.encryptionEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {securityStatus.lastActivity && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      Last Activity
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                      {formatTimestamp(securityStatus.lastActivity)}
                    </span>
                  </div>
                )}

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                    Failed Attempts
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 block">
                    {securityStatus.failedAttempts} / 5
                  </span>
                </div>
              </div>
            )}

            {/* Security Actions */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Security Actions
              </h4>

              <button
                onClick={handleDataIntegrityCheck}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">verified</span>
                Check Data Integrity
              </button>

              <button
                onClick={() => setShowKeyChange(!showKeyChange)}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">key</span>
                Change Encryption Key
              </button>

              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Secure Logout
              </button>
            </div>

            {/* Change Encryption Key Form */}
            {showKeyChange && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h5 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Change Encryption Key
                </h5>
                <input
                  type="password"
                  value={newEncryptionKey}
                  onChange={(e) => setNewEncryptionKey(e.target.value)}
                  placeholder="Enter new encryption key (min 16 chars)"
                  className="w-full px-3 py-2 text-sm border border-yellow-300 dark:border-yellow-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleChangeEncryptionKey}
                    className="flex-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                  >
                    Update Key
                  </button>
                  <button
                    onClick={() => {
                      setShowKeyChange(false);
                      setNewEncryptionKey('');
                    }}
                    className="flex-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Audit Log */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Audit Log
            </h3>

            {auditLog.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-400">history</span>
                <p className="text-gray-600 dark:text-gray-400 mt-2">No audit events recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getSeverityColor(entry.severity)}`}>
                            {entry.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.action}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {entry.details}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>🔒 All data is encrypted and stored locally</span>
            <span>Session auto-locks after 30 minutes of inactivity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;