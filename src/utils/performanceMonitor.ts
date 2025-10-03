// Performance Monitoring Utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static init() {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  constructor() {
    this.setupObservers();
  }

  private setupObservers() {
    // Monitor navigation timing
    if ('performance' in window) {
      this.observeNavigation();
      this.observeResources();
      this.observePaint();
    }
  }

  private observeNavigation() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('[Performance] Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              totalTime: navEntry.loadEventEnd - navEntry.navigationStart
            });
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance] Navigation observer not supported');
    }
  }

  private observeResources() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            console.log('[Performance] Resource loaded:', {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize
            });
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance] Resource observer not supported');
    }
  }

  private observePaint() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('[Performance] Paint timing:', {
            name: entry.name,
            startTime: entry.startTime
          });
        }
      });
      observer.observe({ entryTypes: ['paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance] Paint observer not supported');
    }
  }

  // Measure custom performance metrics
  static measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }

  // Track component render times
  static trackRender(componentName: string) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`[Performance] ${componentName} render: ${(end - start).toFixed(2)}ms`);
    };
  }

  // Get memory usage (if available)
  static getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Log bundle size metrics
  static logBundleMetrics() {
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('/assets/')) {
        console.log('[Performance] Bundle loaded:', src);
      }
    });
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Performance monitoring hook for components
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    console.log(`[Performance] ${componentName} mounted`);
    return () => {
      console.log(`[Performance] ${componentName} unmounted`);
    };
  }, [componentName]);
};