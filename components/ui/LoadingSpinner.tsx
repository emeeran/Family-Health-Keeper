import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  message
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const variantClasses = {
    primary: 'border-blue-600',
    secondary: 'border-gray-600',
    white: 'border-white'
  };

  const textClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-transparent border-t-current ${sizeClasses[size]} ${variantClasses[variant]}`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <span className={`ml-3 text-sm font-medium ${textClasses[variant]}`}>
          {message}
        </span>
      )}
    </div>
  );
};

// Full page loader
export const FullPageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </div>
  );
};

// Skeleton loader for content
export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded"
          style={{
            height: index === lines - 1 ? '1rem' : '1.5rem',
            width: index === lines - 1 ? '60%' : '100%'
          }}
        />
      ))}
    </div>
  );
};

// Card skeleton loader
export const CardSkeletonLoader: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-3/4"></div>
          <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-3 w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-3 w-full"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-3 w-5/6"></div>
      </div>
    </div>
  );
};

// List skeleton loader
export const ListSkeletonLoader: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeletonLoader key={index} />
      ))}
    </div>
  );
};