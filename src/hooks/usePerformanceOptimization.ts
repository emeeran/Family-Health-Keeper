// Performance Optimization Hooks
import { useCallback, useMemo, useRef, useEffect } from 'react';

// Hook for debounced operations
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
};

// Hook for memoized expensive computations
export const useMemoized computation = <T>(
  computation: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(computation, deps);
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[Performance] ${componentName} render #${renderCount.current}`);
  });

  return {
    renderCount: renderCount.current,
    measureRender: (operation: string) => {
      const start = performance.now();
      return () => {
        const end = performance.now();
        console.log(`[Performance] ${componentName} - ${operation}: ${end - start}ms`);
      };
    }
  };
};

// Hook for optimized state updates
export const useOptimizedState = <T>(initialState: T) => {
  const stateRef = useRef(initialState);
  const listenersRef = useRef<Set<(state: T) => void>>(new Set());

  const setState = useCallback((updater: T | ((prev: T) => T)) => {
    const newState = typeof updater === 'function'
      ? (updater as (prev: T) => T)(stateRef.current)
      : updater;

    if (newState !== stateRef.current) {
      stateRef.current = newState;
      listenersRef.current.forEach(listener => listener(newState));
    }
  }, []);

  const subscribe = useCallback((listener: (state: T) => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return [stateRef.current, setState, subscribe] as const;
};