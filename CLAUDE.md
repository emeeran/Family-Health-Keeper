# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Family Health Keeper is a React + TypeScript application for managing family medical records. It's a Vite-based SPA that allows users to track patient information, medical records, medications, reminders, and documents. The application integrates with Google's Gemini AI for assistance features and includes PDF export capabilities.

## Development Commands

### Essential Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server (runs on port 3000)
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

### Custom Hooks
- **useDebounce.ts** - Utility hook for debouncing input values

## Key Features

### Data Management
- Patient CRUD operations with medical history tracking
- Medical record management with document attachments
- Doctor management system
- Medication tracking with dosage and scheduling
- Reminder system for appointments and medications

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
- No external state management library
- Data is stored in component state (not persisted)

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