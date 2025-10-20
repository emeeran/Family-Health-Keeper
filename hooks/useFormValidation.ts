
/**
 * Comprehensive Form Validation Hook
 * Provides form validation with real-time feedback, error handling, and accessibility
 */

import { useState, useCallback, useEffect } from 'react';
import { validate, type ValidationRule, type ValidationResult } from '../utils/validation';
import { useCentralizedErrorHandler } from './useCentralizedErrorHandler';

export interface FormFieldConfig {
  name: string;
  label: string;
  rules: ValidationRule[];
  defaultValue?: unknown;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormConfig {
  fields: Record<string, FormFieldConfig>;
  validateOnSubmit?: boolean;
  showRealtimeErrors?: boolean;
  focusFirstError?: boolean;
}

export interface FormValidationState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  submittedCount: number;
}

export interface UseFormValidationReturn {
  // State
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  
  // Actions
  setValue: (name: string, value: unknown) => void;
  setValues: (values: Record<string, unknown>) => void;
  setError: (name: string, error: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (name: string) => void;
  clearErrors: () => void;
  validateField: (name: string, value?: unknown) => ValidationResult;
  validateForm: () => ValidationResult;
  handleSubmit: (onSubmit: (values: Record<string, unknown>) => void | Promise<void>) => (e?: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  
  // Helpers
  getFieldProps: (name: string) => {
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error?: string;
    isTouched: boolean;
    isValid: boolean;
  };
}

export const useFormValidation = (config: FormConfig): UseFormValidationReturn => {
  const { handleError } = useCentralizedErrorHandler();
  const {
    fields,
    validateOnSubmit = true,
    showRealtimeErrors = true,
    focusFirstError = true
  } = config;

  // Initialize form state
  const getInitialValues = (): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    Object.entries(fields).forEach(([name, field]) => {
      values[name] = field.defaultValue ?? '';
    });
    return values;
  };

  const [state, setState] = useState<FormValidationState>({
    values: getInitialValues(),
    errors: {},
    touched: {},
    isValid: false,
    isSubmitting: false,
    submittedCount: 0
  });

  // Validate a single field
  const validateField = useCallback((name: string, value?: unknown): ValidationResult => {
    const fieldConfig = fields[name];
    if (!fieldConfig) {
      return { isValid: true, errors: [] };
    }

    const fieldValue = value !== undefined ? value : state.values[name];
    const result = validate(fieldValue, fieldConfig.rules);

    // Update error state
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [name]: result.isValid ? '' : result.errors[0] || ''
      }
    }));

    return result;
  }, [fields, state.values]);

  // Validate the entire form
  const validateForm = useCallback((): ValidationResult => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};

    Object.entries(fields).forEach(([name, fieldConfig]) => {
      const value = state.values[name];
      const result = validate(value, fieldConfig.rules);
      
      if (!result.isValid) {
        errors.push(...result.errors);
        fieldErrors[name] = result.errors[0] || '';
      }
    });

    setState(prev => ({
      ...prev,
      errors: fieldErrors,
      isValid: errors.length === 0
    }));

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [fields, state.values]);

  // Set field value
  const setValue = useCallback((name: string, value: unknown) => {
    setState(prev => {
      const newValues = { ...prev.values, [name]: value };
      const fieldConfig = fields[name];
      
      // Validate on change if configured
      if (fieldConfig?.validateOnChange && showRealtimeErrors) {
        const result = validate(value, fieldConfig.rules);
        return {
          ...prev,
          values: newValues,
          errors: {
            ...prev.errors,
            [name]: result.isValid ? '' : result.errors[0] || ''
          }
        };
      }

      return { ...prev, values: newValues };
    });
  }, [fields, showRealtimeErrors]);

  return {
    values: state.values,
    errors: state.errors,
    isValid,
    isDirty,
    validateField,
    validateAll,
    setValue,
    setError,
    clearErrors,
    reset
  };
};
