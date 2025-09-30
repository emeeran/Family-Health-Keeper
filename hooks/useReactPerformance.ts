import React, { useEffect, useRef, useState, useCallback } from 'react';
import performanceMonitor, { PerformanceMetric } from '../utils/performanceMonitor';

interface ComponentPerformance {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  lastRenderTime: number;
  slowestRender: number;
}

interface UseReactPerformanceOptions {
  enabled?: boolean;
  componentName?: string;
  trackRerenders?: boolean;
  reportThreshold?: number; // ms
}

export function useReactPerformance(options: UseReactPerformanceOptions = {}) {
  const {
    enabled = true,
    componentName = 'Unknown',
    trackRerenders = true,
    reportThreshold = 16 // 60fps
  } = options;

  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const isMounted = useRef(false);
  const [performance, setPerformance] = useState<ComponentPerformance>({
    renderCount: 0,
    totalRenderTime: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    slowestRender: 0,
  });

  const measureRender = useCallback(() => {
    if (!enabled || !isMounted.current) return;

    renderCount.current++;
    const renderTime = performance.now();

    // Clean up previous render measurement
    return () => {
      const renderEndTime = performance.now();
      const duration = renderEndTime - renderTime;

      renderTimes.current.push(duration);

      // Keep only last 100 render times
      if (renderTimes.current.length > 100) {
        renderTimes.current = renderTimes.current.slice(-100);
      }

      const totalRenderTime = renderTimes.current.reduce((sum, time) => sum + time, 0);
      const averageRenderTime = totalRenderTime / renderTimes.current.length;
      const slowestRender = Math.max(...renderTimes.current);

      setPerformance({
        renderCount: renderCount.current,
        totalRenderTime,
        averageRenderTime,
        lastRenderTime: duration,
        slowestRender,
      });

      // Report to performance monitor
      performanceMonitor.recordMetric({
        name: `${componentName}-render`,
        value: duration,
        category: 'render',
        metadata: {
          renderCount: renderCount.current,
          componentName,
        },
      });

      // Log slow renders
      if (duration > reportThreshold) {
        console.warn(`Slow render detected in ${componentName}: ${duration.toFixed(2)}ms (threshold: ${reportThreshold}ms)`);
      }
    };
  }, [enabled, componentName, reportThreshold]);

  useEffect(() => {
    if (!enabled) return;

    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, [enabled]);

  return {
    measureRender,
    performance,
    reset: () => {
      renderCount.current = 0;
      renderTimes.current = [];
      setPerformance({
        renderCount: 0,
        totalRenderTime: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
        slowestRender: 0,
      });
    },
  };
}

// Hook for measuring hook performance
export function useHookPerformance(hookName: string, dependencies: any[] = []) {
  const executionTimes = useRef<number[]>([]);
  const [lastExecutionTime, setLastExecutionTime] = useState<number>(0);

  const measureExecution = useCallback(<T>(operation: () => T): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    executionTimes.current.push(duration);

    // Keep only last 50 executions
    if (executionTimes.current.length > 50) {
      executionTimes.current = executionTimes.current.slice(-50);
    }

    setLastExecutionTime(duration);

    performanceMonitor.recordMetric({
      name: `${hookName}-execution`,
      value: duration,
      category: 'ui',
      metadata: {
        hookName,
        dependenciesCount: dependencies.length,
      },
    });

    return result;
  }, [hookName, dependencies]);

  const getAverageExecutionTime = useCallback(() => {
    if (executionTimes.current.length === 0) return 0;
    return executionTimes.current.reduce((sum, time) => sum + time, 0) / executionTimes.current.length;
  }, []);

  return {
    measureExecution,
    lastExecutionTime,
    getAverageExecutionTime,
    executionCount: executionTimes.current.length,
  };
}

// Hook for measuring custom operations
export function useCustomPerformance() {
  const measureOperation = useCallback((name: string, category: PerformanceMetric['category'], operation: () => void) => {
    const startTime = performance.now();
    operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name,
      value: duration,
      category,
    });
  }, []);

  const measureAsyncOperation = useCallback(async <T>(
    name: string,
    category: PerformanceMetric['category'],
    operation: () => Promise<T>
  ): Promise<T> => {
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
  }, []);

  const measureMultipleOperations = useCallback((
    operations: Array<{
      name: string;
      category: PerformanceMetric['category'];
      operation: () => void;
    }>
  ) => {
    const results: Record<string, number> = {};

    operations.forEach(({ name, category, operation }) => {
      const startTime = performance.now();
      operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      results[name] = duration;

      performanceMonitor.recordMetric({
        name,
        value: duration,
        category,
      });
    });

    return results;
  }, []);

  return {
    measureOperation,
    measureAsyncOperation,
    measureMultipleOperations,
  };
}

// Hook for performance optimization suggestions
export function usePerformanceOptimization() {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const analyzePerformance = useCallback((metrics: PerformanceMetric[]) => {
    const newSuggestions: string[] = [];

    // Analyze render performance
    const renderMetrics = metrics.filter(m => m.category === 'render');
    const slowRenders = renderMetrics.filter(m => m.value > 16);

    if (slowRenders.length > 0) {
      newSuggestions.push(`Found ${slowRenders.length} slow renders (>16ms). Consider using React.memo or useMemo.`);
    }

    // Analyze API performance
    const apiMetrics = metrics.filter(m => m.category === 'api');
    const slowApiCalls = apiMetrics.filter(m => m.value > 1000);

    if (slowApiCalls.length > 0) {
      newSuggestions.push(`Found ${slowApiCalls.length} slow API calls (>1s). Consider implementing caching or pagination.`);
    }

    // Analyze memory usage
    const memoryMetrics = metrics.filter(m => m.category === 'memory');
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1];
      const memoryUsageMB = latestMemory.value / (1024 * 1024);

      if (memoryUsageMB > 100) {
        newSuggestions.push(`High memory usage detected (${memoryUsageMB.toFixed(2)}MB). Consider optimizing data structures or implementing cleanup.`);
      }
    }

    // Analyze storage performance
    const storageMetrics = metrics.filter(m => m.category === 'storage');
    const slowStorage = storageMetrics.filter(m => m.value > 100);

    if (slowStorage.length > 0) {
      newSuggestions.push(`Found ${slowStorage.length} slow storage operations (>100ms). Consider optimizing database queries or implementing caching.`);
    }

    setSuggestions(newSuggestions);
  }, []);

  return {
    suggestions,
    analyzePerformance,
    clearSuggestions: () => setSuggestions([]),
  };
}

// Higher-order component for performance monitoring (simplified)
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  options: UseReactPerformanceOptions = {}
) {
  return Component; // Simplified for now - performance monitoring can be added via hooks
}

// Performance monitoring utilities
export const performanceUtils = {
  // Memoization helper with performance tracking
  trackedMemo: <T>(factory: () => T, deps: any[], name: string): T => {
    const startTime = performance.now();
    const result = React.useMemo(factory, deps);
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name: `${name}-memo`,
      value: duration,
      category: 'ui',
    });

    return result;
  },

  // Callback helper with performance tracking
  trackedCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: any[],
    name: string
  ): T => {
    const startTime = performance.now();
    const result = React.useCallback(callback, deps);
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name: `${name}-callback`,
      value: duration,
      category: 'ui',
    });

    return result;
  },

  // Effect helper with performance tracking
  trackedEffect: (
    effect: () => void | (() => void),
    deps: any[],
    name: string
  ) => {
    const startTime = performance.now();
    React.useEffect(effect, deps);
    const endTime = performance.now();
    const duration = endTime - startTime;

    performanceMonitor.recordMetric({
      name: `${name}-effect`,
      value: duration,
      category: 'ui',
    });
  },
};

export default useReactPerformance;