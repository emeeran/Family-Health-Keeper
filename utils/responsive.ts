/**
 * Responsive design utilities and breakpoints for Family Health Keeper
 */

export interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const breakpoints: Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
};

export const containerMaxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Hook for responsive design utilities
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isXs = windowSize.width >= breakpoints.xs;
  const isSm = windowSize.width >= breakpoints.sm;
  const isMd = windowSize.width >= breakpoints.md;
  const isLg = windowSize.width >= breakpoints.lg;
  const isXl = windowSize.width >= breakpoints.xl;
  const is2xl = windowSize.width >= breakpoints['2xl'];

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;

  const currentBreakpoint = Object.entries(breakpoints)
    .reverse()
    .find(([, value]) => windowSize.width >= value)?.[0] || 'xs';

  return {
    windowSize,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
  };
};

/**
 * Responsive grid utilities
 */
export const gridUtils = {
  getGridCols: (breakpoint: keyof Breakpoints, cols: number) => {
    const gridClasses: Record<keyof Breakpoints, Record<number, string>> = {
      xs: {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        6: 'grid-cols-6',
        12: 'grid-cols-12',
      },
      sm: {
        1: 'sm:grid-cols-1',
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-3',
        4: 'sm:grid-cols-4',
        6: 'sm:grid-cols-6',
        12: 'sm:grid-cols-12',
      },
      md: {
        1: 'md:grid-cols-1',
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        6: 'md:grid-cols-6',
        12: 'md:grid-cols-12',
      },
      lg: {
        1: 'lg:grid-cols-1',
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
        6: 'lg:grid-cols-6',
        12: 'lg:grid-cols-12',
      },
      xl: {
        1: 'xl:grid-cols-1',
        2: 'xl:grid-cols-2',
        3: 'xl:grid-cols-3',
        4: 'xl:grid-cols-4',
        6: 'xl:grid-cols-6',
        12: 'xl:grid-cols-12',
      },
      '2xl': {
        1: '2xl:grid-cols-1',
        2: '2xl:grid-cols-2',
        3: '2xl:grid-cols-3',
        4: '2xl:grid-cols-4',
        6: '2xl:grid-cols-6',
        12: '2xl:grid-cols-12',
      },
    };

    return gridClasses[breakpoint]?.[cols] || '';
  },
};

/**
 * Responsive spacing utilities
 */
export const spacingUtils = {
  getPadding: (breakpoint: keyof Breakpoints, size: 'sm' | 'md' | 'lg' | 'xl') => {
    const spacingMap = {
      sm: { xs: 'p-2', sm: 'sm:p-2', md: 'md:p-2', lg: 'lg:p-2', xl: 'xl:p-2', '2xl': '2xl:p-2' },
      md: { xs: 'p-4', sm: 'sm:p-4', md: 'md:p-4', lg: 'lg:p-4', xl: 'xl:p-4', '2xl': '2xl:p-4' },
      lg: { xs: 'p-6', sm: 'sm:p-6', md: 'md:p-6', lg: 'lg:p-6', xl: 'xl:p-6', '2xl': '2xl:p-6' },
      xl: { xs: 'p-8', sm: 'sm:p-8', md: 'md:p-8', lg: 'lg:p-8', xl: 'xl:p-8', '2xl': '2xl:p-8' },
    };

    return spacingMap[size][breakpoint];
  },

  getMargin: (breakpoint: keyof Breakpoints, size: 'sm' | 'md' | 'lg' | 'xl') => {
    const spacingMap = {
      sm: { xs: 'm-2', sm: 'sm:m-2', md: 'md:m-2', lg: 'lg:m-2', xl: 'xl:m-2', '2xl': '2xl:m-2' },
      md: { xs: 'm-4', sm: 'sm:m-4', md: 'md:m-4', lg: 'lg:m-4', xl: 'xl:m-4', '2xl': '2xl:m-4' },
      lg: { xs: 'm-6', sm: 'sm:m-6', md: 'md:m-6', lg: 'lg:m-6', xl: 'xl:m-6', '2xl': '2xl:m-6' },
      xl: { xs: 'm-8', sm: 'sm:m-8', md: 'md:m-8', lg: 'lg:m-8', xl: 'xl:m-8', '2xl': '2xl:m-8' },
    };

    return spacingMap[size][breakpoint];
  },
};

/**
 * Responsive text utilities
 */
export const textUtils = {
  getTextSize: (breakpoint: keyof Breakpoints, size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl') => {
    const textMap = {
      xs: { xs: 'text-xs', sm: 'sm:text-xs', md: 'md:text-xs', lg: 'lg:text-xs', xl: 'xl:text-xs', '2xl': '2xl:text-xs' },
      sm: { xs: 'text-sm', sm: 'sm:text-sm', md: 'md:text-sm', lg: 'lg:text-sm', xl: 'xl:text-sm', '2xl': '2xl:text-sm' },
      base: { xs: 'text-base', sm: 'sm:text-base', md: 'md:text-base', lg: 'lg:text-base', xl: 'xl:text-base', '2xl': '2xl:text-base' },
      lg: { xs: 'text-lg', sm: 'sm:text-lg', md: 'md:text-lg', lg: 'lg:text-lg', xl: 'xl:text-lg', '2xl': '2xl:text-lg' },
      xl: { xs: 'text-xl', sm: 'sm:text-xl', md: 'md:text-xl', lg: 'lg:text-xl', xl: 'xl:text-xl', '2xl': '2xl:text-xl' },
      '2xl': { xs: 'text-2xl', sm: 'sm:text-2xl', md: 'md:text-2xl', lg: 'lg:text-2xl', xl: 'xl:text-2xl', '2xl': '2xl:text-2xl' },
      '3xl': { xs: 'text-3xl', sm: 'sm:text-3xl', md: 'md:text-3xl', lg: 'lg:text-3xl', xl: 'xl:text-3xl', '2xl': '2xl:text-3xl' },
    };

    return textMap[size][breakpoint];
  },
};

import { useState, useEffect } from 'react';