import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (e: KeyboardEvent) => void;
  onShiftTab?: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  target?: HTMLElement | Window;
}

export const useKeyboardNavigation = (
  options: KeyboardNavigationOptions,
  dependencies: any[] = []
) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    preventDefault = true,
    target = window,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            if (preventDefault) event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            if (preventDefault) event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            if (preventDefault) event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            if (preventDefault) event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            if (preventDefault) event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            if (preventDefault) event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Tab':
          if (event.shiftKey && onShiftTab) {
            if (preventDefault) event.preventDefault();
            onShiftTab(event);
          } else if (!event.shiftKey && onTab) {
            if (preventDefault) event.preventDefault();
            onTab(event);
          }
          break;
      }
    },
    [
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
      preventDefault,
    ]
  );

  useEffect(() => {
    const element = target === window ? window : target;
    element.addEventListener('keydown', handleKeyDown as any);
    return () => {
      element.removeEventListener('keydown', handleKeyDown as any);
    };
  }, [handleKeyDown, target, ...dependencies]);
};

export const useModalKeyboardNavigation = (
  onClose: () => void,
  onSave?: () => void,
  dependencies: any[] = []
) => {
  useKeyboardNavigation(
    {
      onEscape: onClose,
      onEnter: onSave,
      preventDefault: true,
    },
    [onClose, onSave, ...dependencies]
  );
};

export const useListKeyboardNavigation = (
  items: any[],
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  onSelect?: (item: any) => void,
  dependencies: any[] = []
) => {
  useKeyboardNavigation(
    {
      onArrowUp: () => {
        if (selectedIndex > 0) {
          setSelectedIndex(selectedIndex - 1);
        }
      },
      onArrowDown: () => {
        if (selectedIndex < items.length - 1) {
          setSelectedIndex(selectedIndex + 1);
        }
      },
      onEnter: () => {
        if (onSelect && selectedIndex >= 0 && selectedIndex < items.length) {
          onSelect(items[selectedIndex]);
        }
      },
      preventDefault: true,
    },
    [items, selectedIndex, setSelectedIndex, onSelect, ...dependencies]
  );
};