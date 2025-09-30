/**
 * Offline Storage Utilities
 *
 * This module provides offline capabilities for the Family Health Keeper app,
 * including IndexedDB storage, service worker registration, and data synchronization.
 */

export interface OfflineConfig {
  dbName: string;
  dbVersion: number;
  stores: {
    patients: string;
    doctors: string;
    syncQueue: string;
    settings: string;
  };
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'patient' | 'doctor' | 'record' | 'document' | 'reminder' | 'medication';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface OfflineStatus {
  isOnline: boolean;
  isOfflineMode: boolean;
  hasPendingSync: boolean;
  lastSyncTime: number | null;
  pendingOperations: number;
  syncQueue: SyncOperation[];
}

export interface OfflineSettings {
  autoSync: boolean;
  syncInterval: number; // in minutes
  maxRetryAttempts: number;
  storageQuota: number; // in MB
  enableOfflineMode: boolean;
}

const DEFAULT_CONFIG: OfflineConfig = {
  dbName: 'FamilyHealthKeeperDB',
  dbVersion: 1,
  stores: {
    patients: 'patients',
    doctors: 'doctors',
    syncQueue: 'syncQueue',
    settings: 'settings'
  }
};

const DEFAULT_SETTINGS: OfflineSettings = {
  autoSync: true,
  syncInterval: 5,
  maxRetryAttempts: 3,
  storageQuota: 100,
  enableOfflineMode: true
};

class OfflineStorageManager {
  private db: IDBDatabase | null = null;
  private config: OfflineConfig;
  private settings: OfflineSettings;
  private syncIntervalId: number | null = null;
  private status: OfflineStatus;
  private listeners: Set<(status: OfflineStatus) => void> = new Set();

  constructor(config: OfflineConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.settings = DEFAULT_SETTINGS;
    this.status = {
      isOnline: navigator.onLine,
      isOfflineMode: false,
      hasPendingSync: false,
      lastSyncTime: null,
      pendingOperations: 0,
      syncQueue: []
    };

    this.initializeEventListeners();
  }

  /**
   * Initialize the offline storage
   */
  async initialize(): Promise<void> {
    try {
      await this.initializeDB();
      await this.loadSettings();
      this.updateStatus();
      this.startAutoSync();

      console.log('Offline storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      throw error;
    }
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(this.config.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });

            // Create indexes for the sync queue
            if (storeName === this.config.stores.syncQueue) {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('entity', 'entity', { unique: false });
            }
          }
        });
      };
    });
  }

  /**
   * Load offline settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const settings = await this.getFromStore(this.config.stores.settings, 'offline-settings');
      if (settings) {
        this.settings = { ...this.settings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load offline settings, using defaults:', error);
    }
  }

  /**
   * Save offline settings
   */
  async saveSettings(settings: Partial<OfflineSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveToStore(this.config.stores.settings, 'offline-settings', this.settings);
  }

  /**
   * Initialize event listeners for online/offline status
   */
  private initializeEventListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.updateStatus();
      if (this.settings.autoSync) {
        this.syncPendingOperations();
      }
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.updateStatus();
    });
  }

  /**
   * Register service worker for offline functionality
   */
  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_COMPLETE') {
            this.handleSyncComplete(event.data.operations);
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Save data to IndexedDB
   */
  async saveToStore(storeName: string, key: string, data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...data, id: key });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get data from IndexedDB
   */
  async getFromStore<T>(storeName: string, key: string): Promise<T | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data || null);
    });
  }

  /**
   * Get all data from a store
   */
  async getAllFromStore<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.map(item => item.data));
    });
  }

  /**
   * Delete data from IndexedDB
   */
  async deleteFromStore(storeName: string, key: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Queue a sync operation
   */
  async queueSyncOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status'>): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending'
    };

    await this.saveToStore(this.config.stores.syncQueue, syncOp.id, syncOp);
    this.updateStatus();

    if (this.status.isOnline && this.settings.autoSync) {
      this.syncPendingOperations();
    }
  }

  /**
   * Get pending sync operations
   */
  async getPendingOperations(): Promise<SyncOperation[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.stores.syncQueue, 'readonly');
      const store = transaction.objectStore(this.config.stores.syncQueue);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Sync pending operations
   */
  async syncPendingOperations(): Promise<void> {
    if (!this.status.isOnline) {
      return;
    }

    const operations = await this.getPendingOperations();
    if (operations.length === 0) {
      return;
    }

    this.status.hasPendingSync = true;
    this.updateStatus();

    const successfulOps: SyncOperation[] = [];
    const failedOps: SyncOperation[] = [];

    for (const operation of operations) {
      try {
        await this.executeSyncOperation(operation);
        successfulOps.push(operation);
      } catch (error) {
        console.error('Sync operation failed:', operation, error);

        // Update operation status
        operation.retryCount++;
        operation.status = operation.retryCount >= this.settings.maxRetryAttempts ? 'failed' : 'pending';
        await this.saveToStore(this.config.stores.syncQueue, operation.id, operation);

        if (operation.status === 'failed') {
          failedOps.push(operation);
        }
      }
    }

    // Remove successful operations from queue
    for (const op of successfulOps) {
      await this.deleteFromStore(this.config.stores.syncQueue, op.id);
    }

    this.status.lastSyncTime = Date.now();
    this.updateStatus();

    // Notify service worker about completed sync
    if (successfulOps.length > 0) {
      this.notifyServiceWorker('SYNC_COMPLETE', { operations: successfulOps });
    }

    if (failedOps.length > 0) {
      console.warn(`${failedOps.length} sync operations failed`);
    }
  }

  /**
   * Execute a single sync operation
   */
  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    // Mark as syncing
    operation.status = 'syncing';
    await this.saveToStore(this.config.stores.syncQueue, operation.id, operation);

    // Simulate sync operation (in real app, this would make API calls)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate success
    operation.status = 'completed';
  }

  /**
   * Notify service worker about events
   */
  private notifyServiceWorker(type: string, data: any): void {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, data });
    }
  }

  /**
   * Start auto-sync interval
   */
  private startAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    if (this.settings.autoSync && this.settings.syncInterval > 0) {
      this.syncIntervalId = window.setInterval(() => {
        if (this.status.isOnline) {
          this.syncPendingOperations();
        }
      }, this.settings.syncInterval * 60 * 1000);
    }
  }

  /**
   * Stop auto-sync interval
   */
  private stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Update status and notify listeners
   */
  private async updateStatus(): Promise<void> {
    const pendingOps = await this.getPendingOperations();

    this.status = {
      ...this.status,
      hasPendingSync: pendingOps.length > 0,
      pendingOperations: pendingOps.length,
      syncQueue: pendingOps
    };

    this.listeners.forEach(listener => listener(this.status));
  }

  /**
   * Subscribe to status changes
   */
  subscribe(listener: (status: OfflineStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current status
   */
  getStatus(): OfflineStatus {
    return { ...this.status };
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const storeNames = Object.values(this.config.stores);
    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }

    this.updateStatus();
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota(): Promise<{ used: number; total: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const available = total - used;

      return {
        used: Math.round(used / 1024 / 1024), // Convert to MB
        total: Math.round(total / 1024 / 1024),
        available: Math.round(available / 1024 / 1024)
      };
    }

    return { used: 0, total: 0, available: 0 };
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const isPersistent = await navigator.storage.persist();
        return isPersistent;
      } catch (error) {
        console.warn('Failed to request persistent storage:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoSync();
    this.listeners.clear();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager();
export default OfflineStorageManager;