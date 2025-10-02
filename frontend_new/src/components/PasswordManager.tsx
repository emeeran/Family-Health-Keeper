import React, { useState, useEffect } from 'react';
import { EncryptionManager } from '../utils/encryption';
import { AccessibleButton } from './ui/AccessibleButton';

interface PasswordManagerProps {
  onPasswordSet: (password: string) => void;
  onPasswordChange?: (oldPassword: string, newPassword: string) => void;
  onPasswordRemove?: () => void;
  hasExistingPassword?: boolean;
  isDisabled?: boolean;
}

const PasswordManager: React.FC<PasswordManagerProps> = ({
  onPasswordSet,
  onPasswordChange,
  onPasswordRemove,
  hasExistingPassword = false,
  isDisabled = false
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'set' | 'change' | 'remove'>('set');

  const passwordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let strength = 0;

    // Length
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;

    // Character variety
    if (/[a-z]/.test(pwd)) strength += 10;
    if (/[A-Z]/.test(pwd)) strength += 10;
    if (/[0-9]/.test(pwd)) strength += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 20;

    return Math.min(strength, 100);
  };

  const getStrengthColor = (strength: number): string => {
    if (strength < 30) return 'text-red-600';
    if (strength < 60) return 'text-yellow-600';
    if (strength < 80) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStrengthText = (strength: number): string => {
    if (strength < 30) return 'Very Weak';
    if (strength < 60) return 'Weak';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const handleGeneratePassword = async () => {
    setIsGenerating(true);
    try {
      const newPassword = EncryptionManager.generateSecurePassword(16);
      setGeneratedPassword(newPassword);
      setPassword(newPassword);
      setConfirmPassword(newPassword);
      setSuccess('Secure password generated! Please save it in a safe place.');
      setError('');
    } catch (err) {
      setError('Failed to generate password. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetPassword = () => {
    setError('');
    setSuccess('');

    if (mode === 'change' && !currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const strength = passwordStrength(password);
    if (strength < 60) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }

    try {
      if (mode === 'change' && onPasswordChange) {
        onPasswordChange(currentPassword, password);
        setSuccess('Password changed successfully!');
      } else {
        onPasswordSet(password);
        setSuccess('Password set successfully!');
      }

      // Reset form
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setGeneratedPassword('');
    } catch (err) {
      setError('Failed to set password. Please try again.');
    }
  };

  const handleRemovePassword = () => {
    if (onPasswordRemove) {
      onPasswordRemove();
      setSuccess('Password protection removed!');
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setGeneratedPassword('');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Password copied to clipboard!');
    } catch (err) {
      setError('Failed to copy password to clipboard');
    }
  };

  useEffect(() => {
    if (hasExistingPassword) {
      setMode('change');
    } else {
      setMode('set');
    }
  }, [hasExistingPassword]);

  useEffect(() => {
    // Clear messages after 5 seconds
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [error, success]);

  const strength = passwordStrength(password);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {hasExistingPassword ? 'Password Protection' : 'Set Password Protection'}
        </h3>
        {hasExistingPassword && (
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('change')}
              className={`px-3 py-1 rounded-md text-sm ${
                mode === 'change'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Change
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`px-3 py-1 rounded-md text-sm ${
                mode === 'remove'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {mode === 'remove' ? (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to remove password protection? This will make your data accessible without a password.
          </p>
          <div className="flex space-x-3">
            <AccessibleButton
              onClick={handleRemovePassword}
              variant="danger"
              disabled={isDisabled}
            >
              Remove Password Protection
            </AccessibleButton>
            <AccessibleButton
              onClick={() => setMode('change')}
              variant="secondary"
            >
              Cancel
            </AccessibleButton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {mode === 'change' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={isDisabled}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showCurrentPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'change' ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isDisabled}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {password && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getStrengthColor(strength)}`}>
                    Strength: {getStrengthText(strength)}
                  </span>
                  <span className="text-sm text-gray-500">{strength}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      strength < 30 ? 'bg-red-500' :
                      strength < 60 ? 'bg-yellow-500' :
                      strength < 80 ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isDisabled}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-sm">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <AccessibleButton
              onClick={handleGeneratePassword}
              variant="secondary"
              disabled={isDisabled || isGenerating}
              icon={isGenerating ? 'hourglass_top' : 'password'}
            >
              {isGenerating ? 'Generating...' : 'Generate Secure Password'}
            </AccessibleButton>

            {generatedPassword && (
              <AccessibleButton
                onClick={() => copyToClipboard(generatedPassword)}
                variant="outline"
                icon="content_copy"
              >
                Copy Password
              </AccessibleButton>
            )}
          </div>

          <AccessibleButton
            onClick={handleSetPassword}
            variant="primary"
            disabled={isDisabled || !password || !confirmPassword}
            className="w-full"
          >
            {mode === 'change' ? 'Change Password' : 'Set Password'}
          </AccessibleButton>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p className="font-medium mb-1">Password Requirements:</p>
        <ul className="space-y-1">
          <li>• At least 8 characters long</li>
          <li>• Mix of uppercase and lowercase letters</li>
          <li>• Include numbers and special characters</li>
          <li>• Password strength should be at least "Good"</li>
        </ul>
      </div>
    </div>
  );
};

export default PasswordManager;