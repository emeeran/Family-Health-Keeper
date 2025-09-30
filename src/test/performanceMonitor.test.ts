import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import performanceMonitor, {
  PerformanceMonitor,
  usePerformanceMonitor,
  usePerformanceMeasurement,
  startMeasure,
  measureAsync,
  type PerformanceMetric,
  type PerformanceConfig,
} from '../../utils/performanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  mark: vi.fn(),
  measure: vi.fn(),
};

const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 200 * 1024 * 1024, // 200MB
};

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

mockPerformanceObserver.mockImplementation(() => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
}));

// Setup global mocks
beforeEach(() => {
  vi.stubGlobal('performance', mockPerformance);
  vi.stubGlobal('PerformanceObserver', mockPerformanceObserver);

  // Mock performance memory if available
  if (mockPerformance.now as any) {
    (mockPerformance as any).memory = mockMemory;
  }

  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with default config', () => {
      const config = monitor['config'];
      expect(config.enabled).toBe(true);
      expect(config.sampleRate).toBe(0.1);
      expect(config.maxMetrics).toBe(1000);
      expect(config.reportInterval).toBe(30000);
    });

    it('should initialize with custom config', () => {
      const customConfig: Partial<PerformanceConfig> = {
        enabled: false,
        sampleRate: 0.5,
        maxMetrics: 500,
      };
      const customMonitor = new PerformanceMonitor(customConfig);
      expect(customMonitor['config'].enabled).toBe(false);
      expect(customMonitor['config'].sampleRate).toBe(0.5);
      expect(customMonitor['config'].maxMetrics).toBe(500);
      customMonitor.destroy();
    });
  });

  describe('Recording Metrics', () => {
    it('should record metric when enabled', () => {
      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        name: 'test-metric',
        value: 100,
        category: 'render',
      };

      monitor.recordMetric(metric);

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].category).toBe('render');
      expect(metrics[0].timestamp).toBeGreaterThan(0);
    });

    it('should not record metric when disabled', () => {
      const disabledMonitor = new PerformanceMonitor({ enabled: false });
      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        name: 'test-metric',
        value: 100,
        category: 'render',
      };

      disabledMonitor.recordMetric(metric);

      const metrics = disabledMonitor.getMetrics();
      expect(metrics).toHaveLength(0);
      disabledMonitor.destroy();
    });

    it('should apply sampling', () => {
      // Mock Math.random to always return value higher than sample rate
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.9); // Higher than default 0.1 sample rate

      const metric: Omit<PerformanceMetric, 'timestamp'> = {
        name: 'test-metric',
        value: 100,
        category: 'render',
      };

      monitor.recordMetric(metric);

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(0);

      Math.random = originalRandom;
    });

    it('should limit metrics to max size', () => {
      const monitorWithLimit = new PerformanceMonitor({ maxMetrics: 2 });

      // Add 3 metrics
      for (let i = 0; i < 3; i++) {
        monitorWithLimit.recordMetric({
          name: `metric-${i}`,
          value: i,
          category: 'render',
        });
      }

      const metrics = monitorWithLimit.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics[0].name).toBe('metric-1'); // Should keep only last 2
      expect(metrics[1].name).toBe('metric-2');

      monitorWithLimit.destroy();
    });

    it('should check thresholds and log warnings', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      monitor.recordMetric({
        name: 'slow-render',
        value: 50, // Higher than default 16ms threshold
        category: 'render',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Performance threshold exceeded: slow-render took 50ms (threshold: 16ms)'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Report', () => {
    it('should generate performance report', () => {
      // Add some test metrics
      monitor.recordMetric({ name: 'render-1', value: 10, category: 'render' });
      monitor.recordMetric({ name: 'render-2', value: 20, category: 'render' });
      monitor.recordMetric({ name: 'api-1', value: 100, category: 'api' });
      monitor.recordMetric({ name: 'memory-1', value: 50 * 1024 * 1024, category: 'memory' });

      const report = monitor.generateReport();

      expect(report.summary.totalMetrics).toBe(4);
      expect(report.summary.averageRenderTime).toBe(15); // (10 + 20) / 2
      expect(report.summary.averageApiTime).toBe(100);
      expect(report.summary.memoryUsage).toBe(50 * 1024 * 1024);
      expect(report.summary.slowestOperations).toHaveLength(4);
      expect(report.summary.slowestOperations[0].value).toBe(50 * 1024 * 1024); // Sorted by duration
    });

    it('should filter metrics by time range', () => {
      const oldMetric: Omit<PerformanceMetric, 'timestamp'> = {
        name: 'old-metric',
        value: 100,
        category: 'render',
      };

      // Record old metric
      monitor.recordMetric(oldMetric);

      // Mock time to be in the future
      const futureTime = Date.now() + 120000; // 2 minutes later
      vi.spyOn(Date, 'now').mockReturnValue(futureTime);

      // Record new metric
      monitor.recordMetric({
        name: 'new-metric',
        value: 200,
        category: 'render',
      });

      const report = monitor.generateReport();

      // Should only include recent metrics (last minute)
      expect(report.summary.totalMetrics).toBe(1);
      expect(report.summary.slowestOperations[0].name).toBe('new-metric');

      vi.restoreAllMocks();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newConfig: Partial<PerformanceConfig> = {
        enabled: false,
        sampleRate: 0.8,
      };

      monitor.updateConfig(newConfig);

      expect(monitor['config'].enabled).toBe(false);
      expect(monitor['config'].sampleRate).toBe(0.8);
    });

    it('should restart periodic reporting when interval changes', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const setIntervalSpy = vi.spyOn(global, 'setInterval');

      monitor.updateConfig({ reportInterval: 60000 });

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(setIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should clear metrics', () => {
      monitor.recordMetric({
        name: 'test-metric',
        value: 100,
        category: 'render',
      });

      expect(monitor.getMetrics()).toHaveLength(1);

      monitor.clearMetrics();

      expect(monitor.getMetrics()).toHaveLength(0);
    });

    it('should destroy and clean up resources', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      monitor.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalled();
      expect(monitor.getMetrics()).toHaveLength(0);

      clearIntervalSpy.mockRestore();
    });
  });
});

describe('Utility Functions', () => {
  describe('startMeasure', () => {
    it('should return a function that records duration', () => {
      mockPerformance.now.mockReturnValueOnce(1000);
      mockPerformance.now.mockReturnValueOnce(1100);

      const endMeasure = startMeasure('test-operation');
      endMeasure();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-operation');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].category).toBe('ui');
    });
  });

  describe('measureAsync', () => {
    it('should measure async operation success', async () => {
      mockPerformance.now.mockReturnValueOnce(1000);
      mockPerformance.now.mockReturnValueOnce(1100);

      const operation = vi.fn().mockResolvedValue('result');
      const result = await measureAsync('async-operation', 'api', operation);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async-operation');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].category).toBe('api');
    });

    it('should measure async operation error', async () => {
      mockPerformance.now.mockReturnValueOnce(1000);
      mockPerformance.now.mockReturnValueOnce(1100);

      const error = new Error('Test error');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(measureAsync('async-operation', 'api', operation)).rejects.toThrow('Test error');

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('async-operation-error');
      expect(metrics[0].value).toBe(100);
      expect(metrics[0].category).toBe('api');
      expect(metrics[0].metadata?.error).toBe('Test error');
    });
  });
});

// Mock React hooks for testing
const mockReact = {
  useEffect: vi.fn(),
  useRef: vi.fn(() => ({ current: null })),
  useState: vi.fn(),
  useCallback: vi.fn((cb) => cb),
};

vi.mock('react', () => mockReact);

describe('React Hooks', () => {
  describe('usePerformanceMonitor', () => {
    beforeEach(() => {
      mockReact.useEffect.mockImplementation((f) => f());
      mockReact.useRef.mockReturnValue({ current: null });
      mockReact.useState.mockReturnValue([0, vi.fn()]);
    });

    it('should return render count', () => {
      const { renderCount } = usePerformanceMonitor('TestComponent');
      expect(typeof renderCount).toBe('number');
    });
  });

  describe('usePerformanceMeasurement', () => {
    beforeEach(() => {
      mockReact.useCallback.mockImplementation((cb) => cb);
    });

    it('should provide measurement functions', () => {
      const { measureOperation, measureAsyncOperation } = usePerformanceMeasurement();

      expect(typeof measureOperation).toBe('function');
      expect(typeof measureAsyncOperation).toBe('function');
    });

    it('should measure operation duration', () => {
      const { measureOperation } = usePerformanceMeasurement();
      const operation = vi.fn();

      measureOperation('test-operation', 'ui', operation);

      expect(operation).toHaveBeenCalled();
    });

    it('should measure async operation', async () => {
      const { measureAsyncOperation } = usePerformanceMeasurement();
      const operation = vi.fn().mockResolvedValue('result');

      const result = await measureAsyncOperation('test-async', 'api', operation);

      expect(result).toBe('result');
      expect(operation).toHaveBeenCalled();
    });
  });
});