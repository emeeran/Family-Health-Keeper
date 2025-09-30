import React, { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const iconSizeStyles = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const buttonClassName = `
      inline-flex items-center justify-center gap-2 rounded-md
      font-medium transition-colors
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${loading ? 'cursor-wait' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const renderIcon = () => {
      if (loading) {
        return <LoadingSpinner size="sm" />;
      }
      if (icon) {
        return (
          <span className={iconSizeStyles[size]} aria-hidden="true">
            {icon}
          </span>
        );
      }
      return null;
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={buttonClassName}
        {...props}
      >
        {iconPosition === 'left' && renderIcon()}
        {children && <span>{children}</span>}
        {iconPosition === 'right' && renderIcon()}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';