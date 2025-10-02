import { useCallback, useRef, useEffect } from 'react';
import { performancePipeline } from '../services/performancePipeline';

export const usePerformancePipeline = (operationName: string) => {
  const endOperationRef = useRef<(() => void) | null>(null);

  const startOperation = useCallback(() => {
    endOperationRef.current = performancePipeline.startOperation(operationName);
  }, [operationName]);

  const endOperation = useCallback(() => {
    if (endOperationRef.current) {
      endOperationRef.current();
      endOperationRef.current = null;
    }
  }, []);

  const measureOperation = useCallback((fn: () => void) => {
    const endOp = performancePipeline.startOperation(operationName);
    try {
      fn();
    } finally {
      endOp();
    }
  }, [operationName]);

  const measureAsyncOperation = useCallback(async (fn: () => Promise<void>) => {
    const endOp = performancePipeline.startOperation(operationName);
    try {
      await fn();
    } finally {
      endOp();
    }
  }, [operationName]);

  useEffect(() => {
    return () => {
      // Clean up any ongoing operations when component unmounts
      endOperation();
    };
  }, [endOperation]);

  return {
    startOperation,
    endOperation,
    measureOperation,
    measureAsyncOperation
  };
};