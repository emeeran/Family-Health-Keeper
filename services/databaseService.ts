import type { Patient, Doctor, MedicalRecord, Reminder, Medication, Document } from '../types';

interface DatabaseSchema {
  patients: Patient;
  doctors: Doctor;
  medicalRecords: MedicalRecord;
  reminders: Reminder;
  medications: Medication;
  documents: Document;
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'FamilyHealthKeeperDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create patients store
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
          patientStore.createIndex('name', 'name', { unique: false });
        }

        // Create doctors store
        if (!db.objectStoreNames.contains('doctors')) {
          const doctorStore = db.createObjectStore('doctors', { keyPath: 'id' });
          doctorStore.createIndex('name', 'name', { unique: false });
          doctorStore.createIndex('specialty', 'specialty', { unique: false });
        }

        // Create medical records store
        if (!db.objectStoreNames.contains('medicalRecords')) {
          const recordStore = db.createObjectStore('medicalRecords', { keyPath: 'id' });
          recordStore.createIndex('patientId', 'patientId', { unique: false });
          recordStore.createIndex('doctorId', 'doctorId', { unique: false });
          recordStore.createIndex('date', 'date', { unique: false });
        }

        // Create reminders store
        if (!db.objectStoreNames.contains('reminders')) {
          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
          reminderStore.createIndex('patientId', 'patientId', { unique: false });
          reminderStore.createIndex('type', 'type', { unique: false });
          reminderStore.createIndex('date', 'date', { unique: false });
        }

        // Create medications store
        if (!db.objectStoreNames.contains('medications')) {
          const medicationStore = db.createObjectStore('medications', { keyPath: 'id' });
          medicationStore.createIndex('patientId', 'patientId', { unique: false });
          medicationStore.createIndex('name', 'name', { unique: false });
        }

        // Create documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentStore.createIndex('recordId', 'recordId', { unique: false });
        }
      };
    });
  }

  // Patient operations
  async getAllPatients(): Promise<Patient[]> {
    return this.getAll<Patient>('patients');
  }

  async getPatient(id: string): Promise<Patient | null> {
    return this.getById<Patient>('patients', id);
  }

  async savePatient(patient: Patient): Promise<void> {
    return this.save<Patient>('patients', patient);
  }

  async deletePatient(id: string): Promise<void> {
    return this.delete('patients', id);
  }

  // Doctor operations
  async getAllDoctors(): Promise<Doctor[]> {
    return this.getAll<Doctor>('doctors');
  }

  async getDoctor(id: string): Promise<Doctor | null> {
    return this.getById<Doctor>('doctors', id);
  }

  async saveDoctor(doctor: Doctor): Promise<void> {
    return this.save<Doctor>('doctors', doctor);
  }

  async deleteDoctor(id: string): Promise<void> {
    return this.delete('doctors', id);
  }

  // Medical Record operations
  async getAllMedicalRecords(patientId?: string): Promise<MedicalRecord[]> {
    if (patientId) {
      return this.getByIndex<MedicalRecord>('medicalRecords', 'patientId', patientId);
    }
    return this.getAll<MedicalRecord>('medicalRecords');
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord | null> {
    return this.getById<MedicalRecord>('medicalRecords', id);
  }

  async saveMedicalRecord(record: MedicalRecord): Promise<void> {
    return this.save<MedicalRecord>('medicalRecords', record);
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    return this.delete('medicalRecords', id);
  }

  // Reminder operations
  async getAllReminders(patientId?: string): Promise<Reminder[]> {
    if (patientId) {
      return this.getByIndex<Reminder>('reminders', 'patientId', patientId);
    }
    return this.getAll<Reminder>('reminders');
  }

  async saveReminder(reminder: Reminder): Promise<void> {
    return this.save<Reminder>('reminders', reminder);
  }

  async deleteReminder(id: string): Promise<void> {
    return this.delete('reminders', id);
  }

  // Medication operations
  async getAllMedications(patientId?: string): Promise<Medication[]> {
    if (patientId) {
      return this.getByIndex<Medication>('medications', 'patientId', patientId);
    }
    return this.getAll<Medication>('medications');
  }

  async saveMedication(medication: Medication): Promise<void> {
    return this.save<Medication>('medications', medication);
  }

  async deleteMedication(id: string): Promise<void> {
    return this.delete('medications', id);
  }

  // Generic CRUD operations
  private getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private getById<T>(storeName: string, id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private getByIndex<T>(storeName: string, indexName: string, key: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private save<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private delete(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data (useful for testing)
  async clearAll(): Promise<void> {
    const storeNames = ['patients', 'doctors', 'medicalRecords', 'reminders', 'medications', 'documents'];

    for (const storeName of storeNames) {
      await new Promise<void>((resolve, reject) => {
        if (!this.db) {
          reject(new Error('Database not initialized'));
          return;
        }

        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Initialize with sample data if database is empty
  async initializeWithSampleData(): Promise<void> {
    const patientsCount = (await this.getAllPatients()).length;
    const doctorsCount = (await this.getAllDoctors()).length;

    if (patientsCount === 0 && doctorsCount === 0) {
      // Import sample data
      const { PATIENTS, DOCTORS } = await import('../constants');

      // Save doctors first
      for (const doctor of DOCTORS) {
        await this.saveDoctor(doctor);
      }

      // Save patients and their related data
      for (const patient of PATIENTS) {
        // Save patient without records and related data first
        const patientToSave = {
          ...patient,
          records: [],
          reminders: [],
          currentMedications: []
        };
        await this.savePatient(patientToSave);

        // Save medical records
        for (const record of patient.records) {
          await this.saveMedicalRecord(record);
        }

        // Save reminders
        for (const reminder of patient.reminders) {
          await this.saveReminder(reminder);
        }

        // Save medications
        for (const medication of patient.currentMedications) {
          await this.saveMedication(medication);
        }
      }
    }
  }
}

export const databaseService = new DatabaseService();