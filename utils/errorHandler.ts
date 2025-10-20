/**
 * Error Handling Utilities
 * Provides basic error handling functionality
 */

export interface ErrorContext {
  operation: string;
  component: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  userFacing?: boolean;
  retryable?: boolean;
  extra?: Record<string, any>;
}

export class AppError extends Error {
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly severity: string;

  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = 'AppError';
    this.context = context;
    this.timestamp = new Date();
    this.severity = context.severity || 'medium';
  }
}

export class ErrorHandler {
  static createError(message: string, context: ErrorContext): AppError {
    return new AppError(message, context);
  }

  static logError(error: AppError): void {
    console.error(`[${error.severity.toUpperCase()}] ${error.context.operation}: ${error.message}`, error.context);
  }
}