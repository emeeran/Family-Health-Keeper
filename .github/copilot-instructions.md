# Family Health Keeper - AI Agent Instructions

## Overview
Family Health Keeper is a React-based PWA for managing patient medical records, medications, and reminders. The app uses Zustand for state management, Google Gemini AI for insights, and includes offline capabilities with encryption.

## Architecture & Key Patterns

### Store Architecture (Zustand + Slices)
- **Primary Store**: `stores/useAppStore.ts` - Unified interface combining all slices
- **Slice Pattern**: Modular stores in `stores/slices/` (patientStore, doctorStore, uiStore, formStore, searchStore)
- **State Shape**: Each slice manages its domain (patients, doctors, UI state) but exports through unified store
- **Usage**: Import `useAppStore` hook, destructure needed state/actions

### Data Layer & Types
- **Core Types**: `types.ts` - Patient, Doctor, MedicalRecord, Medication, Reminder, Document
- **Mock Data**: `constants.ts` - PATIENTS and DOCTORS arrays with realistic medical data
- **Validation**: `utils/validation.ts` - Zod schemas for all entities with safe validation helpers
- **ID Generation**: `utils/uniqueId.ts` - Handles ID generation and duplicate detection

### Component Structure
- **Flat Component Architecture**: Components in root `/components/` directory
- **Feature Components**: Some organized in `/features/` with domain-specific components
- **UI Components**: Reusable components in `components/ui/` (AccessibleButton, LoadingSpinner, etc.)
- **Modal Pattern**: EditModal components (PatientEditModal, DoctorEditModal) follow consistent props pattern

### Services & External Integration
- **Gemini AI**: `services/geminiService.ts` - Medical insights, drug interactions, AI assistant
  - Fallback to Hugging Face when quota exceeded
  - Environment variable: `GEMINI_API_KEY` (mapped from `API_KEY` in vite config)
- **PDF Generation**: `services/pdfService.ts` - Patient record exports

### Security & Offline Features
- **Encryption**: `utils/encryption.ts` - Web Crypto API for medical data encryption
- **Offline Storage**: `utils/offlineStorage.ts` - IndexedDB with sync queue for offline operations
- **Service Worker**: `public/sw.js` - Cache strategies and offline asset management
- **Performance**: `utils/performanceMonitor.ts` - Performance tracking and optimization

## Development Workflows

### Environment Setup
```bash
npm install
# Set GEMINI_API_KEY in .env.local
npm run dev  # Starts on localhost:3000
```

### Testing
- **Framework**: Vitest with jsdom environment
- **Setup**: `src/test/setup.ts` - Mocks for window.matchMedia, ResizeObserver, IntersectionObserver
- **Run**: Tests organized in `src/test/` directory
- **Coverage**: Configured to exclude test files and entry points

### Build & Deployment
- **Vite Config**: Custom chunk splitting (vendor, utils, components)
- **Environment Variables**: `GEMINI_API_KEY` injected as `process.env.API_KEY`
- **PWA**: Manifest and service worker for offline capabilities

## Critical Conventions

### Form & Validation Patterns
- Use `useForm` hook from `hooks/useForm.ts` for form state management
- All entity validation through Zod schemas in `utils/validation.ts`
- Error handling: `safeValidate*` functions return `{ success, data, error }` objects
- Form fields use `validateFormField` helper for real-time validation

### Async Operations
- **Hook**: `useAsyncOperation` for loading states, error handling, and retry logic
- **Pattern**: Loading boundaries with `LoadingBoundary` component
- **Error Handling**: `ErrorBoundary` component for React error boundaries

### State Management Rules
- Use unified `useAppStore` hook - never access slice stores directly
- Actions return result objects: `{ success: boolean; error?: string; [entity]?: T }`
- ID generation through utils, not manual string creation
- Duplicate detection built into add operations

### AI Integration Patterns
- Gemini service handles medical insights, drug interactions, and AI chat
- Quota management with automatic fallback to Hugging Face
- Medical prompts include patient context for personalized responses
- AI responses cached to prevent redundant API calls

### Security Requirements
- All medical data encrypted before storage using `EncryptionManager`
- Password-based key derivation for user authentication
- Offline sync queue encrypted and versioned
- File uploads validated for size (10MB limit) and type

## Key File References
- **Entry Point**: `App.tsx` - Main application with theme management
- **Store Root**: `stores/useAppStore.ts` - All state management
- **Type Definitions**: `types.ts` - Core data structures
- **Validation**: `utils/validation.ts` - Data validation schemas
- **Offline Sync**: `utils/offlineStorage.ts` - IndexedDB and sync logic
- **AI Service**: `services/geminiService.ts` - Medical AI integration