/**
 * Centralized Error Boundary Component
 * Catches React component errors and handles them using the centralized error handler
 * Provides fallback UI and error reporting functionality
 */

import React, { Component, ReactNode } from 'react';
import { centralizedErrorHandler, type UnifiedError, type EnhancedErrorContext } from '../../utils/centralizedErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: UnifiedError) => void;
  component?: string;
  showRetry?: boolean;
  customMessage?: string;
}

interface State {
  hasError: boolean;
  error: UnifiedError | null;
  errorId: string | null;
}

/**
 * Error Boundary Component that integrates with centralized error handling
 */
export class CentralizedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context: EnhancedErrorContext = {
      operation: 'react_component_error',
      component: this.props.component || 'UnknownComponent',
      category: 'ui' as any,
      severity: 'high',
      userFacing: true,
      retryable: this.retryCount < this.maxRetries,
      extra: {
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
        retryCount: this.retryCount,
        errorId: this.state.errorId
      }
    };

    const unifiedError = centralizedErrorHandler.handleError(error, context, {
      showUserMessage: false, // Let the error boundary handle the UI
      logError: true,
      callbackKey: 'error-boundary'
    });

    this.setState({ error: unifiedError });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(unifiedError);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorId: null
      });
    }
  };

  handleReportError = () => {
    if (this.state.error) {
      // In a real app, this would open a bug report form or send to support
      const errorDetails = {
        message: this.state.error.message,
        context: this.state.error.context,
        timestamp: this.state.error.timestamp,
        stackTrace: this.state.error.stackTrace
      };
      
      console.log('Error reported:', errorDetails);
      alert('Error details have been logged to console. Please include this information when reporting issues.');
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="error-boundary-fallback p-6 max-w-md mx-auto bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                error
              </span>
            </div>
            
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-red-600 dark:text-red-300 mb-6">
              {this.props.customMessage || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                  Error ID: {this.state.errorId}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {this.state.error.context.category} - {this.state.error.severity}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.props.showRetry && this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Try Again ({this.maxRetries - this.retryCount} attempts left)
                </button>
              )}
              
              <button
                onClick={this.handleReportError}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Report Error
              </button>
            </div>

            {this.retryCount >= this.maxRetries && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                Maximum retry attempts reached. Please refresh the page.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: UnifiedError) => void;
    component?: string;
    showRetry?: boolean;
    customMessage?: string;
  }
) => {
  const WrappedComponent = (props: P) => (
    <CentralizedErrorBoundary {...options}>
      <Component {...props} />
    </CentralizedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

/**
 * HOC for adding error boundary to class components
 */
export function errorBoundary<T extends React.ComponentType<any>>(
  options?: {
    fallback?: ReactNode;
    onError?: (error: UnifiedError) => void;
    component?: string;
    showRetry?: boolean;
    customMessage?: string;
  }
) {
  return function<P>(WrappedComponent: React.ComponentType<P>) {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    
    return class WithErrorBoundary extends Component<P> {
      static displayName = `errorBoundary(${displayName})`;

      render() {
        return (
          <CentralizedErrorBoundary 
            {...options}
            component={options?.component || displayName}
          >
            <WrappedComponent {...this.props} />
          </CentralizedErrorBoundary>
        );
      }
    };
  };
}

export default CentralizedErrorBoundary;