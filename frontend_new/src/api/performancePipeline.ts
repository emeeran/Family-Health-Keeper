interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  componentRenders?: number;
}

interface PipelineStage {
  name: string;
  execute: (metrics: PerformanceMetrics) => Promise<void>;
}

class PerformancePipeline {
  private metrics: PerformanceMetrics[] = [];
  private stages: PipelineStage[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.setupPerformanceObservers();
    this.initializeStages();
  }

  private setupPerformanceObservers() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Measure render performance
      const renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordMetric('render', entry.startTime, entry.startTime + entry.duration);
          }
        }
      });
      renderObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(renderObserver);

      // Measure navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            this.recordMetric('navigation', entry.startTime, entry.loadEventEnd);
          }
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  private initializeStages() {
    // Stage 1: Collection
    this.stages.push({
      name: 'collect',
      execute: async (metrics) => {
        metrics.memoryUsage = this.getMemoryUsage();
        metrics.componentRenders = this.getComponentRenderCount();
      }
    });

    // Stage 2: Analysis
    this.stages.push({
      name: 'analyze',
      execute: async (metrics) => {
        if (metrics.duration && metrics.duration > 100) {
          console.warn(`Slow operation detected: ${metrics.operation} took ${metrics.duration}ms`);
        }
      }
    });

    // Stage 3: Optimization
    this.stages.push({
      name: 'optimize',
      execute: async (metrics) => {
        // Trigger optimizations based on metrics
        if (metrics.memoryUsage && metrics.memoryUsage > 50) {
          this.suggestMemoryOptimization();
        }
      }
    });

    // Stage 4: Reporting
    this.stages.push({
      name: 'report',
      execute: async (metrics) => {
        this.reportMetrics(metrics);
      }
    });

    // Stage 5: Cleanup
    this.stages.push({
      name: 'cleanup',
      execute: async (metrics) => {
        this.cleanupOldMetrics();
      }
    });
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1048576; // MB
    }
    return 0;
  }

  private getComponentRenderCount(): number {
    // This would be integrated with React DevTools in a real implementation
    return this.metrics.filter(m => m.operation === 'render').length;
  }

  private recordMetric(operation: string, startTime: number, endTime: number) {
    const metric: PerformanceMetrics = {
      operation,
      startTime,
      endTime,
      duration: endTime - startTime
    };
    this.metrics.push(metric);
    this.executePipeline(metric);
  }

  private async executePipeline(metrics: PerformanceMetrics) {
    for (const stage of this.stages) {
      try {
        await stage.execute(metrics);
      } catch (error) {
        console.error(`Pipeline stage ${stage.name} failed:`, error);
      }
    }
  }

  private suggestMemoryOptimization() {
    console.info('Memory usage high. Consider optimizing component re-renders');
  }

  private reportMetrics(metrics: PerformanceMetrics) {
    if (import.meta.env.DEV) {
      console.group(`Performance: ${metrics.operation}`);
      console.log('Duration:', metrics.duration, 'ms');
      console.log('Memory Usage:', metrics.memoryUsage, 'MB');
      console.log('Component Renders:', metrics.componentRenders);
      console.groupEnd();
    }
  }

  private cleanupOldMetrics() {
    const cutoff = Date.now() - 60000; // Keep last minute of metrics
    this.metrics = this.metrics.filter(m => m.startTime > cutoff);
  }

  public startOperation(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.recordMetric(operation, startTime, endTime);
    };
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.metrics = [];
    this.stages = [];
  }
}

export const performancePipeline = new PerformancePipeline();
export default PerformancePipeline;