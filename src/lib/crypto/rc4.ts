export class RC4Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RC4Error";
  }
}

export interface RC4State {
  S: number[];
  i: number;
  j: number;
}

/**
 * RC4 Key Scheduling Algorithm (KSA)
 */
export const initializeRC4 = (key: Uint8Array): RC4State => {
  if (!key || key.length === 0 || key.length > 256) {
    throw new RC4Error("Invalid key length");
  }

  const S = Array.from({ length: 256 }, (_, i) => i);

  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key[i % key.length]) % 256;
    [S[i], S[j]] = [S[j], S[i]];
  }

  return { S, i: 0, j: 0 };
};

/**
 * RC4 Pseudo-Random Generation Algorithm (PRGA)
 */
export const generateKeystreamByte = (state: RC4State): number => {
  state.i = (state.i + 1) % 256;
  state.j = (state.j + state.S[state.i]) % 256;

  [state.S[state.i], state.S[state.j]] = [state.S[state.j], state.S[state.i]];

  return state.S[(state.S[state.i] + state.S[state.j]) % 256];
};

/**
 * RC4 encryption/decryption (symmetric)
 */
export const rc4Process = (data: Uint8Array, key: Uint8Array): Uint8Array => {
  if (!data || data.length === 0) {
    throw new RC4Error("Data cannot be empty");
  }

  const state = initializeRC4(key);
  const output = new Uint8Array(data.length);

  for (let i = 0; i < data.length; i++) {
    output[i] = data[i] ^ generateKeystreamByte(state);
  }

  return output;
};

/**
 * Encrypt PDF file using RC4
 */
export const encryptPDF = (pdfData: Uint8Array, password: string): Uint8Array => {
  if (!pdfData || pdfData.length === 0) {
    throw new RC4Error("PDF data cannot be empty");
  }

  // Validate PDF header
  if (pdfData.length >= 4) {
    const header = new TextDecoder().decode(pdfData.slice(0, 4));
    if (header !== "%PDF") {
      console.warn("Warning: Data may not be a valid PDF file");
    }
  }

  const keyBytes = new TextEncoder().encode(password);
  return rc4Process(pdfData, keyBytes);
};

/**
 * Decrypt PDF file using RC4
 */
export const decryptPDF = (encryptedData: Uint8Array, password: string): Uint8Array => {
  if (!encryptedData || encryptedData.length === 0) {
    throw new RC4Error("Encrypted data cannot be empty");
  }

  const keyBytes = new TextEncoder().encode(password);
  const decrypted = rc4Process(encryptedData, keyBytes);

  // Validate decrypted PDF
  if (decrypted.length >= 4) {
    const header = new TextDecoder().decode(decrypted.slice(0, 4));
    if (header !== "%PDF") {
      throw new RC4Error("Invalid password or corrupted data");
    }
  }

  return decrypted;
};

/**
 * Encrypt string for testing
 */
export const encryptString = (text: string, password: string): string => {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(password);
  const encrypted = rc4Process(textBytes, keyBytes);

  return btoa(String.fromCharCode(...encrypted));
};

/**
 * Decrypt string for testing
 */
export const decryptString = (encryptedBase64: string, password: string): string => {
  const encrypted = new Uint8Array(
    atob(encryptedBase64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const keyBytes = new TextEncoder().encode(password);
  const decrypted = rc4Process(encrypted, keyBytes);

  return new TextDecoder().decode(decrypted);
};
