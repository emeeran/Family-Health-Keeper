import React, { useState } from 'react';
import { simpleAuthService, type SimpleAuthState } from '../services/simpleAuthService';

interface SimpleLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const SimpleLogin: React.FC<SimpleLoginProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authState, setAuthState] = useState<SimpleAuthState>(simpleAuthService.getAuthState());
  const [error, setError] = useState('');

  // Subscribe to auth state changes and clear any existing auto-login
  React.useEffect(() => {
    // Clear any existing authentication data to prevent auto-login
    localStorage.removeItem('simple_auth_user');
    localStorage.removeItem('simple_auth_authenticated');

    const unsubscribe = simpleAuthService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  React.useEffect(() => {
    if (authState.isAuthenticated) {
      onLoginSuccess();
      onClose();
    }
  }, [authState.isAuthenticated, onLoginSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await simpleAuthService.login(email, password);

    if (!result.success) {
      setError(result.message);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);

    const result = await simpleAuthService.login(userEmail, userPassword);

    if (!result.success) {
      setError(result.message);
    }
  };

  if (isOpen && !authState.isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Family Health Keeper
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <div className="flex items-center">
                <span className="material-symbols-outlined mr-2">error</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
                disabled={authState.isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your password"
                disabled={authState.isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={authState.isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authState.isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="space-y-3">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-3">
              Quick Access:
            </div>

            <button
              onClick={() => handleQuickLogin('emeeranjp@gmail.com', 'Jeny13y@fhk')}
              disabled={authState.isLoading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Admin Login
            </button>

            <button
              onClick={() => handleQuickLogin('user@familyhealth.com', 'password123')}
              disabled={authState.isLoading}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Demo User Login
            </button>
          </div>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="text-xs space-y-1">
                <li>• Click "Admin Login" for full access</li>
                <li>• Click "Demo User" for basic access</li>
                <li>• Or enter any email + 6+ character password</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SimpleLogin;