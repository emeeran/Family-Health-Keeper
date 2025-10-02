import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingBoundaryProps {
  loading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  skeleton?: React.ReactNode;
  errorMessage?: string;
  showError?: boolean;
  retry?: () => void;
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  loading,
  error = null,
  children,
  fallback,
  skeleton = (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  ),
  errorMessage = 'An error occurred while loading the content.',
  showError = true,
  retry,
}) => {
  if (loading) {
    return fallback || skeleton;
  }

  if (error && showError) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export const PageLoadingBoundary: React.FC<{
  loading: boolean;
  children: React.ReactNode;
}> = ({ loading, children }) => {
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <LoadingSpinner size="lg" message="Loading page..." />
      </div>
    );
  }

  return <>{children}</>;
};

export const SectionLoadingBoundary: React.FC<{
  loading: boolean;
  height?: string;
  children: React.ReactNode;
}> = ({ loading, height = 'h-32', children }) => {
  if (loading) {
    return (
      <div className={`${height} flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg`}>
        <LoadingSpinner size="md" message="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
};