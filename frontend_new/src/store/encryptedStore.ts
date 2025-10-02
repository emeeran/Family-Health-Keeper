import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EncryptionManager, type EncryptedStore, type EncryptionOptions } from '../utils/encryption';
import type { Patient, Doctor } from '../types';
import type { AppState } from './types';

interface EncryptedStoreState {
  // Encryption state
  isEncrypted: boolean;
  encryptionPassword: string | null;
  encryptionKey: string | null;
  lastEncryptionUpdate: number | null;

  // Actions
  setEncryptionPassword: (password: string) => void;
  removeEncryption: () => void;
  changeEncryptionPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  encryptAndSave: (patients: Patient[], doctors: Doctor[]) => Promise<boolean>;
  decryptAndLoad: () => Promise<{ patients: Patient[]; doctors: Doctor[] } | null>;
  isEncryptionAvailable: () => boolean;
}

const ENCRYPTED_STORAGE_KEY = 'family-health-keeper-encrypted';

const useEncryptedStoreBase = create<EncryptedStoreState>()((set, get) => ({
  isEncrypted: false,
  encryptionPassword: null,
  encryptionKey: null,
  lastEncryptionUpdate: null,

  setEncryptionPassword: (password: string) => {
    set({
      encryptionPassword: password,
      encryptionKey: btoa(password + '_salt'), // Simple key derivation
      lastEncryptionUpdate: Date.now()
    });
  },

  removeEncryption: () => {
    set({
      isEncrypted: false,
      encryptionPassword: null,
      encryptionKey: null,
      lastEncryptionUpdate: null
    });

    // Remove encrypted data from localStorage
    try {
      localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to remove encrypted data:', error);
    }
  },

  changeEncryptionPassword: async (oldPassword: string, newPassword: string) => {
    const state = get();

    if (!state.encryptionPassword || state.encryptionPassword !== oldPassword) {
      return false;
    }

    // Get current encrypted data
    const encryptedDataStr = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
    if (!encryptedDataStr) {
      return false;
    }

    try {
      const encryptedStore = JSON.parse(encryptedDataStr) as EncryptedStore;

      // Change password
      const newEncryptedStore = await EncryptionManager.changePassword(
        encryptedStore,
        oldPassword,
        newPassword
      );

      // Save with new password
      localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(newEncryptedStore));

      // Update store state
      set({
        encryptionPassword: newPassword,
        encryptionKey: btoa(newPassword + '_salt'),
        lastEncryptionUpdate: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Failed to change encryption password:', error);
      return false;
    }
  },

  verifyPassword: async (password: string) => {
    try {
      const encryptedDataStr = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
      if (!encryptedDataStr) return false;

      const encryptedStore = JSON.parse(encryptedDataStr) as EncryptedStore;
      return await EncryptionManager.verifyPassword(encryptedStore, password);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  },

  encryptAndSave: async (patients: Patient[], doctors: Doctor[]) => {
    const state = get();

    if (!state.encryptionPassword) {
      console.error('No encryption password set');
      return false;
    }

    try {
      const encryptedStore = await EncryptionManager.encryptStore(
        patients,
        doctors,
        state.encryptionPassword
      );

      localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(encryptedStore));

      set({
        isEncrypted: true,
        lastEncryptionUpdate: Date.now()
      });

      return true;
    } catch (error) {
      console.error('Failed to encrypt and save data:', error);
      return false;
    }
  },

  decryptAndLoad: async () => {
    const state = get();

    if (!state.encryptionPassword) {
      console.error('No encryption password set');
      return null;
    }

    try {
      const encryptedDataStr = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
      if (!encryptedDataStr) return null;

      const encryptedStore = JSON.parse(encryptedDataStr) as EncryptedStore;
      const decryptedData = await EncryptionManager.decryptStore(
        encryptedStore,
        state.encryptionPassword
      );

      return {
        patients: decryptedData.patients as Patient[],
        doctors: decryptedData.doctors as Doctor[]
      };
    } catch (error) {
      console.error('Failed to decrypt and load data:', error);
      return null;
    }
  },

  isEncryptionAvailable: () => {
    return EncryptionManager.isCryptoAvailable();
  }
}));

// Create a custom storage that uses encryption
const createEncryptedStorage = (password: string) => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      if (name !== 'family-health-keeper-app') return null;

      try {
        const encryptedDataStr = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
        if (!encryptedDataStr) return null;

        const encryptedStore = JSON.parse(encryptedDataStr) as EncryptedStore;
        const decryptedData = await EncryptionManager.decryptStore(
          encryptedStore,
          password
        );

        return JSON.stringify({
          patients: decryptedData.patients,
          doctors: decryptedData.doctors,
          theme: 'light' // Default theme
        });
      } catch (error) {
        console.error('Failed to get encrypted item:', error);
        return null;
      }
    },

    setItem: async (name: string, value: string): Promise<void> => {
      if (name !== 'family-health-keeper-app') return;

      try {
        const data = JSON.parse(value);
        const encryptedStore = await EncryptionManager.encryptStore(
          data.patients || [],
          data.doctors || [],
          password
        );

        localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(encryptedStore));
      } catch (error) {
        console.error('Failed to set encrypted item:', error);
      }
    },

    removeItem: async (name: string): Promise<void> => {
      if (name !== 'family-health-keeper-app') return;
      localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
    }
  };
};

// Export the encrypted store
export const useEncryptedStore = useEncryptedStoreBase;

// Higher-order function to create an encrypted version of any store
export const createEncryptedStore = <T extends AppState>(
  storeCreator: any,
  getPassword: () => string | null
) => {
  return create<T>()(
    persist(
      storeCreator,
      {
        name: 'family-health-keeper-app',
        storage: createJSONStorage(() => ({
          getItem: (name: string) => {
            const password = getPassword();
            if (!password) return null;

            try {
              const encryptedDataStr = localStorage.getItem(ENCRYPTED_STORAGE_KEY);
              if (!encryptedDataStr) return null;

              const encryptedStore = JSON.parse(encryptedDataStr) as EncryptedStore;
              const decryptedData = EncryptionManager.decryptStoreSync(
                encryptedStore,
                password
              );

              return JSON.stringify({
                patients: decryptedData.patients,
                doctors: decryptedData.doctors,
                theme: 'light'
              });
            } catch (error) {
              console.error('Failed to get encrypted item:', error);
              return null;
            }
          },
          setItem: (name: string, value: string) => {
            const password = getPassword();
            if (!password) return;

            try {
              const data = JSON.parse(value);
              const encryptedStore = EncryptionManager.encryptStoreSync(
                data.patients || [],
                data.doctors || [],
                password
              );

              localStorage.setItem(ENCRYPTED_STORAGE_KEY, JSON.stringify(encryptedStore));
            } catch (error) {
              console.error('Failed to set encrypted item:', error);
            }
          },
          removeItem: (name: string) => {
            localStorage.removeItem(ENCRYPTED_STORAGE_KEY);
          }
        })),
        partialize: (state: T) => ({
          patients: state.patients,
          doctors: state.doctors,
          theme: state.theme
        })
      }
    )
  );
};

// Synchronous versions for compatibility (with limitations)
export namespace EncryptionManagerSync {
  export function encryptStoreSync(
    patients: unknown[],
    doctors: unknown[],
    password: string
  ): EncryptedStore {
    // This is a simplified synchronous version
    // In production, you'd want to use Web Workers or handle async properly
    const data = JSON.stringify({ patients, doctors });
    const encoded = btoa(password + data);

    return {
      patients: encoded,
      doctors: encoded,
      timestamp: Date.now(),
      version: '1.0.0-sync'
    };
  }

  export function decryptStoreSync(
    encryptedStore: EncryptedStore,
    password: string
  ): { patients: unknown[]; doctors: unknown[] } {
    // This is a simplified synchronous version
    const decoded = atob(encryptedStore.patients);
    const data = JSON.parse(decoded.replace(password, ''));

    return {
      patients: data.patients || [],
      doctors: data.doctors || []
    };
  }
}