import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualScroll, useDynamicVirtualScroll } from '../../hooks/useVirtualScroll';

// Mock DOM elements
const mockContainer = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  scrollTop: 0,
};

describe('useVirtualScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useRef
    vi.spyOn(require('react'), 'useRef').mockReturnValue({ current: mockContainer });
  });

  it('should return visible items for basic case', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 400,
        overscan: 2,
      })
    );

    expect(result.current.visibleItems).toHaveLength(10); // 400px / 50px + 2*2 overscan
    expect(result.current.totalHeight).toBe(5000); // 100 * 50
    expect(result.current.offsetY).toBe(0);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        items: [],
        itemHeight: 50,
        containerHeight: 400,
      })
    );

    expect(result.current.visibleItems).toHaveLength(0);
    expect(result.current.totalHeight).toBe(0);
    expect(result.current.offsetY).toBe(0);
  });

  it('should handle scroll position changes', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 400,
        overscan: 2,
      })
    );

    // Simulate scroll to middle
    act(() => {
      mockContainer.scrollTop = 2000;
      const scrollHandler = mockContainer.addEventListener.mock.calls[0][1];
      scrollHandler();
    });

    expect(result.current.visibleItems[0]?.index).toBeGreaterThan(0);
  });

  it('should provide scroll functions', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 400,
      })
    );

    expect(typeof result.current.scrollToIndex).toBe('function');
    expect(typeof result.current.scrollToTop).toBe('function');
    expect(typeof result.current.scrollToBottom).toBe('function');

    // Test scroll to index
    act(() => {
      result.current.scrollToIndex(10);
    });

    expect(mockContainer.scrollTop).toBe(500); // 10 * 50

    // Test scroll to top
    act(() => {
      result.current.scrollToTop();
    });

    expect(mockContainer.scrollTop).toBe(0);

    // Test scroll to bottom
    act(() => {
      result.current.scrollToBottom();
    });

    expect(mockContainer.scrollTop).toBe(5000); // totalHeight
  });

  it('should use custom getItemKey function', () => {
    const items = [
      { id: 'a', name: 'Item A' },
      { id: 'b', name: 'Item B' },
      { id: 'c', name: 'Item C' },
    ];

    const getItemKey = vi.fn((item, index) => item.id);

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 200,
        getItemKey,
      })
    );

    expect(getItemKey).toHaveBeenCalledTimes(3); // Should be called for each visible item
  });
});

describe('useDynamicVirtualScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useRef
    vi.spyOn(require('react'), 'useRef').mockReturnValue({ current: mockContainer });
  });

  it('should handle items with different heights', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const getItemHeight = vi.fn((item, index) => 50 + (index % 3) * 20); // Varying heights

    const { result } = renderHook(() =>
      useDynamicVirtualScroll({
        items,
        estimatedItemHeight: 50,
        containerHeight: 400,
        getItemHeight,
      })
    );

    expect(result.current.visibleItems).toHaveLength(10); // All items visible with 400px height
    expect(result.current.totalHeight).toBeGreaterThan(0);
    expect(getItemHeight).toHaveBeenCalled();
  });

  it('should measure item heights', () => {
    const items = [{ id: 1, name: 'Item 1' }];

    const getItemHeight = vi.fn(() => 100);

    const { result } = renderHook(() =>
      useDynamicVirtualScroll({
        items,
        estimatedItemHeight: 50,
        containerHeight: 400,
        getItemHeight,
      })
    );

    // Measure an item with custom height
    act(() => {
      result.current.measureItem(0, 150);
    });

    expect(getItemHeight).toHaveBeenCalled();
  });

  it('should calculate correct positions for dynamic heights', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const getItemHeight = vi.fn((item, index) => (index + 1) * 20); // 20, 40, 60, 80, 100

    const { result } = renderHook(() =>
      useDynamicVirtualScroll({
        items,
        estimatedItemHeight: 50,
        containerHeight: 300,
        getItemHeight,
      })
    );

    // Total height should be sum of all item heights
    const expectedTotalHeight = 20 + 40 + 60 + 80 + 100;
    expect(result.current.totalHeight).toBe(expectedTotalHeight);
  });

  it('should provide scroll functions for dynamic scroll', () => {
    const items = [{ id: 1, name: 'Item 1' }];

    const getItemHeight = vi.fn(() => 100);

    const { result } = renderHook(() =>
      useDynamicVirtualScroll({
        items,
        estimatedItemHeight: 50,
        containerHeight: 400,
        getItemHeight,
      })
    );

    expect(typeof result.current.scrollToIndex).toBe('function');
    expect(typeof result.current.scrollToTop).toBe('function');
    expect(typeof result.current.scrollToBottom).toBe('function');
    expect(typeof result.current.measureItem).toBe('function');

    // Test measure item
    act(() => {
      result.current.measureItem(0, 150);
    });
  });

  it('should handle empty items in dynamic scroll', () => {
    const getItemHeight = vi.fn();

    const { result } = renderHook(() =>
      useDynamicVirtualScroll({
        items: [],
        estimatedItemHeight: 50,
        containerHeight: 400,
        getItemHeight,
      })
    );

    expect(result.current.visibleItems).toHaveLength(0);
    expect(result.current.totalHeight).toBe(0);
    expect(getItemHeight).not.toHaveBeenCalled();
  });
});

// Test utility functions
describe('VirtualScroll Utils', () => {
  it('should handle edge cases with very large item counts', () => {
    const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 50,
        containerHeight: 400,
        overscan: 3,
      })
    );

    expect(result.current.totalHeight).toBe(500000); // 10000 * 50
    expect(result.current.visibleItems).toHaveLength(16); // 8 visible + 6 overscan
  });

  it('should handle very large item heights', () => {
    const items = [{ id: 1, name: 'Large Item' }];

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 2000,
        containerHeight: 400,
      })
    );

    expect(result.current.totalHeight).toBe(2000);
    expect(result.current.visibleItems).toHaveLength(1);
  });

  it('should handle zero item height', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const { result } = renderHook(() =>
      useVirtualScroll({
        items,
        itemHeight: 0,
        containerHeight: 400,
      })
    );

    // Should not crash, handle gracefully
    expect(result.current.totalHeight).toBe(0);
    expect(result.current.visibleItems).toHaveLength(0);
  });
});