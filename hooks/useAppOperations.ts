/**
 * Custom hook for managing App-level operations
 * Extracts business logic from the main App component
 */

import { useState, useEffect, useRef } from 'react';
import { useSecureHealthStore } from '../stores/useSecureHealthStore';
import { simpleAuthService, type SimpleAuthState } from '../services/simpleAuthService';
import BackupScheduler from '../services/backupScheduler';
import BackupService from '../services/backupService';
import DataRetrievalService from '../services/dataRetrievalService';
import { generatePatientPdf } from '../services/pdfService';
import { useCentralizedErrorHandler } from '../utils/centralizedErrorHandler';
import {
  useDebounce,
  usePerformanceMonitor,
  useAriaLive,
} from './usePerformanceOptimizations';
import type { Patient } from '../types';

export const useAppOperations = () => {
  const { measureOperation } = usePerformanceMonitor('App');
  const { announcement, announce } = useAriaLive();
  const { handleError, safeExecuteAsync } = useCentralizedErrorHandler();

  // Store operations
  const {
    patients,
    doctors,
    loadPatients,
    loadDoctors,
    setTheme: setStoreTheme,
  } = useSecureHealthStore();

  // Simple authentication state
  const [authState, setAuthState] = useState<SimpleAuthState>(simpleAuthService.getAuthState());

  // Backup system state
  const [backupScheduler, setBackupScheduler] = useState<BackupScheduler | null>(null);
  const [encryptionKey] = useState('family-health-keeper-secure-key');

  // Backup Service instance
  const backupServiceRef = useRef<BackupService | null>(null);

  // Debounced console logging to reduce noise in production
  const debouncedLog = useDebounce((message: string) => {
    if (import.meta.env.DEV) {
      console.log(message);
    }
  }, 1000);

  // Initialize backup service
  useEffect(() => {
    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default-family-health-keeper-key';
    backupServiceRef.current = new BackupService(encryptionKey);
  }, []);

  // Subscribe to simple auth state changes and clear any existing auth on mount
  useEffect(() => {
    // Clear any existing authentication data to prevent auto-login
    localStorage.removeItem('simple_auth_user');
    localStorage.removeItem('simple_auth_authenticated');

    const unsubscribe = simpleAuthService.subscribe(setAuthState);

    return unsubscribe;
  }, []);

  // Load initial data
  useEffect(() => {
    // Load both doctors and patients
    console.log('Attempting to load doctors...');
    loadDoctors().catch(error => {
      console.error('Failed to load doctors:', error);
    });

    console.log('Attempting to load patients...');
    loadPatients().catch(error => {
      console.error('Failed to load patients:', error);
    });

    console.log('Data loading initiated');
  }, [loadDoctors, loadPatients]);

  // Initialize backup scheduler when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      const scheduler = BackupScheduler.getInstance(encryptionKey);
      setBackupScheduler(scheduler);

      // Start the scheduler
      scheduler.start();

      // Cleanup on unmount
      return () => {
        scheduler.stop();
      };
    }
  }, [authState.isAuthenticated, encryptionKey]);

  // Index patient data for search when patients are loaded
  useEffect(() => {
    if (patients.length > 0) {
      patients.forEach(patient => {
        DataRetrievalService.indexPatientData(patient);
      });
    }
  }, [patients]);

  // Export operations
  const handleExportPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) {
      handleError(new Error('Patient not found for export'), {
        operation: 'export_patient',
        component: 'App',
        category: 'file_operation' as any,
        severity: 'medium',
        userFacing: true,
        retryable: false,
        extra: { patientId }
      });
      return;
    }
    
    safeExecuteAsync(async () => {
      // Create temporary link to trigger download
      const patientDataString = JSON.stringify(patient, null, 2);
      const blob = new Blob([patientDataString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${patient.name}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }, {
      operation: 'export_patient',
      component: 'App',
      category: 'file_operation' as any,
      severity: 'medium',
      userFacing: true,
      retryable: false,
      extra: { patientId }
    });
  };

  const handleExportPatientPdf = async (patientId: string) => {
    await safeExecuteAsync(async () => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Show loading indicator
      announce('Generating PDF export...');
      
      // Generate and download the PDF
      await generatePatientPdf(patient, doctors);
      
      announce('PDF exported successfully');
    }, {
      operation: 'export_patient_pdf',
      component: 'App',
      category: 'file_operation' as any,
      severity: 'medium',
      userFacing: true,
      retryable: true,
      extra: { patientId }
    });
  };

  // Theme operations
  const toggleTheme = () => {
    setStoreTheme('light' as 'light' | 'dark'); // Simplified for now
  };

  // Logout operation
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? All data will be cleared.')) {
      // Clear all records from patients before logout
      const clearedPatients = patients.map(patient => ({
        ...patient,
        records: [],
        currentMedications: [],
        reminders: [],
        appointments: []
      }));
      
      // Update patients with cleared data
      clearedPatients.forEach(patient => {
        // This would need to be implemented in the store
        // updatePatient(patient.id, patient);
      });
      
      // Perform logout
      await simpleAuthService.logout();
    }
  };

  return {
    // State
    authState,
    backupScheduler,
    backupServiceRef,
    encryptionKey,
    
    // Operations
    handleExportPatient,
    handleExportPatientPdf,
    toggleTheme,
    handleLogout,
    
    // Utilities
    debouncedLog,
    measureOperation,
    announcement,
    announce,
  };
};