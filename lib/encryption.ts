// Encryption utilities using Web Crypto API
// AES-GCM with PBKDF2 key derivation for master password
// Random key generation for convenience mode

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a random encryption key
 * Used in "Random Key" mode
 */
export async function generateRandomKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable (so we can export it)
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive encryption key from master password using PBKDF2
 * Used in "Master Password" mode
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  // Generate salt if not provided
  const saltBytes = salt || window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Import password as key material
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive encryption key
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // not extractable (more secure)
    ['encrypt', 'decrypt']
  );

  return { key, salt: saltBytes };
}

/**
 * Export a CryptoKey to base64 string
 * Used to save random keys for user download
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import a CryptoKey from base64 string
 * Used to restore random keys
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(
  data: any,
  key: CryptoKey
): Promise<{ encrypted_data: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    encrypted_data: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<any> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: ivBuffer,
    },
    key,
    encryptedBuffer
  );

  const decryptedText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedText);
}

/**
 * Encrypt sensitive transaction data
 */
export async function encryptTransaction(
  transaction: { amount: number; description?: string; notes?: string },
  key: CryptoKey
): Promise<{ encrypted_data: string; iv: string }> {
  return await encrypt(transaction, key);
}

/**
 * Decrypt sensitive transaction data
 */
export async function decryptTransaction(
  encrypted_data: string,
  iv: string,
  key: CryptoKey
): Promise<{ amount: number; description?: string; notes?: string }> {
  return await decrypt(encrypted_data, iv, key);
}

/**
 * Encrypt sensitive goal data
 */
export async function encryptGoal(
  goal: { target_amount: number; current_amount: number; description?: string },
  key: CryptoKey
): Promise<{ encrypted_data: string; iv: string }> {
  return await encrypt(goal, key);
}

/**
 * Decrypt sensitive goal data
 */
export async function decryptGoal(
  encrypted_data: string,
  iv: string,
  key: CryptoKey
): Promise<{ target_amount: number; current_amount: number; description?: string }> {
  return await decrypt(encrypted_data, iv, key);
}

// Utility functions

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a salt for password-based encryption
 * Store this salt in localStorage or prompt user to save it
 */
export function generateSalt(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert salt to base64 for storage
 */
export function saltToBase64(salt: Uint8Array): string {
  return arrayBufferToBase64(salt.buffer as ArrayBuffer);
}

/**
 * Convert base64 salt back to Uint8Array
 */
export function base64ToSalt(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64));
}
