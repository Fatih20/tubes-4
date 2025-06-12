import { webcrypto as crypto } from 'crypto';

// Const
const BIGINT_0 = BigInt(0);
const BIGINT_1 = BigInt(1);
const BIGINT_2 = BigInt(2);
const BIGINT_3 = BigInt(3);
const BIGINT_65537 = BigInt(65537); // Standard public exponent
const MIN_KEY_SIZE = 2048;
const MAX_PRIME_GENERATION_ATTEMPTS = 1000;
const MILLER_RABIN_ROUNDS = 40; 

export class RSAError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RSAError';
  }
}

export class InvalidKeyError extends RSAError {
  constructor(message: string) {
    super(`Invalid key: ${message}`);
    this.name = 'InvalidKeyError';
  }
}

export class EncryptionError extends RSAError {
  constructor(message: string) {
    super(`Encryption error: ${message}`);
    this.name = 'EncryptionError';
  }
}

// Type definitions for RSA keys
export interface RSAPublicKey {
  /** Public exponent (hex string) */
  e: string;
  /** Modulus n = p × q (hex string) */
  n: string;
  /** Key bit length */
  bitLength: number;
  /** Key creation timestamp */
  createdAt: Date;
  /** Key identifier */
  keyId: string;
  /** Key type identifier */
  readonly type: 'public';
}

export interface RSAPrivateKey {
  /** Private exponent (hex string) */
  d: string;
  /** Modulus n = p × q (hex string) */
  n: string;
  /** Prime factor p (hex string) */
  p: string;
  /** Prime factor q (hex string) */
  q: string;
  /** d mod (p-1) for CRT (hex string) */
  dp: string;
  /** d mod (q-1) for CRT (hex string) */
  dq: string;
  /** q^(-1) mod p for CRT (hex string) */
  qinv: string;
  /** Key bit length */
  bitLength: number;
  /** Key creation timestamp */
  createdAt: Date;
  /** Key identifier */
  keyId: string;
  /** Key type identifier */
  readonly type: 'private';
}

export interface RSAKeyPair {
  publicKey: RSAPublicKey;
  privateKey: RSAPrivateKey;
}

// Utility functions
const toBigInt = (value: number | string): bigint => {
  try {
    return BigInt(value);
  } catch (error) {
    throw new RSAError(`Invalid number conversion: ${value}`);
  }
};

const generateSecureRandomBigInt = (bitLength: number): bigint => {
  if (bitLength < 1) {
    throw new RSAError('Bit length must be positive');
  }
  
  const byteLength = Math.ceil(bitLength / 8);
  const buffer = crypto.getRandomValues(new Uint8Array(byteLength));
  
  // Ensure exact bit length by setting MSB
  const extraBits = bitLength % 8;
  if (extraBits !== 0) {
    buffer[0] &= (1 << extraBits) - 1;
  }
  buffer[0] |= 1 << ((extraBits === 0 ? 8 : extraBits) - 1);
  
  return buffer.reduce((acc, byte) => (acc << toBigInt(8)) | toBigInt(byte), BIGINT_0);
};

const generateSecureRandomOddBigInt = (bitLength: number): bigint => {
  const num = generateSecureRandomBigInt(bitLength);
  return num % BIGINT_2 === BIGINT_0 ? num + BIGINT_1 : num;
};

/**
 * Modular exponentiation using binary method
 */
export const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
  if (mod <= BIGINT_0) {
    throw new RSAError('Modulus must be positive');
  }
  if (exp < BIGINT_0) {
    throw new RSAError('Exponent must be non-negative');
  }
  
  let result = BIGINT_1;
  base = base % mod;
  
  while (exp > BIGINT_0) {
    if (exp & BIGINT_1) {
      result = (result * base) % mod;
    }
    base = (base * base) % mod;
    exp >>= BIGINT_1;
  }
  
  return result;
};

/**
 * Extended Euclidean Algorithm
 */
const extendedGCD = (a: bigint, b: bigint): { gcd: bigint; x: bigint; y: bigint } => {
  if (b === BIGINT_0) {
    return { gcd: a, x: BIGINT_1, y: BIGINT_0 };
  }
  
  const { gcd, x: x1, y: y1 } = extendedGCD(b, a % b);
  const x = y1;
  const y = x1 - (a / b) * y1;
  
  return { gcd, x, y };
};

/**
 * Modular multiplicative inverse
 */
const modInverse = (a: bigint, m: bigint): bigint => {
  const { gcd, x } = extendedGCD(a % m, m);
  
  if (gcd !== BIGINT_1) {
    throw new RSAError('Modular inverse does not exist');
  }
  
  return ((x % m) + m) % m;
};

/**
 * Euclidean algorithm
 */
const gcd = (a: bigint, b: bigint): bigint => {
  while (b !== BIGINT_0) {
    [a, b] = [b, a % b];
  }
  return a;
};

/**
 * Miller-Rabin primality test
 */
const isProbablePrime = (n: bigint, k: number = MILLER_RABIN_ROUNDS): boolean => {
  if (n <= BIGINT_1) return false;
  if (n <= BIGINT_3) return n > BIGINT_1;
  if (n % BIGINT_2 === BIGINT_0) return false;
  
  // Quick check against small primes
  const smallPrimes = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  for (const prime of smallPrimes) {
    const p = toBigInt(prime);
    if (n === p) return true;
    if (n % p === BIGINT_0) return false;
  }
  
  // Write n-1 as d × 2^s
  let d = n - BIGINT_1;
  let s = BIGINT_0;
  while (d % BIGINT_2 === BIGINT_0) {
    d /= BIGINT_2;
    s++;
  }
  
  // Miller-Rabin witness loop
  for (let i = 0; i < k; i++) {
    // Generate random witness in range [2, n-2]
    const witness = generateSecureRandomBigInt(n.toString(2).length - 2) % (n - BIGINT_3) + BIGINT_2;
    let x = modPow(witness, d, n);
    
    if (x === BIGINT_1 || x === n - BIGINT_1) continue;
    
    let composite = true;
    for (let j = BIGINT_0; j < s - BIGINT_1; j++) {
      x = modPow(x, BIGINT_2, n);
      if (x === n - BIGINT_1) {
        composite = false;
        break;
      }
    }
    
    if (composite) return false;
  }
  
  return true;
};

/**
 * Generate a cryptographically secure probable prime
 */
const generateProbablePrime = (bitLength: number): bigint => {
  if (bitLength < 2) {
    throw new RSAError('Prime bit length must be at least 2');
  }
  
  let candidate: bigint;
  let attempts = 0;
  
  do {
    if (attempts++ > MAX_PRIME_GENERATION_ATTEMPTS) {
      throw new RSAError('Failed to generate prime after maximum attempts');
    }
    
    candidate = generateSecureRandomOddBigInt(bitLength);
    
  } while (!isProbablePrime(candidate));
  
  return candidate;
};

/**
 * Generate a unique key identifier
 */
const generateKeyId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(8));
  const randomHex = Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${timestamp}-${randomHex}`;
};

/**
 * Generate RSA key pair with enhanced security measures
 */
export const generateKeyPair = (bitLength: number = 2048, keyId?: string): RSAKeyPair => {
  if (bitLength < MIN_KEY_SIZE) {
    throw new RSAError(`Key size must be at least ${MIN_KEY_SIZE} bits for security`);
  }
  
  if (bitLength % 2 !== 0) {
    throw new RSAError('Key size must be even');
  }
  
  const halfBitLength = bitLength / 2;
  let p: bigint, q: bigint, n: bigint;
  let attempts = 0;
  
  // Generate two distinct primes with sufficient difference
  do {
    if (attempts++ > 100) {
      throw new RSAError('Failed to generate suitable prime pair');
    }
    
    p = generateProbablePrime(halfBitLength);
    q = generateProbablePrime(halfBitLength);
    n = p * q;
    
    // Ensure sufficient difference between p and q (security requirement)
    const diff = p > q ? p - q : q - p;
    const minDiff = toBigInt(2) ** toBigInt(halfBitLength - 100);
    
    if (diff < minDiff) continue;
    
    // Ensure exact bit length
    if (n.toString(2).length !== bitLength) continue;
    
    break;
    
  } while (p === q);
  
  // Ensure p > q for CRT optimization
  if (p < q) {
    [p, q] = [q, p];
  }
  
  // Calculate Euler's totient: φ(n) = (p-1)(q-1)
  const phi = (p - BIGINT_1) * (q - BIGINT_1);
  
  // Use standard public exponent (65537)
  const e = BIGINT_65537;
  
  // Verify gcd(e, φ(n)) = 1
  if (gcd(e, phi) !== BIGINT_1) {
    throw new RSAError('Invalid key generation: gcd(e, φ(n)) ≠ 1');
  }
  
  // Calculate private exponent: d ≡ e^(-1) (mod φ(n))
  const d = modInverse(e, phi);
  
  // Precompute CRT parameters for faster private key operations
  const dp = d % (p - BIGINT_1);
  const dq = d % (q - BIGINT_1);
  const qinv = modInverse(q, p);
  
  const now = new Date();
  const id = keyId || generateKeyId();
  
  return {
    publicKey: {
      e: e.toString(16),
      n: n.toString(16),
      bitLength,
      createdAt: now,
      keyId: id,
      type: 'public' as const
    },
    privateKey: {
      d: d.toString(16),
      n: n.toString(16),
      p: p.toString(16),
      q: q.toString(16),
      dp: dp.toString(16),
      dq: dq.toString(16),
      qinv: qinv.toString(16),
      bitLength,
      createdAt: now,
      keyId: id,
      type: 'private' as const
    }
  };
};

/**
 * Comprehensive key validation
 */
export const validateKey = (key: RSAPublicKey | RSAPrivateKey): boolean => {
  try {
    // Basic structure validation
    if (!key.n || !key.bitLength || !key.keyId) {
      throw new InvalidKeyError('Missing required key fields');
    }
    
    // Validate modulus
    const n = toBigInt('0x' + key.n);
    if (n <= BIGINT_0) {
      throw new InvalidKeyError('Modulus must be positive');
    }
    
    // Validate bit length
    if (key.bitLength < MIN_KEY_SIZE) {
      throw new InvalidKeyError(`Key size too small (minimum ${MIN_KEY_SIZE} bits)`);
    }
    
    const actualBitLength = n.toString(2).length;
    if (Math.abs(actualBitLength - key.bitLength) > 1) {
      throw new InvalidKeyError('Bit length mismatch');
    }
    
    // Validate public key components
    if (key.type === 'public' || 'e' in key) {
      const e = toBigInt('0x' + key.e);
      if (e <= BIGINT_0 || e >= n) {
        throw new InvalidKeyError('Invalid public exponent');
      }
      if (e !== BIGINT_65537) {
        console.warn('Non-standard public exponent detected');
      }
    }
    
    // Validate private key components
    if (key.type === 'private' || 'd' in key) {
      const privateKey = key as RSAPrivateKey;
      const d = toBigInt('0x' + privateKey.d);
      const p = toBigInt('0x' + privateKey.p);
      const q = toBigInt('0x' + privateKey.q);
      const dp = toBigInt('0x' + privateKey.dp);
      const dq = toBigInt('0x' + privateKey.dq);
      const qinv = toBigInt('0x' + privateKey.qinv);
      
      if (d <= BIGINT_0 || d >= n) {
        throw new InvalidKeyError('Invalid private exponent');
      }
      
      // Validate prime factors
      if (p * q !== n) {
        throw new InvalidKeyError('Invalid prime factors');
      }
      
      // Validate CRT parameters
      if (dp !== d % (p - BIGINT_1)) {
        throw new InvalidKeyError('Invalid CRT parameter dp');
      }
      if (dq !== d % (q - BIGINT_1)) {
        throw new InvalidKeyError('Invalid CRT parameter dq');
      }
      if ((qinv * q) % p !== BIGINT_1) {
        throw new InvalidKeyError('Invalid CRT parameter qinv');
      }
    }
    
    return true;
  } catch (error) {
    if (error instanceof InvalidKeyError) {
      throw error;
    }
    throw new InvalidKeyError('Malformed key data');
  }
};

/**
 * Chinese Remainder Theorem
 */
export const decryptWithCRT = (ciphertext: bigint, privateKey: RSAPrivateKey): bigint => {
  validateKey(privateKey);
  
  const c = ciphertext;
  const p = toBigInt('0x' + privateKey.p);
  const q = toBigInt('0x' + privateKey.q);
  const dp = toBigInt('0x' + privateKey.dp);
  const dq = toBigInt('0x' + privateKey.dq);
  const qinv = toBigInt('0x' + privateKey.qinv);
  
  // CRT computation: m1 = c^dp mod p, m2 = c^dq mod q
  const m1 = modPow(c % p, dp, p);
  const m2 = modPow(c % q, dq, q);
  
  // Combine: m = m2 + q × ((m1 - m2) × qinv mod p)
  const h = (qinv * (m1 - m2 + p)) % p;
  return m2 + q * h;
};

/**
 * RSA encryption
 */
export const encrypt = (message: bigint, publicKey: RSAPublicKey): bigint => {
  validateKey(publicKey);
  
  const n = toBigInt('0x' + publicKey.n);
  const e = toBigInt('0x' + publicKey.e);
  
  if (message <= BIGINT_0) {
    throw new EncryptionError('Message must be positive');
  }
  
  if (message >= n) {
    throw new EncryptionError('Message too large for key size');
  }
  
  return modPow(message, e, n);
};

/**
 * RSA decryption
 */
export const decrypt = (ciphertext: bigint, privateKey: RSAPrivateKey): bigint => {
  validateKey(privateKey);
  
  const n = toBigInt('0x' + privateKey.n);
  
  if (ciphertext <= BIGINT_0) {
    throw new EncryptionError('Ciphertext must be positive');
  }
  
  if (ciphertext >= n) {
    throw new EncryptionError('Ciphertext too large for key size');
  }
  
  return decryptWithCRT(ciphertext, privateKey);
};

/**
 * RSA signature generation (RSASP1 primitive)
 */
export const sign = (message: bigint, privateKey: RSAPrivateKey): bigint => {
  return decrypt(message, privateKey);
};

/**
 * RSA signature verification (RSAVP1 primitive)
 */
export const verify = (signature: bigint, publicKey: RSAPublicKey): bigint => {
  return encrypt(signature, publicKey);
};

/**
 * Get the actual bit length of a key
 */
export const getKeyBitLength = (key: RSAPublicKey | RSAPrivateKey): number => {
  const n = toBigInt('0x' + key.n);
  return n.toString(2).length;
};

/**
 * Convert key to PEM format (simplified)
 */
export const keyToPEM = (key: RSAPublicKey | RSAPrivateKey): string => {
  const keyData = JSON.stringify(key, null, 2);
  const keyType = key.type.toUpperCase();
  const base64Data = Buffer.from(keyData).toString('base64');
  const base64Lines = base64Data.match(/.{1,64}/g) || [];
  
  return [
    `-----BEGIN RSA ${keyType} KEY-----`,
    ...base64Lines,
    `-----END RSA ${keyType} KEY-----`
  ].join('\n');
};

/**
 * Parse PEM format key (simplified)
 */
export const keyFromPEM = (pemString: string): RSAPublicKey | RSAPrivateKey => {
  const base64Data = pemString
    .replace(/-----BEGIN RSA \w+ KEY-----/, '')
    .replace(/-----END RSA \w+ KEY-----/, '')
    .replace(/\s/g, '');
  
  try {
    const keyData = Buffer.from(base64Data, 'base64').toString('utf-8');
    const key = JSON.parse(keyData);
    validateKey(key);
    return key;
  } catch (error) {
    throw new InvalidKeyError('Invalid PEM format');
  }
};

/**
 * Get maximum message size for a given key (for raw RSA operations)
 */
export const getMaxMessageSize = (key: RSAPublicKey | RSAPrivateKey): number => {
  return Math.floor((key.bitLength - 1) / 8);
};

/**
 * Convert bigint to byte array with specified length
 */
export const bigIntToBytes = (value: bigint, length?: number): Uint8Array => {
  const hex = value.toString(16);
  const paddedHex = hex.length % 2 ? '0' + hex : hex;
  const bytes = new Uint8Array(paddedHex.length / 2);
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.substr(i * 2, 2), 16);
  }
  
  if (length && bytes.length < length) {
    const padded = new Uint8Array(length);
    padded.set(bytes, length - bytes.length);
    return padded;
  }
  
  return bytes;
};

/**
 * Convert byte array to bigint
 */
export const bytesToBigInt = (bytes: Uint8Array): bigint => {
  let result = BIGINT_0;
  for (const byte of bytes) {
    result = (result << toBigInt(8)) | toBigInt(byte);
  }
  return result;
};


export const generateKeys = generateKeyPair;