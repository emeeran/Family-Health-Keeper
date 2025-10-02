import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualScrollOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string;
}

interface VirtualScrollResult<T> {
  visibleItems: Array<{ item: T; index: number }>;
  totalHeight: number;
  offsetY: number;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  getItemKey = (item, index) => index.toString(),
}: VirtualScrollOptions<T>): VirtualScrollResult<T> {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items
    .slice(startIndex, endIndex + 1)
    .map((item, index) => ({
      item,
      index: startIndex + index,
    }));

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, [itemHeight]);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  return {
    visibleItems,
    totalHeight,
    offsetY: startIndex * itemHeight,
    containerRef,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
  };
}

interface DynamicVirtualScrollOptions<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemHeight: (item: T, index: number) => number;
  getItemKey?: (item: T, index: number) => string;
}

interface DynamicVirtualScrollResult<T> extends VirtualScrollResult<T> {
  measureItem: (index: number, height: number) => void;
}

export function useDynamicVirtualScroll<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  overscan = 3,
  getItemHeight,
  getItemKey = (item, index) => index.toString(),
}: DynamicVirtualScrollOptions<T>): DynamicVirtualScrollResult<T> {
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getItemHeightWithCache = useCallback((index: number): number => {
    return itemHeights.get(index) || estimatedItemHeight;
  }, [itemHeights, estimatedItemHeight]);

  const measureItem = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  }, []);

  // Calculate positions and visible items
  const positions = useRef<Array<{ top: number; height: number }>>([]);

  useEffect(() => {
    positions.current = [];
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeightWithCache(i);
      positions.current[i] = { top: currentTop, height };
      currentTop += height;
    }
  }, [items, itemHeights, getItemHeightWithCache]);

  const totalHeight = positions.current[positions.current.length - 1]?.top +
                      positions.current[positions.current.length - 1]?.height || 0;

  let startIndex = 0;
  let endIndex = items.length - 1;

  // Find visible range
  for (let i = 0; i < positions.current.length; i++) {
    const pos = positions.current[i];
    if (pos.top + pos.height < scrollTop - containerHeight * overscan) {
      startIndex = i + 1;
    } else if (pos.top > scrollTop + containerHeight * (1 + overscan)) {
      endIndex = i - 1;
      break;
    }
  }

  startIndex = Math.max(0, startIndex - overscan);
  endIndex = Math.min(items.length - 1, endIndex + overscan);

  const visibleItems = items
    .slice(startIndex, endIndex + 1)
    .map((item, index) => ({
      item,
      index: startIndex + index,
    }));

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToIndex = useCallback((index: number) => {
    if (containerRef.current && positions.current[index]) {
      containerRef.current.scrollTop = positions.current[index].top;
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight;
    }
  }, [totalHeight]);

  return {
    visibleItems,
    totalHeight,
    offsetY: positions.current[startIndex]?.top || 0,
    containerRef,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    measureItem,
  };
}