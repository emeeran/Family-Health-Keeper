import React, { forwardRef } from 'react';

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    helperText,
    variant = 'default',
    size = 'md',
    leftIcon,
    rightIcon,
    required = false,
    className = '',
    id,
    ...props
  }, ref) => {
    const inputId = id || "input-" + Math.random().toString(36).substring(2, 9);
    const errorId = error ? inputId + "-error" : undefined;
    const helperId = helperText ? inputId + "-helper" : undefined;

    const baseStyles = 'block w-full rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
      filled: 'border-transparent bg-gray-100 focus:border-blue-500 focus:ring-blue-500',
      outlined: 'border-2 border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-500',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const paddingStyles = leftIcon && rightIcon ? 'pl-10 pr-10' : 
                         leftIcon ? 'pl-10' : 
                         rightIcon ? 'pr-10' : '';

    const inputClasses = baseStyles + ' ' + variantStyles[variant] + ' ' + sizeStyles[size] + ' ' + paddingStyles + ' ' + className + ' ' +
      (error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '');

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            aria-required={required}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 sm:text-sm" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div 
            id={errorId}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {helperText && !error && (
          <div 
            id={helperId}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
