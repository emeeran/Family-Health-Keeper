import { create } from 'zustand';
import type { StoreSlice } from '../types';

interface UIState {
  theme: 'light' | 'dark';
  isEditing: boolean;

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setIsEditing: (editing: boolean) => void;
  initializeTheme: () => void;
}

const useUIStoreBase = create<UIState>()((set) => ({
  theme: 'light',
  isEditing: false,

  // UI Actions
  setTheme: (theme) => {
    set({ theme });

    // Apply theme to DOM
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', theme);
  },

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';

    // Apply theme to DOM
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Save to localStorage
    localStorage.setItem('theme', newTheme);

    return { theme: newTheme };
  }),

  setIsEditing: (editing) => set({ isEditing: editing }),

  initializeTheme: () => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    set({ theme });

    // Apply theme to DOM
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },
}));

export const useUIStore: StoreSlice<UIState> = {
  useStore: useUIStoreBase,
  getState: useUIStoreBase.getState,
  subscribe: useUIStoreBase.subscribe,
};