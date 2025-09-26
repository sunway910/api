import { createCipheriv, createDecipheriv } from 'crypto';

// Error constants for key validation
const ERR_KEY_LENGTH_MAX = new Error('Key length cannot exceed 32');
const ERR_KEY_LENGTH_EMPTY = new Error('Key length cannot be empty');

/**
 * Validates the secret key length
 * @param secretKey - The encryption/decryption key
 * @throws Error if key is empty or exceeds max length
 */
function validateSecretKey(secretKey: Buffer): void {
    if (secretKey.length === 0) {
        throw ERR_KEY_LENGTH_EMPTY;
    }
    if (secretKey.length > 32) {
        throw ERR_KEY_LENGTH_MAX;
    }
}

/**
 * Prepares a standardized 32-byte key and 16-byte init vector
 * @param secretKey - The original secret key
 * @returns Object containing standardized key and init vector
 */
function prepareKeyAndIV(secretKey: Buffer): { key: Buffer; iv: Buffer } {
    const key = Buffer.alloc(32);
    secretKey.copy(key);

    // Instead of using key.slice (deprecated), create a new buffer
    const iv = Buffer.alloc(16);
    key.copy(iv, 0, 0, 16);

    return { key, iv };
}

/**
 * Encrypts data using AES-256-CBC algorithm
 * @param plainText - Data to encrypt
 * @param secretKey - Secret key for encryption
 * @returns Encrypted data as Buffer
 */
export function aesCbcEncrypt(plainText: Buffer, secretKey: Buffer): Buffer {
    validateSecretKey(secretKey);

    const { key, iv } = prepareKeyAndIV(secretKey);

    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encryptedChunks = [cipher.update(plainText), cipher.final()];

    return Buffer.concat(encryptedChunks);
}

/**
 * Decrypts data using AES-256-CBC algorithm
 * @param cipherText - Encrypted data to decrypt
 * @param secretKey - Secret key for decryption
 * @returns Decrypted data as Buffer
 */
export function aesCbcDecrypt(cipherText: Buffer, secretKey: Buffer): Buffer {
    validateSecretKey(secretKey);

    const { key, iv } = prepareKeyAndIV(secretKey);

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decryptedChunks = [decipher.update(cipherText), decipher.final()];

    return Buffer.concat(decryptedChunks);
}