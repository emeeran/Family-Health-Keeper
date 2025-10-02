// UI Components Library - Accessibility First
export { default as AccessibleButton } from './AccessibleButton';
export { default as AccessibleInput } from './AccessibleInput';
export { default as AccessibleModal } from './AccessibleModal';
export { default as LoadingSpinner } from './LoadingSpinner';

// Re-export hooks for convenience
export {
  useDebounce,
  useThrottle,
  useVirtualizedList,
  useLazyLoad,
  useMemoizedCallback,
  useMemoizedValue,
  usePerformanceMonitor,
  useImageOptimization,
  useKeyboardNavigation,
  useAriaLive,
  useFocusManagement,
} from '../../hooks/usePerformanceOptimizations';
