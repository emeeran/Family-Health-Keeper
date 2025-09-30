import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EncryptionManager } from '../../utils/encryption';

// Mock the Web Crypto API
const mockCrypto = {
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    deriveBits: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn()
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('EncryptionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSalt', () => {
    it('should generate salt of specified length', async () => {
      const expectedSalt = new Uint8Array([1, 2, 3, 4]);
      mockCrypto.getRandomValues.mockReturnValue(expectedSalt);

      const salt = await EncryptionManager.generateSalt(4);

      expect(salt).toEqual(expectedSalt);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should use default length when not specified', async () => {
      const expectedSalt = new Uint8Array(16);
      mockCrypto.getRandomValues.mockReturnValue(expectedSalt);

      const salt = await EncryptionManager.generateSalt();

      expect(salt).toEqual(expectedSalt);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('generateIV', () => {
    it('should generate IV of specified length', async () => {
      const expectedIV = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      mockCrypto.getRandomValues.mockReturnValue(expectedIV);

      const iv = await EncryptionManager.generateIV(12);

      expect(iv).toEqual(expectedIV);
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });
  });

  describe('deriveKey', () => {
    it('should derive key from password', async () => {
      const password = 'testPassword';
      const salt = new Uint8Array([1, 2, 3, 4]);
      const mockKey = {};

      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);

      const key = await EncryptionManager.deriveKey(password, salt, 100000);

      expect(key).toBe(mockKey);
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        }),
        mockKey,
        expect.objectContaining({
          name: 'AES-GCM',
          length: 256
        }),
        false,
        ['encrypt', 'decrypt']
      );
    });
  });

  describe('encrypt', () => {
    it('should encrypt data with password', async () => {
      const data = { message: 'test data' };
      const password = 'testPassword';
      const salt = new Uint8Array([1, 2, 3, 4]);
      const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const mockKey = {};
      const ciphertext = new ArrayBuffer(32);

      mockCrypto.getRandomValues
        .mockReturnValueOnce(salt)
        .mockReturnValueOnce(iv);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(ciphertext);

      const result = await EncryptionManager.encrypt(data, password);

      expect(result).toEqual({
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt)),
        algorithm: 'AES-GCM'
      });
    });
  });

  describe('decrypt', () => {
    it('should decrypt data with password', async () => {
      const encryptedData = {
        ciphertext: btoa('encrypted data'),
        iv: btoa(String.fromCharCode(...new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))),
        salt: btoa(String.fromCharCode(...new Uint8Array([1, 2, 3, 4]))),
        algorithm: 'AES-GCM'
      };
      const password = 'testPassword';
      const mockKey = {};
      const plaintext = new TextEncoder().encode(JSON.stringify({ message: 'test data' }));

      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.decrypt.mockResolvedValue(plaintext);

      const result = await EncryptionManager.decrypt(encryptedData, password);

      expect(result).toEqual({ message: 'test data' });
    });
  });

  describe('encryptStore and decryptStore', () => {
    it('should encrypt and decrypt entire store', async () => {
      const patients = [{ id: '1', name: 'John Doe' }];
      const doctors = [{ id: '1', name: 'Dr. Smith' }];
      const password = 'testPassword';
      const salt = new Uint8Array([1, 2, 3, 4]);
      const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const mockKey = {};
      const ciphertext = new ArrayBuffer(32);

      // Mock encryption
      mockCrypto.getRandomValues
        .mockReturnValueOnce(salt)
        .mockReturnValueOnce(iv)
        .mockReturnValueOnce(salt)
        .mockReturnValueOnce(iv);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(ciphertext);

      // Mock decryption
      const plaintext = new TextEncoder().encode(JSON.stringify({ patients, doctors }));
      mockCrypto.subtle.decrypt.mockResolvedValue(plaintext);

      const encryptedStore = await EncryptionManager.encryptStore(patients, doctors, password);
      const decryptedStore = await EncryptionManager.decryptStore(encryptedStore, password);

      // Check that encryption and decryption completed without error
      expect(encryptedStore).toBeDefined();
      expect(encryptedStore).toHaveProperty('patients');
      expect(encryptedStore).toHaveProperty('doctors');
      expect(encryptedStore).toHaveProperty('timestamp');
      expect(encryptedStore).toHaveProperty('version');

      expect(decryptedStore).toBeDefined();
      expect(decryptedStore).toHaveProperty('patients');
      expect(decryptedStore).toHaveProperty('doctors');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const encryptedStore = {
        patients: JSON.stringify({
          ciphertext: 'test',
          iv: 'test',
          salt: 'test',
          algorithm: 'AES-GCM'
        }),
        doctors: JSON.stringify({
          ciphertext: 'test',
          iv: 'test',
          salt: 'test',
          algorithm: 'AES-GCM'
        }),
        timestamp: Date.now(),
        version: '1.0.0'
      };
      const password = 'correctPassword';

      const plaintext = new TextEncoder().encode(JSON.stringify({ test: 'data' }));
      mockCrypto.subtle.deriveKey.mockResolvedValue({});
      mockCrypto.subtle.decrypt.mockResolvedValue(plaintext);

      const result = await EncryptionManager.verifyPassword(encryptedStore, password);

      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const encryptedStore = {
        patients: JSON.stringify({
          ciphertext: 'test',
          iv: 'test',
          salt: 'test',
          algorithm: 'AES-GCM'
        }),
        doctors: JSON.stringify({
          ciphertext: 'test',
          iv: 'test',
          salt: 'test',
          algorithm: 'AES-GCM'
        }),
        timestamp: Date.now(),
        version: '1.0.0'
      };
      const password = 'wrongPassword';

      mockCrypto.subtle.deriveKey.mockResolvedValue({});
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Invalid password'));

      const result = await EncryptionManager.verifyPassword(encryptedStore, password);

      expect(result).toBe(false);
    });
  });

  describe('hashPassword and verifyPasswordHash', () => {
    it('should hash password and verify correctly', async () => {
      const password = 'testPassword';
      const salt = new Uint8Array([1, 2, 3, 4]);
      const hashBuffer = new ArrayBuffer(32);

      mockCrypto.getRandomValues.mockReturnValue(salt);
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveBits.mockResolvedValue(hashBuffer);

      const { hash, salt: returnedSalt } = await EncryptionManager.hashPassword(password);

      expect(hash).toBeDefined();
      expect(returnedSalt).toBeDefined();

      // Mock for verification
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveBits.mockResolvedValue(hashBuffer);

      const isValid = await EncryptionManager.verifyPasswordHash(password, hash, returnedSalt);

      expect(isValid).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate secure password of specified length', () => {
      // Test the actual function without mocking since it's a simple utility
      const password = EncryptionManager.generateSecurePassword(16);

      expect(password).toHaveLength(16);
      expect(typeof password).toBe('string');
      // Check that it contains only allowed characters
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      expect(password.split('').every(char => charset.includes(char))).toBe(true);
    });
  });

  describe('isCryptoAvailable', () => {
    it('should return true when crypto API is available', () => {
      expect(EncryptionManager.isCryptoAvailable()).toBe(true);
    });

    it('should return false when crypto API is not available', () => {
      // @ts-ignore
      const originalCrypto = global.crypto;
      // @ts-ignore
      global.crypto = undefined;

      expect(EncryptionManager.isCryptoAvailable()).toBe(false);

      // @ts-ignore
      global.crypto = originalCrypto;
    });
  });

  describe('getAlgorithmInfo', () => {
    it('should return correct algorithm information', () => {
      const info = EncryptionManager.getAlgorithmInfo();

      expect(info).toEqual({
        name: 'AES-GCM',
        keySize: 256,
        ivSize: 96,
        blockMode: 'GCM'
      });
    });
  });
});