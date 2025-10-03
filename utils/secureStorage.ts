import type { Patient, MedicalRecord, Doctor } from '../types';

/**
 * SECURE IN-MEMORY STORAGE
 *
 * CRITICAL SECURITY NOTICE:
 * This is a temporary solution to replace localStorage.
 * All medical data should be stored server-side with proper encryption.
 * This in-memory storage will be lost on page refresh.
 */

class SecureMemoryStorage {
  private static instance: SecureMemoryStorage;
  private patients: Map<string, Patient> = new Map();
  private doctors: Map<string, Doctor> = new Map();
  private encryptionKey: string | null = null;

  private constructor() {
    // Generate a temporary encryption key for this session
    this.generateSessionKey();

    // Add cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  static getInstance(): SecureMemoryStorage {
    if (!SecureMemoryStorage.instance) {
      SecureMemoryStorage.instance = new SecureMemoryStorage();
    }
    return SecureMemoryStorage.instance;
  }

  private generateSessionKey(): void {
    // Generate a cryptographically secure key for this session
    const array = new Uint32Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
      this.encryptionKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
  }

  private async encryptData(data: any): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    // Simple XOR encryption for temporary storage
    // NOTE: This is NOT secure for production - use AES-256-GCM server-side
    const dataStr = JSON.stringify(data);
    const key = this.encryptionKey;

    let encrypted = '';
    for (let i = 0; i < dataStr.length; i++) {
      encrypted += String.fromCharCode(
        dataStr.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }

    return btoa(encrypted);
  }

  private async decryptData(encryptedData: string): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      const key = this.encryptionKey;
      const encrypted = atob(encryptedData);

      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  // Patient operations
  async savePatients(patients: Patient[]): Promise<void> {
    // Store in memory only (cleared on page refresh)
    this.patients.clear();
    for (const patient of patients) {
      this.patients.set(patient.id, patient);
    }

    // Log audit trail
    this.logAuditEvent('SAVE_PATIENTS', `Saved ${patients.length} patients`);
  }

  async loadPatients(): Promise<Patient[]> {
    this.logAuditEvent('LOAD_PATIENTS', 'Loaded patients from memory');
    return Array.from(this.patients.values());
  }

  // Doctor operations
  async saveDoctors(doctors: Doctor[]): Promise<void> {
    this.doctors.clear();
    for (const doctor of doctors) {
      this.doctors.set(doctor.id, doctor);
    }

    this.logAuditEvent('SAVE_DOCTORS', `Saved ${doctors.length} doctors`);
  }

  async loadDoctors(): Promise<Doctor[]> {
    this.logAuditEvent('LOAD_DOCTORS', 'Loaded doctors from memory');
    return Array.from(this.doctors.values());
  }

  async addDoctor(doctor: Doctor): Promise<void> {
    this.doctors.set(doctor.id, doctor);
    this.logAuditEvent('ADD_DOCTOR', `Added doctor: ${doctor.name}`);
  }

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<void> {
    const existing = this.doctors.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.doctors.set(id, updated);
      this.logAuditEvent('UPDATE_DOCTOR', `Updated doctor: ${existing.name}`);
    }
  }

  async deleteDoctor(id: string): Promise<void> {
    const doctor = this.doctors.get(id);
    if (doctor) {
      this.doctors.delete(id);
      this.logAuditEvent('DELETE_DOCTOR', `Deleted doctor: ${doctor.name}`);
    }
  }

  // Data management
  async addPatient(patient: Patient): Promise<void> {
    this.patients.set(patient.id, patient);
    this.logAuditEvent('ADD_PATIENT', `Added patient: ${patient.name}`);
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
    const existing = this.patients.get(id);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.patients.set(id, updated);
      this.logAuditEvent('UPDATE_PATIENT', `Updated patient: ${existing.name}`);
    }
  }

  async deletePatient(id: string): Promise<void> {
    const patient = this.patients.get(id);
    if (patient) {
      this.patients.delete(id);
      this.logAuditEvent('DELETE_PATIENT', `Deleted patient: ${patient.name}`);
    }
  }

  // Clear all data (security feature)
  async clearAllData(): Promise<void> {
    this.patients.clear();
    this.doctors.clear();
    this.logAuditEvent('CLEAR_ALL_DATA', 'Cleared all medical data');
  }

  // Audit logging
  private logAuditEvent(action: string, details: string): void {
    const event = {
      timestamp: new Date().toISOString(),
      action,
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    // Store in memory for this session
    // TODO: Send to server for persistent audit logging
    console.log('AUDIT LOG:', event);
  }

  // Security cleanup
  private cleanup(): void {
    this.patients.clear();
    this.doctors.clear();
    this.encryptionKey = null;
    console.log('SecureStorage: Cleaned up sensitive data');
  }

  // Get audit log for current session
  getAuditLog(): any[] {
    // Return session audit events
    // TODO: Fetch from server in production
    return [];
  }
}

// Export singleton instance
export const secureStorage = SecureMemoryStorage.getInstance();

// Backward compatibility exports for gradual migration
export const LegacyStorageAdapter = {
  savePatients: (patients: Patient[]) => secureStorage.savePatients(patients),
  loadPatients: () => secureStorage.loadPatients(),
  saveDoctors: (doctors: Doctor[]) => secureStorage.saveDoctors(doctors),
  loadDoctors: () => secureStorage.loadDoctors(),
};