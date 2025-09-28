# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Health Keeper is a React + TypeScript application for managing family medical records. It's a Vite-based SPA that allows users to track patient information, medical records, medications, reminders, and documents. The application integrates with Google's Gemini AI for assistance features and includes PDF export capabilities.

## Development Commands

### Essential Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on port 3000/3001)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Environment Setup
- Create `.env.local` file with `GEMINI_API_KEY` for AI functionality
- The app expects `GEMINI_API_KEY` to be set for AI assistant features

## Architecture

### Core Structure
- **App.tsx** - Main application component with state management for patients, doctors, and records
- **types.ts** - TypeScript interfaces for all data models (Patient, Doctor, MedicalRecord, etc.)
- **constants.ts** - Initial data with sample patients and doctors
- **databaseService.ts** - IndexedDB service for persistent storage

### Data Persistence
- **IndexedDB** - Browser-based database for persistent storage
- **Automatic initialization** - Database is initialized on app load with sample data
- **Fallback mechanism** - Falls back to in-memory data if database fails
- **Loading states** - UI shows loading indicator while database initializes

### Component Architecture
- **Sidebar** - Patient navigation and record management
- **PatientDetails** - Main patient information display with editable forms
- **Header** - Application header showing current patient info
- **AIAssistant** - Gemini AI integration for medical record assistance
- **CurrentMedications** - Medication management interface
- **ReminderList** - Task and appointment reminders
- **PatientEditModal/DoctorEditModal** - CRUD operations for patients and doctors

### Services
- **geminiService.ts** - Google Gemini API integration for AI-powered features
- **pdfService.ts** - PDF generation for patient records export
- **databaseService.ts** - IndexedDB CRUD operations for all data types

### Custom Hooks
- **useDebounce.ts** - Utility hook for debouncing input values

## Key Features

### Data Management
- **Persistent storage** - All data stored in IndexedDB for persistence across sessions
- Patient CRUD operations with medical history tracking
- Medical record management with document attachments
- Doctor management system
- Medication tracking with dosage and scheduling
- Reminder system for appointments and medications

### Database Schema
- **patients** - Patient information with medical history
- **doctors** - Doctor information with specialty
- **medicalRecords** - Medical visit records with documents
- **reminders** - Appointment and medication reminders
- **medications** - Current patient medications
- **documents** - Attached documents for medical records

### File Handling
- Document upload (PDFs and images, max 10MB)
- Base64 encoding for file storage
- PDF export functionality for complete patient records

### AI Integration
- Gemini AI assistant for analyzing medical records
- Context-aware suggestions based on patient history
- Integration requires valid GEMINI_API_KEY

## Development Notes

### State Management
- Uses React useState hooks for local state
- IndexedDB for persistent storage
- Synchronization between local state and database
- No external state management library

### Database Operations
- All CRUD operations are wrapped in try-catch blocks
- User feedback for failed operations via alert messages
- Automatic initialization with sample data on first load
- Graceful fallback to in-memory data if database unavailable

### Styling
- Uses CSS classes with dark/light theme support
- Material Design icons via Google Fonts
- Responsive layout with flexbox

### File Paths
- Uses `@/` alias configured for root directory imports
- TypeScript path mapping in tsconfig.json

### Environment Variables
- `GEMINI_API_KEY` - Required for AI assistant functionality
- Loaded from `.env.local` file
- Injected via Vite's define config

## Database Service API

### Core Methods
- `init()` - Initialize database
- `initializeWithSampleData()` - Load sample data if database is empty
- `getAll<T>(storeName)` - Get all records from a store
- `getById<T>(storeName, id)` - Get record by ID
- `save<T>(storeName, data)` - Save or update record
- `delete(storeName, id)` - Delete record
- `getByIndex<T>(storeName, indexName, key)` - Get records by index

### Store-specific Methods
- Patient operations: `getAllPatients()`, `savePatient()`, `deletePatient()`
- Doctor operations: `getAllDoctors()`, `saveDoctor()`, `deleteDoctor()`
- Medical record operations: `getAllMedicalRecords()`, `saveMedicalRecord()`, `deleteMedicalRecord()`
- Reminder operations: `getAllReminders()`, `saveReminder()`, `deleteReminder()`
- Medication operations: `getAllMedications()`, `saveMedication()`, `deleteMedication()`