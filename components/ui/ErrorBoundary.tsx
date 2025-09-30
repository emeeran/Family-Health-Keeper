import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">
                  error
                </span>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h2>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                    <div className="font-semibold mb-1">Error:</div>
                    <div className="mb-2">{this.state.error?.toString()}</div>
                    <div className="font-semibold mb-1">Component Stack:</div>
                    <div className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</div>
                  </div>
                </details>
              )}

              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  return captureError;
}

// Wrapper component for hook-based error handling
export const ErrorBoundaryFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-red-600 dark:text-red-400">
          error
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            Component Error
          </h3>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">
            {error.message}
          </p>
        </div>
        <button
          onClick={resetError}
          className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};