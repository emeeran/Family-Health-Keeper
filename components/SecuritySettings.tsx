import React, { useState, useEffect } from 'react';
import { useEncryptedStore } from '../stores/encryptedStore';
import PasswordManager from './PasswordManager';
import { AccessibleButton } from './ui/AccessibleButton';
import { EncryptionManager } from '../utils/encryption';

interface SecuritySettingsProps {
  onClose?: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onClose }) => {
  const {
    isEncrypted,
    encryptionPassword,
    encryptionKey,
    lastEncryptionUpdate,
    setEncryptionPassword,
    removeEncryption,
    changeEncryptionPassword,
    verifyPassword,
    encryptAndSave,
    decryptAndLoad,
    isEncryptionAvailable
  } = useEncryptedStore();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);
  const [testPassword, setTestPassword] = useState('');
  const [showTestPassword, setShowTestPassword] = useState(false);
  const [encryptionInfo, setEncryptionInfo] = useState<{
    algorithm: string;
    keySize: number;
    ivSize: number;
    blockMode: string;
  } | null>(null);

  useEffect(() => {
    // Get encryption algorithm info
    if (isEncryptionAvailable()) {
      setEncryptionInfo(EncryptionManager.getAlgorithmInfo());
    }
  }, []);

  const showStatus = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 5000);
  };

  const handlePasswordSet = async (password: string) => {
    setIsLoading(true);
    try {
      setEncryptionPassword(password);
      showStatus('success', 'Password protection enabled successfully!');
    } catch (error) {
      showStatus('error', 'Failed to set password protection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (oldPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const success = await changeEncryptionPassword(oldPassword, newPassword);
      if (success) {
        showStatus('success', 'Password changed successfully!');
      } else {
        showStatus('error', 'Failed to change password. Please check your current password.');
      }
    } catch (error) {
      showStatus('error', 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRemove = () => {
    setIsLoading(true);
    try {
      removeEncryption();
      showStatus('success', 'Password protection removed successfully!');
    } catch (error) {
      showStatus('error', 'Failed to remove password protection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPassword = async () => {
    if (!testPassword) {
      showStatus('error', 'Please enter a password to test.');
      return;
    }

    setIsLoading(true);
    try {
      const isValid = await verifyPassword(testPassword);
      if (isValid) {
        showStatus('success', 'Password is correct!');
      } else {
        showStatus('error', 'Password is incorrect.');
      }
    } catch (error) {
      showStatus('error', 'Failed to verify password.');
    } finally {
      setIsLoading(false);
      setTestPassword('');
    }
  };

  const handleEncryptData = async () => {
    if (!encryptionPassword) {
      showStatus('error', 'No password set. Please set a password first.');
      return;
    }

    setIsLoading(true);
    try {
      // Import the app store to get current data
      const { useAppStore } = await import('../stores/useAppStore');
      const { patients, doctors } = useAppStore.getState();

      const success = await encryptAndSave(patients, doctors);
      if (success) {
        showStatus('success', 'Data encrypted successfully!');
      } else {
        showStatus('error', 'Failed to encrypt data.');
      }
    } catch (error) {
      showStatus('error', 'Failed to encrypt data.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  if (!isEncryptionAvailable()) {
    return (
      <div className="p-6">
        <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Encryption Not Available
          </h3>
          <p className="text-red-700 dark:text-red-300">
            Your browser does not support the Web Crypto API required for encryption.
            Please use a modern browser like Chrome, Firefox, Safari, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Security Settings</h2>
        {onClose && (
          <AccessibleButton
            onClick={onClose}
            variant="ghost"
            icon="close"
          />
        )}
      </div>

      {/* Security Status */}
      <div className={`p-4 rounded-lg border ${
        isEncrypted
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}>
        <div className="flex items-center space-x-3">
          <span className={`material-symbols-outlined text-2xl ${
            isEncrypted ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {isEncrypted ? 'security' : 'warning'}
          </span>
          <div>
            <h3 className="font-semibold">
              {isEncrypted ? 'Data is Encrypted' : 'Data is Not Encrypted'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isEncrypted
                ? 'Your medical data is protected with encryption.'
                : 'Your data is stored in plain text. Consider enabling password protection.'}
            </p>
          </div>
        </div>
      </div>

      {/* Encryption Info */}
      {encryptionInfo && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Encryption Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Algorithm:</span> {encryptionInfo.algorithm}
            </div>
            <div>
              <span className="font-medium">Key Size:</span> {encryptionInfo.keySize} bits
            </div>
            <div>
              <span className="font-medium">IV Size:</span> {encryptionInfo.ivSize} bits
            </div>
            <div>
              <span className="font-medium">Block Mode:</span> {encryptionInfo.blockMode}
            </div>
          </div>
        </div>
      )}

      {/* Password Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <PasswordManager
          onPasswordSet={handlePasswordSet}
          onPasswordChange={handlePasswordChange}
          onPasswordRemove={handlePasswordRemove}
          hasExistingPassword={!!encryptionPassword}
          isDisabled={isLoading}
        />
      </div>

      {/* Additional Security Features */}
      <div className="space-y-4">
        <h3 className="font-semibold">Additional Security Features</h3>

        {/* Test Password */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">Test Password</h4>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <input
                type={showTestPassword ? 'text' : 'password'}
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Enter password to test"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowTestPassword(!showTestPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-sm">
                  {showTestPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <AccessibleButton
              onClick={handleTestPassword}
              variant="outline"
              disabled={isLoading || !testPassword}
            >
              Test
            </AccessibleButton>
          </div>
        </div>

        {/* Last Update */}
        {lastEncryptionUpdate && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium mb-2">Security Information</h4>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Last Password Change:</span>{' '}
                {formatDate(lastEncryptionUpdate)}
              </div>
              <div>
                <span className="font-medium">Password Set:</span>{' '}
                {encryptionPassword ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}

        {/* Encrypt Data Button */}
        {encryptionPassword && (
          <AccessibleButton
            onClick={handleEncryptData}
            variant="primary"
            disabled={isLoading}
            icon="lock"
            className="w-full"
          >
            {isLoading ? 'Encrypting...' : 'Encrypt All Data Now'}
          </AccessibleButton>
        )}
      </div>

      {/* Status Messages */}
      {status && (
        <div className={`p-4 rounded-lg border ${
          status.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          status.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
          status.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`material-symbols-outlined ${
              status.type === 'success' ? 'text-green-600 dark:text-green-400' :
              status.type === 'error' ? 'text-red-600 dark:text-red-400' :
              status.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {status.type === 'success' ? 'check_circle' :
               status.type === 'error' ? 'error' :
               status.type === 'warning' ? 'warning' : 'info'}
            </span>
            <p className={`text-sm ${
              status.type === 'success' ? 'text-green-800 dark:text-green-200' :
              status.type === 'error' ? 'text-red-800 dark:text-red-200' :
              status.type === 'warning' ? 'text-yellow-800 dark:text-yellow-200' :
              'text-blue-800 dark:text-blue-200'
            }`}>
              {status.message}
            </p>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Security Tips</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Use a strong, unique password that you don't use elsewhere</li>
          <li>• Consider using a password manager to generate and store your password</li>
          <li>• Never share your password with anyone</li>
          <li>• Change your password periodically</li>
          <li>• Keep your browser and operating system updated</li>
        </ul>
      </div>
    </div>
  );
};

export default SecuritySettings;