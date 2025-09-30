/**
 * Encryption Utilities for Medical Data
 *
 * This module provides encryption/decryption functionality for sensitive medical data
 * using the Web Crypto API. It supports both symmetric encryption for data at rest
 * and password-based key derivation for user authentication.
 */

export interface EncryptionOptions {
  algorithm?: 'AES-GCM' | 'AES-CBC';
  keyDerivationIterations?: number;
  saltLength?: number;
  ivLength?: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: string;
}

export interface EncryptedStore {
  patients: string; // Encrypted patients data
  doctors: string; // Encrypted doctors data
  timestamp: number;
  version: string;
}

export class EncryptionManager {
  private static readonly DEFAULT_OPTIONS: Required<EncryptionOptions> = {
    algorithm: 'AES-GCM',
    keyDerivationIterations: 100000,
    saltLength: 16,
    ivLength: 12
  };

  /**
   * Generate a random salt for key derivation
   */
  static async generateSalt(length: number = 16): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generate a random initialization vector
   */
  static async generateIV(length: number = 12): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Derive a cryptographic key from a password using PBKDF2
   */
  static async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number = 100000
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encrypt(
    data: unknown,
    password: string,
    options: EncryptionOptions = {}
  ): Promise<EncryptedData> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const salt = await this.generateSalt(opts.saltLength);
    const iv = await this.generateIV(opts.ivLength);
    const key = await this.deriveKey(password, salt, opts.keyDerivationIterations);

    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: opts.algorithm,
        iv: iv
      },
      key,
      plaintext
    );

    return {
      ciphertext: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
      algorithm: opts.algorithm
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decrypt<T = unknown>(
    encryptedData: EncryptedData,
    password: string
  ): Promise<T> {
    const salt = this.base64ToArrayBuffer(encryptedData.salt);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);

    const key = await this.deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
      {
        name: encryptedData.algorithm,
        iv: iv
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const decryptedText = decoder.decode(plaintext);
    return JSON.parse(decryptedText);
  }

  /**
   * Encrypt the entire store for secure storage
   */
  static async encryptStore(
    patients: unknown[],
    doctors: unknown[],
    password: string,
    options: EncryptionOptions = {}
  ): Promise<EncryptedStore> {
    const encryptedPatients = await this.encrypt(patients, password, options);
    const encryptedDoctors = await this.encrypt(doctors, password, options);

    return {
      patients: JSON.stringify(encryptedPatients),
      doctors: JSON.stringify(encryptedDoctors),
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Decrypt the entire store from secure storage
   */
  static async decryptStore(
    encryptedStore: EncryptedStore,
    password: string
  ): Promise<{ patients: unknown[]; doctors: unknown[] }> {
    const patientsData = JSON.parse(encryptedStore.patients) as EncryptedData;
    const doctorsData = JSON.parse(encryptedStore.doctors) as EncryptedData;

    const patients = await this.decrypt(patientsData, password);
    const doctors = await this.decrypt(doctorsData, password);

    return {
      patients: patients as unknown[],
      doctors: doctors as unknown[]
    };
  }

  /**
   * Verify if a password can decrypt the store
   */
  static async verifyPassword(
    encryptedStore: EncryptedStore,
    password: string
  ): Promise<boolean> {
    try {
      await this.decryptStore(encryptedStore, password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change the encryption password for the store
   */
  static async changePassword(
    encryptedStore: EncryptedStore,
    oldPassword: string,
    newPassword: string,
    options: EncryptionOptions = {}
  ): Promise<EncryptedStore> {
    // Decrypt with old password
    const { patients, doctors } = await this.decryptStore(encryptedStore, oldPassword);

    // Re-encrypt with new password
    return this.encryptStore(patients, doctors, newPassword, options);
  }

  /**
   * Securely hash a password for authentication
   */
  static async hashPassword(
    password: string,
    salt?: Uint8Array,
    iterations: number = 100000
  ): Promise<{ hash: string; salt: string }> {
    const useSalt = salt || await this.generateSalt(16);
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: useSalt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return {
      hash: this.arrayBufferToBase64(hashBuffer),
      salt: this.arrayBufferToBase64(useSalt)
    };
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPasswordHash(
    password: string,
    hash: string,
    salt: string,
    iterations: number = 100000
  ): Promise<boolean> {
    try {
      const saltBuffer = this.base64ToArrayBuffer(salt);
      const { hash: computedHash } = await this.hashPassword(password, saltBuffer, iterations);
      return computedHash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    return password;
  }

  /**
   * Check if the Web Crypto API is available
   */
  static isCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' &&
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }

  /**
   * Get encryption algorithm information
   */
  static getAlgorithmInfo(): {
    name: string;
    keySize: number;
    ivSize: number;
    blockMode: string;
  } {
    return {
      name: 'AES-GCM',
      keySize: 256,
      ivSize: 96,
      blockMode: 'GCM'
    };
  }
}