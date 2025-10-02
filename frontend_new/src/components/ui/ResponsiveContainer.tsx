import React from 'react';
import { useResponsive, containerMaxWidths } from '../../utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'none';
  fluid?: boolean;
  as?: React.ElementType;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'xl',
  fluid = false,
  as: Component = 'div',
}) => {
  const { currentBreakpoint } = useResponsive();

  const getMaxWidthClass = () => {
    if (fluid) return '';
    if (maxWidth === 'none') return '';
    return `max-w-${containerMaxWidths[maxWidth]}`;
  };

  return (
    <Component
      className={`
        w-full mx-auto px-4 sm:px-6 lg:px-8
        ${getMaxWidthClass()}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </Component>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { xs: 1, md: 2, lg: 3 },
  gap = 'md',
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const gridColsClasses = Object.entries(cols)
    .map(([breakpoint, colCount]) => {
      if (breakpoint === 'xs') return `grid-cols-${colCount}`;
      return `${breakpoint}:grid-cols-${colCount}`;
    })
    .join(' ');

  return (
    <div
      className={`
        grid
        ${gridColsClasses}
        ${gapClasses[gap]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
};

interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    xs?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
    xl?: 'row' | 'col';
    '2xl'?: 'row' | 'col';
  };
  wrap?: boolean;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  className = '',
  direction = { xs: 'col', md: 'row' },
  wrap = false,
  justify = 'start',
  align = 'start',
  gap = 'md',
}) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  const directionClasses = Object.entries(direction)
    .map(([breakpoint, dir]) => {
      if (breakpoint === 'xs') return `flex-${dir}`;
      return `${breakpoint}:flex-${dir}`;
    })
    .join(' ');

  return (
    <div
      className={`
        flex
        ${directionClasses}
        ${wrap ? 'flex-wrap' : ''}
        justify-${justify}
        items-${align}
        ${gapClasses[gap]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
};

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  size?: {
    xs?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    sm?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    md?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    lg?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    xl?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    '2xl'?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  };
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'accent' | 'muted' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right' | 'justify';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  size = { xs: 'base', sm: 'base', md: 'base' },
  weight = 'normal',
  color = 'muted',
  align = 'left',
}) => {
  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    accent: 'text-accent-600 dark:text-accent-400',
    muted: 'text-gray-600 dark:text-gray-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
  };

  const sizeClasses = Object.entries(size)
    .map(([breakpoint, textSize]) => {
      if (breakpoint === 'xs') return `text-${textSize}`;
      return `${breakpoint}:text-${textSize}`;
    })
    .join(' ');

  return (
    <span
      className={`
        ${sizeClasses}
        ${weightClasses[weight]}
        ${colorClasses[color]}
        text-${align}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </span>
  );
};

interface ResponsiveSpacingProps {
  className?: string;
  padding?: {
    xs?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    sm?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    md?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    lg?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    xl?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    '2xl'?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  };
  margin?: {
    xs?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    sm?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    md?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    lg?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    xl?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
    '2xl'?: 'sm' | 'md' | 'lg' | 'xl' | 'none';
  };
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  className = '',
  padding = { xs: 'md' },
  margin = { xs: 'none' },
}) => {
  const getSpacingClass = (type: 'padding' | 'margin', value: string, breakpoint?: string) => {
    const prefix = type === 'padding' ? 'p' : 'm';
    if (value === 'none') return '';
    const bp = breakpoint ? `${breakpoint}:` : '';
    return `${bp}${prefix}-${value}`;
  };

  const paddingClasses = Object.entries(padding)
    .map(([breakpoint, value]) => getSpacingClass('padding', value, breakpoint === 'xs' ? undefined : breakpoint))
    .filter(Boolean)
    .join(' ');

  const marginClasses = Object.entries(margin)
    .map(([breakpoint, value]) => getSpacingClass('margin', value, breakpoint === 'xs' ? undefined : breakpoint))
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`
        ${paddingClasses}
        ${marginClasses}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
};