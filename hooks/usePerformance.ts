import { useCallback, useEffect, useMemo, useRef } from 'react';

// Hook for memoizing expensive computations
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// Hook for preventing unnecessary re-renders
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  callbackRef.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Hook for tracking component render count (development only)
export function useRenderCount(): number {
  const renderCount = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current += 1;
      console.log(`Component rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    const renderTime = performance.now() - lastRenderTime.current;

    if (lastRenderTime.current > 0) {
      renderTimes.current.push(renderTime);

      // Keep only last 10 render times
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }

      // Log slow renders
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    }

    lastRenderTime.current = performance.now();

    return () => {
      const totalTime = renderTimes.current.reduce((sum, time) => sum + time, 0);
      const avgRenderTime = totalTime / renderTimes.current.length;

      if (avgRenderTime > 16 && renderTimes.current.length > 0) {
        console.warn(`${componentName} average render time: ${avgRenderTime.toFixed(2)}ms`);
      }
    };
  });
}

// Hook for optimizing array operations
export function useOptimizedArray<T>(
  array: T[],
  deps: React.DependencyList,
  options: {
    sortFn?: (a: T, b: T) => number;
    filterFn?: (item: T) => boolean;
    mapFn?: (item: T) => any;
  } = {}
) {
  const { sortFn, filterFn, mapFn } = options;

  const optimizedArray = useMemo(() => {
    let result = [...array];

    if (filterFn) {
      result = result.filter(filterFn);
    }

    if (sortFn) {
      result.sort(sortFn);
    }

    if (mapFn) {
      result = result.map(mapFn);
    }

    return result;
  }, [array, ...deps]);

  return optimizedArray;
}

// Hook for virtual scrolling
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex
  };
}

// Hook for intersection observer (lazy loading)
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Hook for window size tracking with debounce
export function useWindowSize(debounceMs: number = 100) {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    const debouncedHandleResize = debounce(handleResize, debounceMs);
    window.addEventListener('resize', debouncedHandleResize);

    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [debounceMs]);

  return windowSize;
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}