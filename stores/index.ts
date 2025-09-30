/**
 * Store Architecture - Modular State Management
 *
 * This file exports all store slices and provides a unified interface
 * for accessing application state with proper TypeScript typing.
 */

export * from './slices/patientStore';
export * from './slices/doctorStore';
export * from './slices/uiStore';
export * from './slices/formStore';
export * from './slices/searchStore';

// Re-export the combined store interface
export type { AppState } from './types';
export { useAppStore } from './useAppStore';