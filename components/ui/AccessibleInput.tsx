import React, { forwardRef } from 'react';

export interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      helperText,
      required = false,
      leftIcon,
      rightIcon,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const describedBy = [];

    if (error) {
      describedBy.push(`${inputId}-error`);
    }
    if (helperText) {
      describedBy.push(`${inputId}-helper`);
    }

    const containerClassName = `
      relative
      ${className}
    `.trim();

    const inputClassName = `
      w-full px-3 py-2 text-sm border rounded-md
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error
        ? 'border-red-300 focus:ring-red-500 dark:border-red-600'
        : 'border-gray-300 dark:border-gray-600'
      }
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className={containerClassName}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClassName}
            aria-invalid={!!error}
            aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
            aria-required={required}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';