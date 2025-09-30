import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardNavigation,
  useModalKeyboardNavigation,
  useListKeyboardNavigation,
} from '../../hooks/useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  let mockAddEventListener: vi.Mock;
  let mockRemoveEventListener: vi.Mock;

  beforeEach(() => {
    mockAddEventListener = vi.fn();
    mockRemoveEventListener = vi.fn();

    // Mock window.addEventListener
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
    });
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should setup and cleanup event listeners', () => {
    const { unmount } = renderHook(() =>
      useKeyboardNavigation({
        onEscape: vi.fn(),
      })
    );

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.any(Object)
    );

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });

  it('should call onEscape when Escape key is pressed', () => {
    const onEscape = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onEscape,
      })
    );

    // Simulate Escape key press
    const keydownHandler = mockAddEventListener.mock.calls[0][1];
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    keydownHandler(mockEvent);

    expect(onEscape).toHaveBeenCalled();
    expect(mockEvent.defaultPrevented).toBe(true);
  });

  it('should call onEnter when Enter key is pressed', () => {
    const onEnter = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onEnter,
      })
    );

    // Simulate Enter key press
    const keydownHandler = mockAddEventListener.mock.calls[0][1];
    const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    keydownHandler(mockEvent);

    expect(onEnter).toHaveBeenCalled();
    expect(mockEvent.defaultPrevented).toBe(true);
  });

  it('should call arrow key handlers', () => {
    const onArrowUp = vi.fn();
    const onArrowDown = vi.fn();
    const onArrowLeft = vi.fn();
    const onArrowRight = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onArrowUp,
        onArrowDown,
        onArrowLeft,
        onArrowRight,
      })
    );

    const keydownHandler = mockAddEventListener.mock.calls[0][1];

    // Test arrow keys
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(onArrowUp).toHaveBeenCalled();

    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(onArrowDown).toHaveBeenCalled();

    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(onArrowLeft).toHaveBeenCalled();

    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(onArrowRight).toHaveBeenCalled();
  });

  it('should handle Tab key with and without Shift', () => {
    const onTab = vi.fn();
    const onShiftTab = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onTab,
        onShiftTab,
      })
    );

    const keydownHandler = mockAddEventListener.mock.calls[0][1];

    // Test regular Tab
    keydownHandler(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(onTab).toHaveBeenCalled();

    // Test Shift+Tab
    keydownHandler(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
    expect(onShiftTab).toHaveBeenCalled();
  });

  it('should not prevent default when preventDefault is false', () => {
    const onEscape = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onEscape,
        preventDefault: false,
      })
    );

    const keydownHandler = mockAddEventListener.mock.calls[0][1];
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    keydownHandler(mockEvent);

    expect(onEscape).toHaveBeenCalled();
    expect(mockEvent.defaultPrevented).toBe(false);
  });

  it('should work with custom target element', () => {
    const mockTarget = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const { unmount } = renderHook(() =>
      useKeyboardNavigation({
        onEscape: vi.fn(),
        target: mockTarget as any,
      })
    );

    expect(mockTarget.addEventListener).toHaveBeenCalled();
    expect(mockAddEventListener).not.toHaveBeenCalled();

    unmount();

    expect(mockTarget.removeEventListener).toHaveBeenCalled();
  });

  it('should not call handlers for unregistered keys', () => {
    const onEscape = vi.fn();
    const onEnter = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onEscape,
        onEnter,
      })
    );

    const keydownHandler = mockAddEventListener.mock.calls[0][1];

    // Test unregistered key
    keydownHandler(new KeyboardEvent('keydown', { key: 'Space' }));

    expect(onEscape).not.toHaveBeenCalled();
    expect(onEnter).not.toHaveBeenCalled();
  });
});

describe('useModalKeyboardNavigation', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
    });
  });

  it('should setup modal keyboard navigation', () => {
    const onClose = vi.fn();
    const onSave = vi.fn();

    renderHook(() =>
      useModalKeyboardNavigation(onClose, onSave)
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Test Escape
    keydownHandler(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalled();

    // Test Enter
    keydownHandler(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onSave).toHaveBeenCalled();
  });

  it('should work with dependencies array', () => {
    const onClose = vi.fn();
    const dependency = vi.fn();

    const { rerender } = renderHook(
      ({ dep }) => useModalKeyboardNavigation(onClose, undefined, [dep]),
      {
        initialProps: { dep: dependency },
      }
    );

    // Rerender with same dependency should not re-setup
    rerender({ dep: dependency });
    expect(window.addEventListener).toHaveBeenCalledTimes(1);
  });
});

describe('useListKeyboardNavigation', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
    });
  });

  it('should handle list navigation with arrow keys', () => {
    const items = ['item1', 'item2', 'item3'];
    const setSelectedIndex = vi.fn();
    const onSelect = vi.fn();

    renderHook(() =>
      useListKeyboardNavigation(items, 0, setSelectedIndex, onSelect)
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Test ArrowUp (should not go below 0)
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(setSelectedIndex).not.toHaveBeenCalled(); // Already at index 0

    // Test ArrowDown
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(setSelectedIndex).toHaveBeenCalledWith(1);

    // Test Enter to select
    keydownHandler(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onSelect).toHaveBeenCalledWith('item2'); // Current selected item
  });

  it('should handle list boundaries correctly', () => {
    const items = ['item1', 'item2', 'item3'];
    const setSelectedIndex = vi.fn();

    renderHook(() =>
      useListKeyboardNavigation(items, 2, setSelectedIndex) // Start at last item
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Test ArrowDown at last item (should not go beyond)
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(setSelectedIndex).not.toHaveBeenCalled();
  });

  it('should work with empty items array', () => {
    const setSelectedIndex = vi.fn();
    const onSelect = vi.fn();

    renderHook(() =>
      useListKeyboardNavigation([], 0, setSelectedIndex, onSelect)
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Should not crash when no items
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    keydownHandler(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(setSelectedIndex).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should work without onSelect handler', () => {
    const items = ['item1', 'item2'];
    const setSelectedIndex = vi.fn();

    renderHook(() =>
      useListKeyboardNavigation(items, 0, setSelectedIndex)
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Should not crash when Enter pressed without onSelect
    keydownHandler(new KeyboardEvent('keydown', { key: 'Enter' }));
  });

  it('should respect dependencies array', () => {
    const items = ['item1', 'item2'];
    const setSelectedIndex = vi.fn();
    const dependency = vi.fn();

    const { rerender } = renderHook(
      ({ deps }) => useListKeyboardNavigation(items, 0, setSelectedIndex, undefined, deps),
      {
        initialProps: { deps: [dependency] },
      }
    );

    rerender({ deps: [dependency] }); // Same dependency
    expect(window.addEventListener).toHaveBeenCalledTimes(1);
  });
});

describe('Keyboard Navigation Edge Cases', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'addEventListener', {
      value: vi.fn(),
    });
  });

  it('should handle rapid key presses', () => {
    const onArrowDown = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onArrowDown,
      })
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Simulate rapid key presses
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

    expect(onArrowDown).toHaveBeenCalledTimes(3);
  });

  it('should handle key events with repeat flag', () => {
    const onArrowDown = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onArrowDown,
      })
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Simulate key repeat
    keydownHandler(new KeyboardEvent('keydown', { key: 'ArrowDown', repeat: true }));

    expect(onArrowDown).toHaveBeenCalled(); // Should still handle repeat keys
  });

  it('should handle modifiers other than Shift for Tab', () => {
    const onTab = vi.fn();
    const onShiftTab = vi.fn();

    renderHook(() =>
      useKeyboardNavigation({
        onTab,
        onShiftTab,
      })
    );

    const keydownHandler = window.addEventListener.mock.calls[0][1];

    // Test Tab with Ctrl (should call regular Tab handler)
    keydownHandler(new KeyboardEvent('keydown', { key: 'Tab', ctrlKey: true }));
    expect(onTab).toHaveBeenCalled();
    expect(onShiftTab).not.toHaveBeenCalled();
  });
});