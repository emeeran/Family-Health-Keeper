/**
 * Centralized Error Handling System
 * Integrates and unifies error handling across the application
 * Provides consistent error reporting, logging, and user feedback
 */

import { AppError, ErrorHandler, type ErrorContext } from './errorHandler';
import { errorLogger, type AppError as LoggerAppError } from '../services/errorLogger';

// Export unified error types
export type { ErrorContext, AppError } from './errorHandler';

/**
 * Error severity levels for categorization
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error categories for better organization and handling
 */
export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  FILE_OPERATION = 'file_operation',
  BACKUP = 'backup',
  UI = 'ui',
  UNKNOWN = 'unknown'
}

/**
 * Enhanced error context with additional metadata
 */
export interface EnhancedErrorContext extends ErrorContext {
  /** Category of the error for better handling */
  category: ErrorCategory;
  /** Severity level for prioritization */
  severity: ErrorSeverity;
  /** Whether the error is user-facing */
  userFacing: boolean;
  /** Whether the error should be retried */
  retryable: boolean;
  /** Additional component-specific context */
  componentContext?: Record<string, any>;
}

/**
 * Unified error interface that combines both error handling systems
 */
export interface UnifiedError extends AppError {
  /** Error category */
  category: ErrorCategory;
  /** Error severity */
  severity: ErrorSeverity;
  /** Whether the error is user-facing */
  userFacing: boolean;
  /** Whether the error can be retried */
  retryable: boolean;
  /** Component-specific context */
  componentContext?: Record<string, any>;
}

/**
 * Centralized error handler class
 */
export class CentralizedErrorHandler {
  private static instance: CentralizedErrorHandler;
  private errorCallbacks: Map<string, (error: UnifiedError) => void> = new Map();

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): CentralizedErrorHandler {
    if (!CentralizedErrorHandler.instance) {
      CentralizedErrorHandler.instance = new CentralizedErrorHandler();
    }
    return CentralizedErrorHandler.instance;
  }

  /**
   * Setup global error handlers for uncaught errors
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        operation: 'global_error',
        component: 'GlobalErrorHandler',
        category: ErrorCategory.UNKNOWN,
        severity: 'high',
        userFacing: false,
        retryable: false,
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        operation: 'unhandled_promise_rejection',
        component: 'GlobalErrorHandler',
        category: ErrorCategory.UNKNOWN,
        severity: 'high',
        userFacing: false,
        retryable: false
      });
    });
  }

  /**
   * Categorize an error based on its message and context
   */
  private categorizeError(error: Error, context: Partial<EnhancedErrorContext>): {
    category: ErrorCategory;
    severity: ErrorSeverity;
    userFacing: boolean;
    retryable: boolean;
  } {
    const message = error.message.toLowerCase();
    const operation = context.operation?.toLowerCase() || '';

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        category: ErrorCategory.NETWORK,
        severity: 'medium',
        userFacing: true,
        retryable: true
      };
    }

    // Database/Storage errors
    if (message.includes('database') || message.includes('storage') || message.includes('indexeddb') || 
        operation.includes('database') || operation.includes('storage')) {
      return {
        category: ErrorCategory.DATABASE,
        severity: 'high',
        userFacing: true,
        retryable: true
      };
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('token') || message.includes('unauthorized') ||
        message.includes('login') || message.includes('password')) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        severity: 'high',
        userFacing: true,
        retryable: false
      };
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required') ||
        operation.includes('validation')) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: 'low',
        userFacing: true,
        retryable: false
      };
    }

    // File operation errors
    if (operation.includes('file') || operation.includes('upload') || operation.includes('download') ||
        operation.includes('export') || operation.includes('import')) {
      return {
        category: ErrorCategory.FILE_OPERATION,
        severity: 'medium',
        userFacing: true,
        retryable: true
      };
    }

    // Backup errors
    if (operation.includes('backup') || operation.includes('restore')) {
      return {
        category: ErrorCategory.BACKUP,
        severity: 'high',
        userFacing: true,
        retryable: true
      };
    }

    // Default categorization
    return {
      category: ErrorCategory.UNKNOWN,
      severity: 'medium',
      userFacing: true,
      retryable: false
    };
  }

  /**
   * Handle an error with centralized processing
   */
  handleError(
    error: Error,
    context: Partial<EnhancedErrorContext>,
    options: {
      showUserMessage?: boolean;
      logError?: boolean;
      callbackKey?: string;
    } = {}
  ): UnifiedError {
    const { showUserMessage = true, logError = true, callbackKey } = options;

    // Determine error categorization
    const { category, severity, userFacing, retryable } = this.categorizeError(error, context);

    // Create enhanced context
    const enhancedContext: EnhancedErrorContext = {
      operation: context.operation || 'unknown_operation',
      component: context.component || 'UnknownComponent',
      category,
      severity,
      userFacing,
      retryable,
      extra: context.extra,
      componentContext: context.componentContext
    };

    // Create unified error
    const unifiedError: UnifiedError = {
      ...new AppError(error.message, enhancedContext, error),
      category,
      severity,
      userFacing,
      retryable,
      componentContext: context.componentContext
    };

    // Log error using both systems
    if (logError) {
      // Log using existing ErrorHandler
      ErrorHandler.logError(unifiedError);

      // Log using errorLogger
      errorLogger.logError(error, enhancedContext);
    }

    // Show user message if appropriate
    if (showUserMessage && userFacing) {
      this.showUserMessage(unifiedError);
    }

    // Execute callback if provided
    if (callbackKey && this.errorCallbacks.has(callbackKey)) {
      const callback = this.errorCallbacks.get(callbackKey)!;
      try {
        callback(unifiedError);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }

    return unifiedError;
  }

  /**
   * Show user-friendly error message
   */
  private showUserMessage(error: UnifiedError): void {
    const message = this.getUserFriendlyMessage(error);
    
    // In a real app, use a toast notification system
    // For now, use alert for immediate feedback
    alert(message);
  }

  /**
   * Get user-friendly error message based on error category and context
   */
  private getUserFriendlyMessage(error: UnifiedError): string {
    const { category, context, message } = error;

    switch (category) {
      case ErrorCategory.NETWORK:
        return 'Network error. Please check your connection and try again.';
      
      case ErrorCategory.DATABASE:
        return 'Storage error. Please try refreshing the page.';
      
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication error. Please log in again.';
      
      case ErrorCategory.VALIDATION:
        return 'Invalid input provided. Please check your entries.';
      
      case ErrorCategory.FILE_OPERATION:
        return 'File operation failed. Please try again.';
      
      case ErrorCategory.BACKUP:
        return 'Backup operation failed. Please try again.';
      
      default:
        // Operation-specific messages
        switch (context.operation) {
          case 'save_patient':
            return 'Failed to save patient. Please try again.';
          case 'save_record':
            return 'Failed to save medical record. Please try again.';
          case 'load_patients':
            return 'Failed to load patient data. Please refresh the page.';
          case 'file_upload':
            return 'File upload failed. Please try again with a different file.';
          default:
            return 'An error occurred. Please try again or contact support if the problem persists.';
        }
    }
  }

  /**
   * Register an error callback for specific components
   */
  registerErrorCallback(key: string, callback: (error: UnifiedError) => void): void {
    this.errorCallbacks.set(key, callback);
  }

  /**
   * Unregister an error callback
   */
  unregisterErrorCallback(key: string): void {
    this.errorCallbacks.delete(key);
  }

  /**
   * Safe execution wrapper for async operations
   */
  async safeExecuteAsync<T>(
    operation: () => Promise<T>,
    context: Partial<EnhancedErrorContext>,
    options?: {
      showUserMessage?: boolean;
      logError?: boolean;
      callbackKey?: string;
      defaultValue?: T;
    }
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err, context, options);
      return options?.defaultValue;
    }
  }

  /**
   * Safe execution wrapper for sync operations
   */
  safeExecute<T>(
    operation: () => T,
    context: Partial<EnhancedErrorContext>,
    options?: {
      showUserMessage?: boolean;
      logError?: boolean;
      callbackKey?: string;
      defaultValue?: T;
    }
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleError(err, context, options);
      return options?.defaultValue;
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(count: number = 10): UnifiedError[] {
    const loggerErrors = errorLogger.getErrorLogs(count);
    return loggerErrors.map(log => ({
      ...log.error,
      name: log.error.name,
      message: log.error.message,
      context: log.error.context as EnhancedErrorContext,
      timestamp: log.error.timestamp,
      stackTrace: log.stack,
      category: (log.error.context?.category as ErrorCategory) || ErrorCategory.UNKNOWN,
      severity: log.error.severity,
      userFacing: log.error.context?.userFacing ?? true,
      retryable: log.error.retryable ?? false,
      componentContext: log.error.context?.componentContext
    }));
  }
}

// Export singleton instance
export const centralizedErrorHandler = CentralizedErrorHandler.getInstance();

// Export convenience hook for React components
export const useCentralizedErrorHandler = () => {
  return {
    handleError: (error: Error, context: Partial<EnhancedErrorContext>, options?: {
      showUserMessage?: boolean;
      logError?: boolean;
      callbackKey?: string;
    }) => centralizedErrorHandler.handleError(error, context, options),
    
    safeExecute: <T>(operation: () => T, context: Partial<EnhancedErrorContext>, options?: {
      showUserMessage?: boolean;
      logError?: boolean;
      callbackKey?: string;
      defaultValue?: T;
    }) => centralizedErrorHandler.safeExecute(operation, context, options),
    
    safeExecuteAsync: async <T>(operation: () => Promise<T>, context: Partial<EnhancedErrorContext>, options?: {
      showUserMessage?: boolean;
      logError?: boolean;
      callbackKey?: string;
      defaultValue?: T;
    }) => centralizedErrorHandler.safeExecuteAsync(operation, context, options),
    
    registerCallback: (key: string, callback: (error: UnifiedError) => void) => 
      centralizedErrorHandler.registerErrorCallback(key, callback),
    
    unregisterCallback: (key: string) => 
      centralizedErrorHandler.unregisterErrorCallback(key),
    
    getRecentErrors: (count?: number) => centralizedErrorHandler.getRecentErrors(count)
  };
};