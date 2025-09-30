/**
 * Performance monitoring utilities for the Family Health Keeper application
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'api' | 'storage' | 'ui' | 'memory' | 'network';
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageRenderTime: number;
    averageApiTime: number;
    averageStorageTime: number;
    memoryUsage: number;
    slowestOperations: PerformanceMetric[];
    timestamp: number;
  };
}

export interface PerformanceConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0
  maxMetrics: number;
  reportInterval: number; // in milliseconds
  thresholds: {
    renderTime: number;
    apiTime: number;
    storageTime: number;
    memoryUsage: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private config: PerformanceConfig;
  private reportTimer?: NodeJS.Timeout;

  private constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: true,
      sampleRate: 0.1, // Sample 10% of operations
      maxMetrics: 1000,
      reportInterval: 30000, // Report every 30 seconds
      thresholds: {
        renderTime: 16, // 60fps target
        apiTime: 1000, // 1 second
        storageTime: 100, // 100ms
        memoryUsage: 50 * 1024 * 1024, // 50MB
      },
      ...config,
    };

    this.initialize();
  }

  static getInstance(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  private initialize() {
    if (!this.config.enabled) return;

    // Setup Performance Observers
    this.setupPerformanceObservers();

    // Setup memory monitoring
    this.setupMemoryMonitoring();

    // Setup periodic reporting
    this.setupPeriodicReporting();

    // Monitor React render performance
    this.setupReactMonitoring();
  }

  private setupPerformanceObservers() {
    if ('PerformanceObserver' in window) {
      // Measure long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.recordMetric({
              name: 'long-task',
              value: entry.duration,
              timestamp: entry.startTime,
              category: 'ui',
              metadata: {
                name: entry.name,
                entryType: entry.entryType,
              },
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      // Measure resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > this.config.thresholds.apiTime) {
            this.recordMetric({
              name: 'resource-load',
              value: entry.duration,
              timestamp: entry.startTime,
              category: 'network',
              metadata: {
                name: entry.name,
                type: entry.initiatorType,
                size: (entry as any).transferSize,
              },
            });
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Measure navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming;
          this.recordMetric({
            name: 'page-load',
            value: navEntry.loadEventEnd - navEntry.loadEventStart,
            timestamp: navEntry.loadEventStart,
            category: 'network',
            metadata: {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              firstPaint: navEntry.responseEnd - navEntry.fetchStart,
            },
          });
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });

      this.observers.push(longTaskObserver, resourceObserver, navigationObserver);
    }
  }

  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        if (memory) {
          this.recordMetric({
            name: 'memory-usage',
            value: memory.usedJSHeapSize,
            timestamp: Date.now(),
            category: 'memory',
            metadata: {
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit,
              percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
            },
          });
        }
      };

      // Check memory every 5 seconds
      setInterval(checkMemory, 5000);
    }
  }

  private setupPeriodicReporting() {
    this.reportTimer = setInterval(() => {
      this.generateReport();
    }, this.config.reportInterval);
  }

  private setupReactMonitoring() {
    // This will be called by React components to measure render times
    if (typeof window !== 'undefined') {
      (window as any).__REACT_PERFORMANCE_MONITOR__ = {
        measureRender: (componentName: string, duration: number) => {
          this.recordMetric({
            name: 'react-render',
            value: duration,
            timestamp: Date.now(),
            category: 'render',
            metadata: { component: componentName },
          });
        },
      };
    }
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>) {
    if (!this.config.enabled) return;

    // Apply sampling
    if (Math.random() > this.config.sampleRate) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics);
    }

    // Check thresholds and log warnings
    this.checkThresholds(fullMetric);
  }

  private checkThresholds(metric: PerformanceMetric) {
    const threshold = this.config.thresholds[`${metric.category}Time` as keyof typeof this.config.thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`Performance threshold exceeded: ${metric.name} took ${metric.value}ms (threshold: ${threshold}ms)`);
    }
  }

  generateReport(): PerformanceReport {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // Last minute

    const renderMetrics = recentMetrics.filter(m => m.category === 'render');
    const apiMetrics = recentMetrics.filter(m => m.category === 'api');
    const storageMetrics = recentMetrics.filter(m => m.category === 'storage');
    const memoryMetrics = recentMetrics.filter(m => m.category === 'memory');

    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const averageStorageTime = storageMetrics.length > 0
      ? storageMetrics.reduce((sum, m) => sum + m.value, 0) / storageMetrics.length
      : 0;

    const memoryUsage = memoryMetrics.length > 0
      ? memoryMetrics[memoryMetrics.length - 1].value
      : 0;

    // Sort by duration to find slowest operations
    const slowestOperations = [...recentMetrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      metrics: recentMetrics,
      summary: {
        totalMetrics: recentMetrics.length,
        averageRenderTime,
        averageApiTime,
        averageStorageTime,
        memoryUsage,
        slowestOperations,
        timestamp: now,
      },
    };
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }

  updateConfig(config: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...config };

    // Restart timers if interval changed
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }
    this.setupPeriodicReporting();
  }

  destroy() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    this.metrics = [];
  }
}

// React component for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = React.useRef<number>(0);
  const renderCount = React.useRef<number>(0);

  React.useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;

    return () => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime.current;

      if (typeof window !== 'undefined' && (window as any).__REACT_PERFORMANCE_MONITOR__) {
        (window as any).__REACT_PERFORMANCE_MONITOR__.measureRender(componentName, renderDuration);
      }
    };
  });

  return { renderCount: renderCount.current };
}

// Hook for measuring custom operations
export function usePerformanceMeasurement() {
  const measureOperation = React.useCallback((name: string, category: PerformanceMetric['category'], operation: () => void) => {
    const startTime = performance.now();

    try {
      operation();
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      PerformanceMonitor.getInstance().recordMetric({
        name,
        value: duration,
        category,
      });
    }
  }, []);

  const measureAsyncOperation = React.useCallback(async (name: string, category: PerformanceMetric['category'], operation: () => Promise<any>) => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      PerformanceMonitor.getInstance().recordMetric({
        name,
        value: duration,
        category,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      PerformanceMonitor.getInstance().recordMetric({
        name: `${name}-error`,
        value: duration,
        category,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      });

      throw error;
    }
  }, []);

  return { measureOperation, measureAsyncOperation };
}

// High-order component for performance monitoring (simplified)
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return Component; // Simplified for now
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export function startMeasure(name: string): () => void {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name,
      value: duration,
      category: 'ui',
    });
  };
}

export async function measureAsync<T>(name: string, category: PerformanceMetric['category'], operation: () => Promise<T>): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name,
      value: duration,
      category,
    });

    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name: `${name}-error`,
      value: duration,
      category,
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
    });

    throw error;
  }
}

export default performanceMonitor;