import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, type OfflineStatus, type SyncOperation } from '../utils/offlineStorage';
import type { Patient, Doctor } from '../types';

interface UseOfflineDataOptions {
  autoSync?: boolean;
  enableOfflineStorage?: boolean;
}

interface UseOfflineDataResult {
  status: OfflineStatus | null;
  isLoading: boolean;
  isOnline: boolean;
  isOffline: boolean;
  hasPendingSync: boolean;
  sync: () => Promise<void>;
  savePatient: (patient: Patient) => Promise<void>;
  saveDoctor: (doctor: Doctor) => Promise<void>;
  getPatients: () => Promise<Patient[]>;
  getDoctors: () => Promise<Doctor[]>;
  clearOfflineData: () => Promise<void>;
  requestPersistentStorage: () => Promise<boolean>;
}

export function useOfflineData(
  options: UseOfflineDataOptions = {}
): UseOfflineDataResult {
  const {
    autoSync = true,
    enableOfflineStorage = true
  } = options;

  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize offline storage
  useEffect(() => {
    const initialize = async () => {
      if (!enableOfflineStorage) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await offlineStorage.initialize();

        // Get initial status
        const initialStatus = offlineStorage.getStatus();
        setStatus(initialStatus);

        // Subscribe to status updates
        offlineStorage.subscribe((newStatus) => {
          setStatus(newStatus);
        });

        // Register service worker
        await offlineStorage.registerServiceWorker();

        // Start auto sync if enabled
        if (autoSync) {
          // Auto sync will be handled by the offlineStorage internal timer
        }
      } catch (error) {
        console.error('Failed to initialize offline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      // Cleanup is handled by the offlineStorage instance
    };
  }, [autoSync, enableOfflineStorage]);

  // Synchronize pending operations
  const sync = useCallback(async () => {
    if (!enableOfflineStorage) return;

    try {
      await offlineStorage.syncPendingOperations();
    } catch (error) {
      console.error('Failed to sync:', error);
      throw error;
    }
  }, [enableOfflineStorage]);

  // Save patient with offline support
  const savePatient = useCallback(async (patient: Patient) => {
    if (!enableOfflineStorage) return;

    try {
      // Always save to IndexedDB for offline access
      await offlineStorage.saveToStore('patients', patient.id, patient);

      // Queue sync operation if offline or if it's a new patient
      const isNewPatient = !patient.id.startsWith('patient-');
      if (!status?.isOnline || isNewPatient) {
        await offlineStorage.queueSyncOperation({
          type: isNewPatient ? 'create' : 'update',
          entity: 'patient',
          entityId: patient.id,
          data: patient,
          retryCount: 0
        });
      }
    } catch (error) {
      console.error('Failed to save patient offline:', error);
      throw error;
    }
  }, [enableOfflineStorage, status?.isOnline]);

  // Save doctor with offline support
  const saveDoctor = useCallback(async (doctor: Doctor) => {
    if (!enableOfflineStorage) return;

    try {
      // Always save to IndexedDB for offline access
      await offlineStorage.saveToStore('doctors', doctor.id, doctor);

      // Queue sync operation if offline or if it's a new doctor
      const isNewDoctor = !doctor.id.startsWith('doctor-');
      if (!status?.isOnline || isNewDoctor) {
        await offlineStorage.queueSyncOperation({
          type: isNewDoctor ? 'create' : 'update',
          entity: 'doctor',
          entityId: doctor.id,
          data: doctor,
          retryCount: 0
        });
      }
    } catch (error) {
      console.error('Failed to save doctor offline:', error);
      throw error;
    }
  }, [enableOfflineStorage, status?.isOnline]);

  // Get patients from offline storage
  const getPatients = useCallback(async (): Promise<Patient[]> => {
    if (!enableOfflineStorage) return [];

    try {
      return await offlineStorage.getAllFromStore<Patient>('patients');
    } catch (error) {
      console.error('Failed to get patients from offline storage:', error);
      return [];
    }
  }, [enableOfflineStorage]);

  // Get doctors from offline storage
  const getDoctors = useCallback(async (): Promise<Doctor[]> => {
    if (!enableOfflineStorage) return [];

    try {
      return await offlineStorage.getAllFromStore<Doctor>('doctors');
    } catch (error) {
      console.error('Failed to get doctors from offline storage:', error);
      return [];
    }
  }, [enableOfflineStorage]);

  // Clear all offline data
  const clearOfflineData = useCallback(async () => {
    if (!enableOfflineStorage) return;

    try {
      await offlineStorage.clearAllData();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }, [enableOfflineStorage]);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    if (!enableOfflineStorage) return false;

    try {
      return await offlineStorage.requestPersistentStorage();
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }, [enableOfflineStorage]);

  return {
    status,
    isLoading,
    isOnline: status?.isOnline ?? false,
    isOffline: !(status?.isOnline ?? false),
    hasPendingSync: status?.hasPendingSync ?? false,
    sync,
    savePatient,
    saveDoctor,
    getPatients,
    getDoctors,
    clearOfflineData,
    requestPersistentStorage
  };
}

// Hook for offline form handling
export function useOfflineForm<T>(
  initialData: T,
  options: {
    onSave?: (data: T) => Promise<void>;
    autoSave?: boolean;
    autoSaveDelay?: number;
  } = {}
) {
  const {
    onSave,
    autoSave = false,
    autoSaveDelay = 3000
  } = options;

  const [formData, setFormData] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Handle auto-save
    if (autoSave && onSave) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(async () => {
        try {
          setIsSaving(true);
          await onSave(formData);
          setIsDirty(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, autoSaveDelay);

      setAutoSaveTimer(timer);
    }
  }, [autoSave, autoSaveDelay, autoSaveTimer, formData, onSave]);

  const save = useCallback(async () => {
    if (!onSave) return;

    try {
      setIsSaving(true);
      await onSave(formData);
      setIsDirty(false);

      // Clear auto-save timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        setAutoSaveTimer(null);
      }
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [onSave, formData, autoSaveTimer]);

  const reset = useCallback(() => {
    setFormData(initialData);
    setIsDirty(false);

    // Clear auto-save timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(null);
    }
  }, [initialData, autoSaveTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  return {
    formData,
    setFormData,
    updateField,
    isDirty,
    isSaving,
    save,
    reset
  };
}

// Hook for offline image handling
export function useOfflineImage() {
  const [isCaching, setIsCaching] = useState(false);

  const cacheImage = useCallback(async (imageUrl: string, imageData: Blob): Promise<void> => {
    try {
      setIsCaching(true);

      // Store image in IndexedDB for offline use
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          // Store base64 representation in IndexedDB
          const cacheKey = `image-${imageUrl.replace(/[^a-zA-Z0-9]/g, '-')}`;
          await offlineStorage.saveToStore('images', cacheKey, {
            url: imageUrl,
            data: event.target.result,
            timestamp: Date.now()
          });
        }
      };
      reader.readAsDataURL(imageData);
    } catch (error) {
      console.error('Failed to cache image:', error);
    } finally {
      setIsCaching(false);
    }
  }, []);

  const getCachedImage = useCallback(async (imageUrl: string): Promise<string | null> => {
    try {
      const cacheKey = `image-${imageUrl.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const cached = await offlineStorage.getFromStore<{ data: string; timestamp: number }>('images', cacheKey);
      return cached?.data || null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }, []);

  return {
    cacheImage,
    getCachedImage,
    isCaching
  };
}