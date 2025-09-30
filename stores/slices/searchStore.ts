import { create } from 'zustand';
import type { StoreSlice } from '../types';

interface SearchState {
  searchQuery: string;

  // Actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

const useSearchStoreBase = create<SearchState>()((set) => ({
  searchQuery: '',

  // Search Actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  clearSearch: () => set({ searchQuery: '' }),
}));

export const useSearchStore: StoreSlice<SearchState> = {
  useStore: useSearchStoreBase,
  getState: useSearchStoreBase.getState,
  subscribe: useSearchStoreBase.subscribe,
};