import { useCallback, useMemo, useEffect, useRef, useState } from 'react';

// Performance optimization hooks for the Family Health Keeper application

export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};

export const useVirtualizedList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, 0 - overscan);
    const endIndex = Math.min(items.length - 1, visibleCount + overscan);

    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      totalHeight: items.length * itemHeight,
    };
  }, [items, itemHeight, containerHeight, overscan]);
};

export const useLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '0px'
) => {
  const elementRef = useRef<HTMLElement>();
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasLoaded) {
          setHasLoaded(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasLoaded]);

  return {
    elementRef,
    isIntersecting,
    hasLoaded,
  };
};

export const useMemoizedCallback = <T extends (...args: any[]) => ReturnType<T>>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps) as T;
};

export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        if (import.meta.env.DEV) {
          console.log(
            `[Performance] ${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`
          );
        }
      }
    };
  });

  const measureOperation = useCallback(<T>(
    operationName: string,
    operation: () => T
  ): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();

    if (import.meta.env.DEV) {
      console.log(
        `[Performance] ${componentName} - ${operationName}: ${(endTime - startTime).toFixed(2)}ms`
      );
    }

    return result;
  }, [componentName]);

  return { measureOperation };
};

export const useImageOptimization = () => {
  const optimizeImage = useCallback((src: string, width?: number, quality?: number): string => {
    if (!src) return '';

    // For demonstration, in production you might use a CDN service
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (quality) params.append('q', quality.toString());

    return params.toString() ? `${src}?${params.toString()}` : src;
  }, []);

  const generateBlurHash = useCallback(async (imageSrc: string): Promise<string> => {
    // In a real implementation, you would use a blur hash library
    // For now, return a placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMkMxOS4yIDIyIDE4LjYgMjIuNCAxOC4zIDIyLjdDMTggMjIuOSAxNy45IDIzLjEgMTcuOSAyMy40QzE3LjkgMjMuNiAxOCAyMy44IDE4LjIgMjRDMTguNCAyNC4yIDE4LjYgMjQuNCAxOC44IDI0LjVDMTkgMjQuNiAxOS4zIDI0LjcgMTkuNSAyNC44QzE5LjcgMjQuOSAxOS45IDI1IDIwLjEgMjVDMjAuMyAyNSAyMC41IDI1LjEgMjAuNiAyNS4yQzIwLjggMjUuMyAyMSAyNS40IDIxLjEgMjUuNUMyMS4yIDI1LjYgMjEuMyAyNS43IDIxLjQgMjUuOEMyMS41IDI1LjkgMjEuNiAyNiAyMS43IDI2LjFDMjEuOCAyNi4yIDIxLjkgMjYuMyAyMiAyNi40QzIyLjEgMjYuNSAyMi4yIDI2LjYgMjIuMyAyNi44QzIyLjQgMjYuOSAyMi41IDI3LjEgMjIuNiAyNy4yQzIyLjcgMjcuNCAyMi44IDI3LjYgMjIuOSAyNy44QzIzIDI4IDIzLjEgMjguMiAyMy4yIDI4LjRDMjMuMyAyOC42IDIzLjQgMjguOCAyMy41IDI5LjFDMjMuNiAyOS40IDIzLjcgMjkuNyAyMy44IDMwQzIzLjkgMzAuMyAyNCAzMC42IDI0LjEgMzAuOUMyNC4yIDMxLjIgMjQuMyAzMS41IDI0LjQgMzEuOEMyNC41IDMyLjEgMjQuNiAzMi40IDI0LjcgMzIuN0MyNC44IDMzIDI0LjkgMzMuMyAyNSAzMy42QzI1LjEgMzMuOSAyNS4yIDM0LjIgMjUuMyAzNC41QzI1LjQgMzQuOCAyNS41IDM1LjEgMjUuNiAzNS40QzI1LjcgMzUuNyAyNS44IDM2IDI1LjkgMzYuM0MyNiAzNi42IDI2LjEgMzYuOSAyNi4yIDM3LjJDMjYuMyAzNy41IDI2LjQgMzcuOCAyNi41IDM4LjFDMjYuNiAzOC40IDI2LjcgMzguNyAyNi44IDM5LjAyNiAyNi45IDM5LjMgMjcgMzkuNiAyNy4xIDM5LjlDMjcuMiA0MC4yIDI3LjMgNDAuNSAyNy40IDQwLjhDMjcuNSA0MS4xIDI3LjYgNDEuNCAyNy43IDQxLjdDMjcuOCA0MiAyNy45IDQyLjMgMjggNDIuNkMyOC4xIDQyLjkgMjguMiA0My4yIDI4LjMgNDMuNUMyOC40IDQzLjggMjguNSA0NC4xIDI4LjYgNDQuNEMyOC43IDQ0LjcgMjguOCA0NSAyOC45IDQ1LjJDMjkgNDUuNCAyOS4xIDQ1LjcgMjkuMiA0NS45QzI5LjMgNDYuMSAyOS40IDQ2LjQgMjkuNSA0Ni42QzI5LjYgNDYuOCAyOS43IDQ3LjEgMjkuOCA0Ny4zQzMwIDQ3LjUgMzAuMSA0Ny44IDMwLjIgNDguMEMzMC4zIDQ4LjIgMzAuNCA0OC41IDMwLjUgNDguN0MzMC42IDQ4LjkgMzAuNyA0OS4yIDMwLjggNDkuNEMzMC45IDQ5LjcgMzEgNTAgMzEuMSA1MC4zQzMxLjIgNTAuNiAzMS4zIDUwLjkgMzEuNCA1MS4yQzMxLjUgNTEuNSAzMS42IDUxLjggMzEuNyA1Mi4xQzMxLjggNTIuNCAzMS45IDUyLjcgMzIgNTNDMzIuMSA1My4zIDMyLjIgNTMuNiAzMi4zIDUzLjlDMzIuNCA1NC4yIDMyLjUgNTQuNSAzMi42IDU0LjhDMzIuNyA1NS4xIDMyLjggNTUuNCAzMi45IDU1LjdDMzMIDU2IDMzLjEgNTYuMyAzMy4yIDU2LjZDMzMuMyA1Ni45IDMzLjQgNTcuMiAzMy41IDU3LjVDMzMuNiA1Ny44IDMzLjcgNTguMSAzMy44IDU4LjRDMzMuOSA1OC43IDM0IDU5IDM0LjEgNTkuM0MzNC4yIDU5LjYgMzQuMyA1OS45IDM0LjQgNjAuMkMzNC41IDYwLjUgMzQuNiA2MC44IDM0LjcgNjEuMUMzNC44IDYxLjQgMzQuOSA2MS43IDM1IDYyQzM1LjEgNjIuMyAzNS4yIDYyLjYgMzUuMyA2Mi45QzM1LjQgNjMuMiAzNS41IDYzLjUgMzUuNiA2My44QzM1LjcgNjQuMSAzNS44IDY0LjQgMzUuOSA2NC43QzM2IDY1IDM2LjEgNjUuMyAzNi4yIDY1LjZDMzYuMyA2NS45IDM2LjQgNjYuMiAzNi41IDY2LjVDMzYuNiA2Ni44IDM2LjcgNjcuMSAzNi44IDY3LjRDMzYuOSA2Ny43IDM3IDY4IDM3LjEgNjguM0MzNy4yIDY4LjYgMzcuMyA2OC45IDM3LjQgNjkuMkMzNy41IDY5LjUgMzcuNiA2OS44IDM3LjcgNzAuMUMzNy44IDcwLjQgMzcuOSA3MC43IDM4IDcxQzM4LjEgNzEuMyAzOC4yIDcxLjYgMzguMyA3MS45QzM4LjQgNzIuMiAzOC41IDcyLjUgMzguNiA3Mi44QzM4LjcgNzMuMSAzOC44IDczLjQgMzguOSA3My43QzM5IDc0IDM5LjEgNzQuMyAzOS4yIDc0LjZDMzkuMyA3NC45IDM5LjQgNzUuMiAzOS41IDc1LjVDMzkuNiA3NS44IDM5LjcgNzYuMSAzOS44IDc2LjRDMzkuOSA3Ni43IDQwIDc3IDQwLjEgNzcuM0M0MC4yIDc3LjYgNDAuMyA3Ny45IDQwLjQgNzguMkM0MC41IDc4LjUgNDAuNiA3OC44IDQwLjcgNzkuMUM0MC44IDc5LjQgNDAuOSA3OS43IDQxIDgwQzQxLjEgODAuMyA0MS4yIDgwLjYgNDEuMyA4MC45QzQxLjQgODEuMiA0MS41IDgxLjUgNDEuNiA4MS44QzQxLjcgODIuMSA0MS44IDgyLjQgNDEuOSA4Mi43QzQyIDgzIDQyLjEgODMuMyA0Mi4yIDgzLjZDNDEuNyA4Mi45IDQxLjIgODIuMiA0MC43IDgxLjVDNDAuMiA4MC44IDM5LjcgODAuMSAzOS4yIDc5LjRDMzguNyA3OC43IDM4LjIgNzggMzcuNyA3Ny4zQzM3LjIgNzYuNiAzNi43IDc1LjkgMzYuMiA3NS4yQzM1LjcgNzQuNSAzNS4yIDczLjggMzQuNyA3My4xQzM0LjIgNzIuNCAzMy43IDcxLjcgMzMuMiA3MUMzMi43IDcwLjMgMzIuMiA2OS42IDMxLjcgNjguOUMzMS4yIDY4LjIgMzAuNyA2Ny41IDMwLjIgNjYuOEMyOS43IDY2LjEgMjkuMiA2NS40IDI4LjcgNjQuN0MyOC4yIDY0IDI3LjcgNjMuMyAyNy4yIDYyLjZDMjYuNyA2MS45IDI2LjIgNjEuMiAyNS43IDYwLjVDMjUuMiA1OS44IDI0LjcgNTkuMSAyNC4yIDU4LjRDMjMuNyA1Ny43IDIzLjIgNTcgMjIuNyA1Ni4zQzIyLjIgNTUuNiAyMS43IDU0LjkgMjEuMiA1NC4yQzIwLjcgNTMuNSAyMC4yIDUyLjggMTkuNyA1Mi4xQzE5LjIgNTEuNCAxOC43IDUwLjcgMTguMiA1MEMxNy43IDQ5LjMgMTcuMiA0OC42IDE2LjcgNDcuOUMxNi4yIDQ3LjIgMTUuNyA0Ni41IDE1LjIgNDUuOEMxNC43IDQ1LjEgMTQuMiA0NC40IDEzLjcgNDMuN0wxMy40IDQzLjNMMTMuMSA0Mi45TDEyLjggNDIuNUwxMi41IDQyLjFMMTIuMiA0MS43TDExLjkgNDEuM0wxMS42IDQwLjlMMTEuMyA0MC41TDExIDQwLjFMMTAuNyAzOS43TDEwLjQgMzkuM0wxMC4xIDM4LjlMMOS44IDM4LjVMOS41IDM4LjFMOS4yIDM3LjdMOC45IDM3LjNMOC42IDM2LjlMOC4zIDM2LjVNOC4zIDM2LjVaIiBmaWxsPSIjRDM5RDM5Ii8+Cjwvc3ZnPgo=';
  }, []);

  return { optimizeImage, generateBlurHash };
};

// Accessibility hook for keyboard navigation
export const useKeyboardNavigation = (
  items: Array<{ id: string; element?: HTMLElement }>,
  onSelect?: (id: string) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length && onSelect) {
            onSelect(items[focusedIndex].id);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setFocusedIndex(-1);
          break;
      }
    },
    [items, focusedIndex, onSelect]
  );

  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < items.length) {
      const element = items[focusedIndex].element;
      if (element) {
        element.focus();
      }
    }
  }, [focusedIndex, items]);

  return { focusedIndex, handleKeyDown, setFocusedIndex };
};

// ARIA live region hook for screen reader announcements
export const useAriaLive = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);

    // Clear the announcement after it's been read
    setTimeout(() => {
      setAnnouncement('');
    }, 1000);
  }, []);

  return { announcement, announce };
};

// Focus management hook
export const useFocusManagement = (initialRef?: React.RefObject<HTMLElement>) => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const setFocus = useCallback((element: HTMLElement | null) => {
    if (element) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      element.focus();
      setFocusedElement(element);
    }
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      setFocusedElement(previousFocusRef.current);
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    focusedElement,
    setFocus,
    restoreFocus,
    trapFocus,
  };
};