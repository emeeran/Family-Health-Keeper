export interface AppError extends Error {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, any>;
  retryable?: boolean;
}

export class DatabaseError extends Error implements AppError {
  code: string;
  severity: AppError['severity'];
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'DatabaseError';
    this.code = 'DB_ERROR';
    this.severity = 'high';
    this.timestamp = new Date();
    this.context = context;
    this.retryable = true;
  }
}

export class NetworkError extends Error implements AppError {
  code: string;
  severity: AppError['severity'];
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'NetworkError';
    this.code = 'NETWORK_ERROR';
    this.severity = 'medium';
    this.timestamp = new Date();
    this.context = context;
    this.retryable = true;
  }
}

export class ValidationError extends Error implements AppError {
  code: string;
  severity: AppError['severity'];
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.severity = 'low';
    this.timestamp = new Date();
    this.context = context;
    this.retryable = false;
  }
}

export class SecurityError extends Error implements AppError {
  code: string;
  severity: AppError['severity'];
  timestamp: Date;
  context?: Record<string, any>;
  retryable: boolean;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'SecurityError';
    this.code = 'SECURITY_ERROR';
    this.severity = 'critical';
    this.timestamp = new Date();
    this.context = context;
    this.retryable = false;
  }
}

export interface ErrorLogEntry {
  id: string;
  timestamp: Date;
  error: AppError;
  stack?: string;
  userAgent?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorLogs: ErrorLogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.loadPersistedLogs();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private setupGlobalErrorHandlers(): void {
    window.addEventListener('error', (event) => {
      this.logError(event.error, {
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      this.logError(error, { type: 'unhandled_rejection' });
    });
  }

  private loadPersistedLogs(): void {
    try {
      const stored = localStorage.getItem('fhk_error_logs');
      if (stored) {
        this.errorLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load error logs:', error);
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem('fhk_error_logs', JSON.stringify(this.errorLogs));
    } catch (error) {
      console.warn('Failed to save error logs:', error);
    }
  }

  logError(error: Error | AppError, additionalContext?: Record<string, any>): string {
    const appError = this.normalizeError(error);

    const logEntry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      error: appError,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...additionalContext,
    };

    this.errorLogs.push(logEntry);

    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs);
    }

    this.saveLogs();

    if (appError.severity === 'critical' || appError.severity === 'high') {
      console.error(`[${appError.severity.toUpperCase()}] ${appError.message}`, logEntry);
    }

    return logEntry.id;
  }

  private normalizeError(error: Error | AppError): AppError {
    if ('code' in error && 'severity' in error && 'timestamp' in error) {
      return error as AppError;
    }

    const appError: AppError = error as any;
    appError.code = appError.code || 'UNKNOWN_ERROR';
    appError.severity = appError.severity || 'medium';
    appError.timestamp = appError.timestamp || new Date();

    return appError;
  }

  getErrorLogs(limit?: number): ErrorLogEntry[] {
    const logs = [...this.errorLogs].reverse();
    return limit ? logs.slice(0, limit) : logs;
  }

  getErrorById(id: string): ErrorLogEntry | undefined {
    return this.errorLogs.find(log => log.id === id);
  }

  clearLogs(): void {
    this.errorLogs = [];
    this.saveLogs();
  }

  getErrorStats(): {
    total: number;
    bySeverity: Record<AppError['severity'], number>;
    byCode: Record<string, number>;
    recentErrors: ErrorLogEntry[];
  } {
    const bySeverity: Record<AppError['severity'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byCode: Record<string, number> = {};

    this.errorLogs.forEach(log => {
      bySeverity[log.error.severity]++;
      byCode[log.error.code] = (byCode[log.error.code] || 0) + 1;
    });

    const recentErrors = this.errorLogs
      .slice(-10)
      .reverse();

    return {
      total: this.errorLogs.length,
      bySeverity,
      byCode,
      recentErrors,
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

export const errorLogger = ErrorLogger.getInstance();

export function withErrorHandling<T>(
  fn: () => T,
  context?: Record<string, any>,
  fallback?: T
): T {
  try {
    return fn();
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    errorLogger.logError(normalizedError, context);

    if (fallback !== undefined) {
      return fallback;
    }

    throw normalizedError;
  }
}

export async function withAsyncErrorHandling<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>,
  fallback?: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    errorLogger.logError(normalizedError, context);

    if (fallback !== undefined) {
      return fallback;
    }

    throw normalizedError;
  }
}