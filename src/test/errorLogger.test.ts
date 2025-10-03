import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errorLogger, DatabaseError, NetworkError, ValidationError, SecurityError, withErrorHandling, withAsyncErrorHandling } from '../../services/errorLogger';

describe('ErrorLogger', () => {
  beforeEach(() => {
    errorLogger.clearLogs();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Types', () => {
    it('should create DatabaseError with correct properties', () => {
      const error = new DatabaseError('Test database error', { table: 'patients' });

      expect(error.name).toBe('DatabaseError');
      expect(error.code).toBe('DB_ERROR');
      expect(error.severity).toBe('high');
      expect(error.message).toBe('Test database error');
      expect(error.context).toEqual({ table: 'patients' });
      expect(error.retryable).toBe(true);
    });

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Test network error', { url: 'https://api.example.com' });

      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.severity).toBe('medium');
      expect(error.message).toBe('Test network error');
      expect(error.context).toEqual({ url: 'https://api.example.com' });
      expect(error.retryable).toBe(true);
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Test validation error', { field: 'email' });

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.severity).toBe('low');
      expect(error.message).toBe('Test validation error');
      expect(error.context).toEqual({ field: 'email' });
      expect(error.retryable).toBe(false);
    });

    it('should create SecurityError with correct properties', () => {
      const error = new SecurityError('Test security error', { action: 'unauthorized_access' });

      expect(error.name).toBe('SecurityError');
      expect(error.code).toBe('SECURITY_ERROR');
      expect(error.severity).toBe('critical');
      expect(error.message).toBe('Test security error');
      expect(error.context).toEqual({ action: 'unauthorized_access' });
      expect(error.retryable).toBe(false);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with generated ID', () => {
      const error = new Error('Test error');
      const logId = errorLogger.logError(error, { operation: 'test' });

      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe(logId);
      expect(logs[0].error).toEqual(error);
      expect(logs[0].context).toEqual({ operation: 'test' });
    });

    it('should log errors with timestamp', () => {
      const beforeLog = new Date();
      const error = new Error('Test error');
      errorLogger.logError(error);

      const logs = errorLogger.getErrorLogs();
      const logTime = new Date(logs[0].timestamp);

      expect(logTime.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
      expect(logTime.getTime()).toBeLessThanOrEqual(new Date().getTime());
    });

    it('should include browser context in error logs', () => {
      const originalUserAgent = navigator.userAgent;
      const originalLocation = window.location.href;

      Object.defineProperty(navigator, 'userAgent', {
        value: 'Test User Agent',
        configurable: true
      });

      Object.defineProperty(window, 'location', {
        value: { href: 'https://test.example.com' },
        configurable: true
      });

      try {
        const error = new Error('Test error');
        errorLogger.logError(error);

        const logs = errorLogger.getErrorLogs();
        expect(logs[0].userAgent).toBe('Test User Agent');
        expect(logs[0].url).toBe('https://test.example.com');
      } finally {
        Object.defineProperty(navigator, 'userAgent', {
          value: originalUserAgent,
          configurable: true
        });

        Object.defineProperty(window, 'location', {
          value: { href: originalLocation },
          configurable: true
        });
      }
    });

    it('should limit number of stored logs', () => {
      const maxLogs = 1000;

      // Create more logs than the maximum
      for (let i = 0; i < maxLogs + 100; i++) {
        errorLogger.logError(new Error(`Error ${i}`));
      }

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(maxLogs);

      // Should keep the most recent logs
      expect(logs[logs.length - 1].error.message).toBe(`Error ${maxLogs + 99}`);
    });
  });

  describe('Error Statistics', () => {
    beforeEach(() => {
      errorLogger.logError(new DatabaseError('DB error'));
      errorLogger.logError(new NetworkError('Network error'));
      errorLogger.logError(new ValidationError('Validation error'));
      errorLogger.logError(new SecurityError('Security error'));
      errorLogger.logError(new DatabaseError('Another DB error'));
    });

    it('should calculate correct total count', () => {
      const stats = errorLogger.getErrorStats();
      expect(stats.total).toBe(5);
    });

    it('should count errors by severity', () => {
      const stats = errorLogger.getErrorStats();
      expect(stats.bySeverity.low).toBe(1);      // ValidationError
      expect(stats.bySeverity.medium).toBe(1);   // NetworkError
      expect(stats.bySeverity.high).toBe(2);     // DatabaseError (2)
      expect(stats.bySeverity.critical).toBe(1); // SecurityError
    });

    it('should count errors by code', () => {
      const stats = errorLogger.getErrorStats();
      expect(stats.byCode.DB_ERROR).toBe(2);
      expect(stats.byCode.NETWORK_ERROR).toBe(1);
      expect(stats.byCode.VALIDATION_ERROR).toBe(1);
      expect(stats.byCode.SECURITY_ERROR).toBe(1);
    });

    it('should return recent errors', () => {
      const stats = errorLogger.getErrorStats();
      expect(stats.recentErrors).toHaveLength(5);

      // Should be in reverse chronological order
      expect(stats.recentErrors[0].error.message).toBe('Another DB error');
      expect(stats.recentErrors[1].error.message).toBe('Security error');
    });
  });

  describe('Log Management', () => {
    it('should clear all logs', () => {
      errorLogger.logError(new Error('Test error 1'));
      errorLogger.logError(new Error('Test error 2'));

      expect(errorLogger.getErrorLogs()).toHaveLength(2);

      errorLogger.clearLogs();

      expect(errorLogger.getErrorLogs()).toHaveLength(0);
    });

    it('should retrieve error by ID', () => {
      const error = new Error('Test error');
      const logId = errorLogger.logError(error);

      const retrievedLog = errorLogger.getErrorById(logId);
      expect(retrievedLog).toBeDefined();
      expect(retrievedLog?.error.message).toBe('Test error');
    });

    it('should return undefined for non-existent log ID', () => {
      const retrievedLog = errorLogger.getErrorById('non-existent-id');
      expect(retrievedLog).toBeUndefined();
    });

    it('should limit returned logs', () => {
      for (let i = 0; i < 10; i++) {
        errorLogger.logError(new Error(`Error ${i}`));
      }

      const allLogs = errorLogger.getErrorLogs();
      const limitedLogs = errorLogger.getErrorLogs(5);

      expect(allLogs).toHaveLength(10);
      expect(limitedLogs).toHaveLength(5);
      expect(limitedLogs).toEqual(allLogs.slice(0, 5));
    });
  });

  describe('Error Handler Utilities', () => {
    it('withErrorHandling should catch and log synchronous errors', () => {
      const error = new Error('Sync error');
      const fn = () => { throw error; };
      const context = { operation: 'sync_test' };

      const result = withErrorHandling(fn, context, 'fallback result');

      expect(result).toBe('fallback result');

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBe(error);
      expect(logs[0].context).toEqual(context);
    });

    it('withErrorHandling should return function result when no error', () => {
      const fn = () => 'success result';
      const context = { operation: 'success_test' };

      const result = withErrorHandling(fn, context, 'fallback result');

      expect(result).toBe('success result');

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(0);
    });

    it('withAsyncErrorHandling should catch and log async errors', async () => {
      const error = new Error('Async error');
      const fn = async () => { throw error; };
      const context = { operation: 'async_test' };

      const result = await withAsyncErrorHandling(fn, context, 'fallback result');

      expect(result).toBe('fallback result');

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].error).toBe(error);
      expect(logs[0].context).toEqual(context);
    });

    it('withAsyncErrorHandling should return async function result when no error', async () => {
      const fn = async () => 'async success result';
      const context = { operation: 'async_success_test' };

      const result = await withAsyncErrorHandling(fn, context, 'fallback result');

      expect(result).toBe('async success result');

      const logs = errorLogger.getErrorLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('Global Error Handlers', () => {
    it('should log uncaught errors globally', () => {
      const errorEvent = new ErrorEvent('error', {
        error: new Error('Uncaught error'),
        filename: 'test.js',
        lineno: 10,
        colno: 5
      });

      window.dispatchEvent(errorEvent);

      const logs = errorLogger.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);

      const uncaughtLog = logs.find(log =>
        log.error.message === 'Uncaught error' &&
        log.context?.filename === 'test.js'
      );
      expect(uncaughtLog).toBeDefined();
    });

    it('should log unhandled promise rejections globally', () => {
      const error = new Error('Unhandled rejection');
      const promiseRejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(error),
        reason: error
      });

      window.dispatchEvent(promiseRejectionEvent);

      const logs = errorLogger.getErrorLogs();
      expect(logs.length).toBeGreaterThan(0);

      const unhandledLog = logs.find(log =>
        log.error.message === 'Unhandled rejection' &&
        log.context?.type === 'unhandled_rejection'
      );
      expect(unhandledLog).toBeDefined();
    });
  });
});