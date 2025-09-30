import { useState, useCallback } from 'react';

export interface AsyncOperationResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<T | null>;
  reset: () => void;
}

export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    retryCount?: number;
    retryDelay?: number;
  } = {}
): AsyncOperationResult<T> {
  const {
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true);
    setError(null);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retryCount + 1; attempt++) {
      try {
        const result = await operation();
        setData(result);
        onSuccess?.(result);
        return result;
      } catch (err) {
        lastError = err as Error;

        if (attempt <= retryCount) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * attempt)
          );
        }
      }
    }

    setError(lastError);
    onError?.(lastError!);
    return null;
  }, [operation, onSuccess, onError, retryCount, retryDelay]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

export function useAsyncOperations<T extends Record<string, (...args: any[]) => Promise<any>>>(
  operations: T
): {
  [K in keyof T]: AsyncOperationResult<Awaited<ReturnType<T[K]>>>;
} {
  const result = {} as any;

  for (const key in operations) {
    result[key] = useAsyncOperation(operations[key]);
  }

  return result;
}