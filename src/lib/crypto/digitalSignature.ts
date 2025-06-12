/**
 * Digital Signature Utility using RSA + SHA-3
 * Simplified implementation for Program Study Head signature system
 */

import { sha3_256 } from './sha3';
import {
  RSAPublicKey,
  RSAPrivateKey,
  RSAKeyPair,
  sign as rsaSign,
  verify as rsaVerify,
  generateKeyPair,
  validateKey,
  bytesToBigInt,
  RSAError
} from './rsa';

// Configuration constants
const DEFAULT_HASH_FUNCTION = 'SHA3-256'; 
const SIGNATURE_VERSION = '1.0';

export class DigitalSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DigitalSignatureError';
  }
}

// Type definitions for database records
export interface DatabaseRecord {
  [key: string]: string | number | boolean;
}

export interface SignedRecord {
  record: DatabaseRecord;
  signature: string;
  publicKey?: string; // Optional column for storing public key in database
  signedAt: Date;
  hashFunction: string;
  version: string;
}

/**
 * Concatenate all field values from a database record for hashing
 * Example: 'II301' + 'Aljabar' + '3' + 'AB' + ... + 'II403' + 'Tugas Akhir' + '4' + 'AB'
 */
export const concatenateRecordFields = (record: DatabaseRecord): string => {
  if (!record || typeof record !== 'object') {
    throw new DigitalSignatureError('Invalid record: must be an object');
  }

  const sortedKeys = Object.keys(record).sort();
  
  if (sortedKeys.length === 0) {
    throw new DigitalSignatureError('Invalid record: no fields found');
  }

  return sortedKeys
    .map(key => {
      const value = record[key];
      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    })
    .join('');
};

/**
 * Generate hash of record using SHA-3 and return as Uint8Array
 */
export const hashRecord = (record: DatabaseRecord): Uint8Array => {
  const concatenatedData = concatenateRecordFields(record);
  const hashHex = sha3_256(concatenatedData);
  
  // Convert hex string to Uint8Array
  const hashBytes = new Uint8Array(hashHex.length / 2);
  for (let i = 0; i < hashHex.length; i += 2) {
    hashBytes[i / 2] = parseInt(hashHex.substr(i, 2), 16);
  }
  
  return hashBytes;
};

/**
 * Convert hash bytes to bigint for RSA operations
 */
export const hashToBigInt = (hashBytes: Uint8Array, publicKey: RSAPublicKey): bigint => {
  const n = BigInt('0x' + publicKey.n);
  let hashBigInt = bytesToBigInt(hashBytes);
  
  // Ensure hash is smaller than modulus
  if (hashBigInt >= n) {
    hashBigInt = hashBigInt % n;
    
    // If still zero, add 1 (very rare case)
    if (hashBigInt === BigInt(0)) {
      hashBigInt = BigInt(1);
    }
  }
  
  return hashBigInt;
};

/**
 * Create a complete signed record with signature and metadata
 * Uses the Program Study Head's private key
 */
export const createSignedRecord = (
  record: DatabaseRecord,
  privateKey: RSAPrivateKey,
  includePublicKey: boolean = false
): SignedRecord => {
  try {
    // Validate private key
    validateKey(privateKey);
    
    // Generate hash of record as bytes
    const hashBytes = hashRecord(record);
    
    // Create corresponding public key for hash conversion
    const publicKey: RSAPublicKey = {
      e: '10001', // Standard public exponent
      n: privateKey.n,
      bitLength: privateKey.bitLength,
      createdAt: privateKey.createdAt,
      keyId: privateKey.keyId,
      type: 'public' as const
    };
    
    const hashBigInt = hashToBigInt(hashBytes, publicKey);
    
    // Sign the hash using RSA
    const signatureBigInt = rsaSign(hashBigInt, privateKey);
    const signature = signatureBigInt.toString(16);
    
    const signedRecord: SignedRecord = {
      record,
      signature,
      signedAt: new Date(),
      hashFunction: DEFAULT_HASH_FUNCTION,
      version: SIGNATURE_VERSION
    };
    
    // Optionally include public key for storage in database
    if (includePublicKey) {
      signedRecord.publicKey = JSON.stringify(publicKey);
    }
    
    return signedRecord;
    
  } catch (error) {
    if (error instanceof RSAError || error instanceof DigitalSignatureError) {
      throw error;
    }
    throw new DigitalSignatureError(`Signing failed: ${error}`);
  }
};

/**
 * Verify a complete signed record
 * Uses the Program Study Head's public key
 */
export const verifySignedRecord = (
  signedRecord: SignedRecord,
  publicKey?: RSAPublicKey
): boolean => {
  try {
    // Use provided public key or extract from signed record
    let keyToUse = publicKey;
    
    if (!keyToUse && signedRecord.publicKey) {
      keyToUse = JSON.parse(signedRecord.publicKey) as RSAPublicKey;
    }
    
    if (!keyToUse) {
      throw new DigitalSignatureError('No public key available for verification');
    }
    
    // Validate public key
    validateKey(keyToUse);
    
    // Generate hash of record as bytes
    const hashBytes = hashRecord(signedRecord.record);
    const expectedHashBigInt = hashToBigInt(hashBytes, keyToUse);
    
    // Convert signature from hex string to bigint
    const signatureBigInt = BigInt('0x' + signedRecord.signature);
    
    // Verify signature using RSA
    const verifiedHashBigInt = rsaVerify(signatureBigInt, keyToUse);
    
    // Compare hashes
    return verifiedHashBigInt === expectedHashBigInt;
    
  } catch (error) {
    console.warn('Signed record verification failed:', error);
    return false;
  }
};

/**
 * Generate a key pair specifically for the Program Study Head
 */
export const generateProgramStudyHeadKeys = (
  bitLength: number = 2048, // Default to 2048 bits (must be at least 2048)
  departmentId: string = 'KAPRODI'
): RSAKeyPair => {
  const keyId = `${departmentId}-${Date.now()}`;
  return generateKeyPair(bitLength, keyId);
};
