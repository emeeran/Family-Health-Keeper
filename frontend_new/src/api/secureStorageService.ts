import type { Patient, MedicalRecord, Doctor } from '../types';

// Security Configuration
const SECURITY_CONFIG = {
  // Session timeout in milliseconds (30 minutes)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  // Maximum failed login attempts before lockout
  MAX_FAILED_ATTEMPTS: 5,
  // Lockout duration in milliseconds (15 minutes)
  LOCKOUT_DURATION: 15 * 60 * 1000,
  // Data retention period in milliseconds (90 days)
  DATA_RETENTION_PERIOD: 90 * 24 * 60 * 60 * 1000,
};

// Audit log entry
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  details: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Session management
interface SessionData {
  id: string;
  startTime: Date;
  lastActivity: Date;
  userId?: string;
  isActive: boolean;
}

export class SecureStorageService {
  private static instance: SecureStorageService;
  private encryptedData: Map<string, any> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private sessionData: SessionData | null = null;
  private failedAttempts: number = 0;
  private lockoutUntil: Date | null = null;
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.initializeSession();
    this.loadPersistedData();
    this.startSessionMonitoring();
  }

  // Load data from localStorage on initialization
  private loadPersistedData(): void {
    try {
      const patientsData = localStorage.getItem('fhk_patients_encrypted');
      const doctorsData = localStorage.getItem('fhk_doctors_encrypted');

      if (patientsData) {
        this.encryptedData.set('patients', patientsData);
      }
      if (doctorsData) {
        this.encryptedData.set('doctors', doctorsData);
      }

      this.logAuditEvent('INIT_LOAD', 'Loaded persisted data from localStorage', 'low');
    } catch (error) {
      this.logAuditEvent('INIT_ERROR', `Failed to load persisted data: ${error}`, 'medium');
    }
  }

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  // Generate encryption key from environment or user input
  private generateEncryptionKey(): string {
    const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (envKey && envKey !== 'YOUR_32_CHARACTER_ENCRYPTION_KEY_HERE') {
      return envKey;
    }

    // Fallback: Generate key from device fingerprint
    const deviceFingerprint = this.generateDeviceFingerprint();
    return deviceFingerprint.substring(0, 32);
  }

  // Generate device fingerprint for encryption
  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      canvas.toDataURL()
    ].join('|');

    return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Simple XOR encryption for demonstration (NOT for production)
  // In production, use Web Crypto API with AES-GCM
  private encryptData(data: any): string {
    const jsonString = JSON.stringify(data);
    const keyBytes = this.encryptionKey.split('').map(char => char.charCodeAt(0));
    const dataBytes = jsonString.split('').map(char => char.charCodeAt(0));

    const encrypted = dataBytes.map((byte, index) =>
      byte ^ keyBytes[index % keyBytes.length]
    );

    return btoa(String.fromCharCode(...encrypted));
  }

  private decryptData(encryptedData: string): any {
    try {
      const encrypted = atob(encryptedData).split('').map(char => char.charCodeAt(0));
      const keyBytes = this.encryptionKey.split('').map(char => char.charCodeAt(0));

      const decrypted = encrypted.map((byte, index) =>
        byte ^ keyBytes[index % keyBytes.length]
      );

      return JSON.parse(String.fromCharCode(...decrypted));
    } catch (error) {
      this.logAuditEvent('DECRYPTION_ERROR', `Failed to decrypt data: ${error}`, 'high');
      return null;
    }
  }

  // Initialize user session
  private initializeSession(): void {
    if (this.isLockedOut()) {
      return;
    }

    this.sessionData = {
      id: this.generateId(),
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    this.logAuditEvent('SESSION_START', 'New session initialized', 'low');
  }

  // Check if user is locked out
  private isLockedOut(): boolean {
    if (this.lockoutUntil && new Date() < this.lockoutUntil) {
      return true;
    }
    return false;
  }

  // Start session monitoring
  private startSessionMonitoring(): void {
    setInterval(() => {
      if (this.sessionData && this.sessionData.isActive) {
        const now = new Date();
        const timeSinceLastActivity = now.getTime() - this.sessionData.lastActivity.getTime();

        if (timeSinceLastActivity > SECURITY_CONFIG.SESSION_TIMEOUT) {
          this.terminateSession('SESSION_TIMEOUT');
        }
      }
    }, 60000); // Check every minute
  }

  // Update session activity
  private updateSessionActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivity = new Date();
    }
  }

  // Terminate session
  private terminateSession(reason: string): void {
    if (this.sessionData) {
      this.sessionData.isActive = false;
      this.logAuditEvent('SESSION_END', `Session terminated: ${reason}`, 'medium');

      // Clear sensitive data
      this.clearSensitiveData();

      // Reset session
      this.sessionData = null;
    }
  }

  // Clear sensitive data from memory
  private clearSensitiveData(): void {
    this.encryptedData.clear();

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Log audit events
  private logAuditEvent(action: string, details: string, severity: AuditLogEntry['severity']): void {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      details,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      severity
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[AUDIT] ${action}: ${details}`);
    }
  }

  // Get client IP (simplified)
  private getClientIP(): string {
    // In production, this would be obtained from server
    return 'client-ip-unavailable';
  }

  // Check if operation is allowed
  private isOperationAllowed(): boolean {
    if (this.isLockedOut()) {
      this.logAuditEvent('ACCESS_DENIED', 'User is locked out', 'high');
      return false;
    }

    if (!this.sessionData || !this.sessionData.isActive) {
      this.logAuditEvent('ACCESS_DENIED', 'No active session', 'medium');
      return false;
    }

    this.updateSessionActivity();
    return true;
  }

  // Public Methods

  // Save patients with encryption
  async savePatients(patients: Patient[]): Promise<void> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      const encrypted = this.encryptData(patients);
      this.encryptedData.set('patients', encrypted);
      // Persist to localStorage for data persistence
      localStorage.setItem('fhk_patients_encrypted', encrypted);

      this.logAuditEvent('SAVE_PATIENTS', `Saved ${patients.length} patients`, 'low');
    } catch (error) {
      this.logAuditEvent('SAVE_ERROR', `Failed to save patients: ${error}`, 'high');
      throw error;
    }
  }

  // Load and decrypt patients
  async loadPatients(): Promise<Patient[]> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      // Try to load from localStorage first, then fallback to memory
      let encrypted = localStorage.getItem('fhk_patients_encrypted');
      if (!encrypted) {
        encrypted = this.encryptedData.get('patients');
      }
      if (!encrypted) {
        return [];
      }

      const patients = this.decryptData(encrypted) || [];
      // Cache in memory for faster access
      this.encryptedData.set('patients', encrypted);

      // Filter out old data based on retention policy
      const filteredPatients = this.filterOldData(patients);

      this.logAuditEvent('LOAD_PATIENTS', `Loaded ${filteredPatients.length} patients`, 'low');
      return filteredPatients;
    } catch (error) {
      this.logAuditEvent('LOAD_ERROR', `Failed to load patients: ${error}`, 'high');
      return [];
    }
  }

  // Save doctors with encryption
  async saveDoctors(doctors: Doctor[]): Promise<void> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      const encrypted = this.encryptData(doctors);
      this.encryptedData.set('doctors', encrypted);
      // Persist to localStorage for data persistence
      localStorage.setItem('fhk_doctors_encrypted', encrypted);

      this.logAuditEvent('SAVE_DOCTORS', `Saved ${doctors.length} doctors`, 'low');
    } catch (error) {
      this.logAuditEvent('SAVE_ERROR', `Failed to save doctors: ${error}`, 'high');
      throw error;
    }
  }

  // Load and decrypt doctors
  async loadDoctors(): Promise<Doctor[]> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      // Try to load from localStorage first, then fallback to memory
      let encrypted = localStorage.getItem('fhk_doctors_encrypted');
      if (!encrypted) {
        encrypted = this.encryptedData.get('doctors');
      }
      if (!encrypted) {
        return [];
      }

      const doctors = this.decryptData(encrypted) || [];
      // Cache in memory for faster access
      this.encryptedData.set('doctors', encrypted);

      this.logAuditEvent('LOAD_DOCTORS', `Loaded ${doctors.length} doctors`, 'low');
      return doctors;
    } catch (error) {
      this.logAuditEvent('LOAD_ERROR', `Failed to load doctors: ${error}`, 'high');
      return [];
    }
  }

  // Add a single patient
  async addPatient(patient: Patient): Promise<void> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      const patients = await this.loadPatients();
      patients.push(patient);
      await this.savePatients(patients);
      this.logAuditEvent('ADD_PATIENT', `Added patient: ${patient.name}`, 'low');
    } catch (error) {
      this.logAuditEvent('ADD_ERROR', `Failed to add patient: ${error}`, 'high');
      throw error;
    }
  }

  // Update a patient
  async updatePatient(id: string, updates: Partial<Patient>): Promise<void> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      const patients = await this.loadPatients();
      const index = patients.findIndex(p => p.id === id);
      
      if (index === -1) {
        throw new Error('Patient not found');
      }

      patients[index] = { ...patients[index], ...updates };
      await this.savePatients(patients);
      this.logAuditEvent('UPDATE_PATIENT', `Updated patient: ${patients[index].name}`, 'low');
    } catch (error) {
      this.logAuditEvent('UPDATE_ERROR', `Failed to update patient: ${error}`, 'high');
      throw error;
    }
  }

  // Add a single doctor
  async addDoctor(doctor: Doctor): Promise<void> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      const doctors = await this.loadDoctors();
      doctors.push(doctor);
      await this.saveDoctors(doctors);
      this.logAuditEvent('ADD_DOCTOR', `Added doctor: ${doctor.name}`, 'low');
    } catch (error) {
      this.logAuditEvent('ADD_ERROR', `Failed to add doctor: ${error}`, 'high');
      throw error;
    }
  }

  // Filter old data based on retention policy
  private filterOldData(patients: Patient[]): Patient[] {
    const cutoffDate = new Date();
    cutoffDate.setTime(cutoffDate.getTime() - SECURITY_CONFIG.DATA_RETENTION_PERIOD);

    return patients.map(patient => ({
      ...patient,
      records: patient.records.filter(record =>
        new Date(record.date) >= cutoffDate
      )
    }));
  }

  // Get audit log
  getAuditLog(): AuditLogEntry[] {
    if (!this.isOperationAllowed()) {
      return [];
    }

    return [...this.auditLog];
  }

  // Get session info
  getSessionInfo(): SessionData | null {
    if (!this.sessionData || !this.sessionData.isActive) {
      return null;
    }

    return { ...this.sessionData };
  }

  // Manual logout
  logout(): void {
    this.logAuditEvent('MANUAL_LOGOUT', 'User logged out manually', 'low');
    this.terminateSession('MANUAL_LOGOUT');
  }

  // Change encryption key
  async changeEncryptionKey(newKey: string): Promise<void> {
    if (!this.isOperationAllowed()) {
      throw new Error('Operation not allowed');
    }

    try {
      // Load current data
      const patients = await this.loadPatients();
      const doctors = await this.loadDoctors();

      // Update encryption key
      this.encryptionKey = newKey;

      // Re-encrypt data with new key
      await this.savePatients(patients);
      await this.saveDoctors(doctors);

      this.logAuditEvent('ENCRYPTION_KEY_CHANGE', 'Encryption key changed successfully', 'medium');
    } catch (error) {
      this.logAuditEvent('ENCRYPTION_KEY_CHANGE_ERROR', `Failed to change encryption key: ${error}`, 'high');
      throw error;
    }
  }

  // Validate data integrity
  async validateDataIntegrity(): Promise<boolean> {
    if (!this.isOperationAllowed()) {
      return false;
    }

    try {
      const patients = await this.loadPatients();
      const doctors = await this.loadDoctors();

      // Basic validation checks
      const isValid = patients.every(patient =>
        patient.id &&
        patient.name &&
        Array.isArray(patient.records)
      ) && doctors.every(doctor =>
        doctor.id &&
        doctor.name
      );

      this.logAuditEvent('DATA_INTEGRITY_CHECK', `Data integrity check: ${isValid ? 'PASSED' : 'FAILED'}`,
        isValid ? 'low' : 'high');

      return isValid;
    } catch (error) {
      this.logAuditEvent('DATA_INTEGRITY_ERROR', `Data integrity check failed: ${error}`, 'high');
      return false;
    }
  }

  // Get security status
  getSecurityStatus(): {
    isActiveSession: boolean;
    lockoutStatus: boolean;
    failedAttempts: number;
    encryptionEnabled: boolean;
    lastActivity: Date | null;
  } {
    return {
      isActiveSession: this.sessionData?.isActive || false,
      lockoutStatus: this.isLockedOut(),
      failedAttempts: this.failedAttempts,
      encryptionEnabled: true,
      lastActivity: this.sessionData?.lastActivity || null
    };
  }
}

// Export singleton instance
export const secureStorage = SecureStorageService.getInstance();