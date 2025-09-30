import { useState, useCallback } from 'react';

export interface FormField {
  name: string;
  value: string | number | boolean;
  error?: string;
  touched?: boolean;
}

export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Record<string, string>;
  validateOnChange?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: (values?: T) => void;
  setFieldValue: (name: keyof T, value: T[keyof T]) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, touched: boolean) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  validateOnChange = false
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form
  const validateForm = useCallback((currentValues: T): Record<string, string> => {
    if (!validate) return {};

    const validationErrors = validate(currentValues);
    return validationErrors;
  }, [validate]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

  // Handle field change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setValues(prev => ({ ...prev, [name]: fieldValue }));

    // Validate on change if enabled
    if (validateOnChange) {
      const newValues = { ...values, [name]: fieldValue };
      const validationErrors = validateForm(newValues);
      setErrors(validationErrors);
    }

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [values, validateOnChange, validateForm]);

  // Handle field blur
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;

    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate on blur
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
  }, [values, validateForm]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    // Validate form
    const validationErrors = validateForm(values);
    setErrors(validationErrors);

    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback((newValues?: T) => {
    const resetValues = newValues || initialValues;
    setValues(resetValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value }));

    // Validate after setting value
    if (validateOnChange) {
      const newValues = { ...values, [name]: value };
      const validationErrors = validateForm(newValues);
      setErrors(validationErrors);
    }
  }, [values, validateOnChange, validateForm]);

  // Set field error programmatically
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name as string]: error }));
  }, []);

  // Set field touched state programmatically
  const setFieldTouched = useCallback((name: keyof T, isTouched: boolean) => {
    setTouched(prev => ({ ...prev, [name as string]: isTouched }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setFieldTouched
  };
}

// Hook for debounced input
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Check for Ctrl/Cmd combinations
      if ((e.ctrlKey || e.metaKey) && shortcuts[`ctrl+${key}`]) {
        e.preventDefault();
        shortcuts[`ctrl+${key}`]();
      }

      // Check for single keys
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Hook for local storage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}