// Constants
const KECCAK_ROUNDS = 24;

// Rotation offsets for rho step
const KECCAK_RHO_OFFSETS = [
  0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18,
  2, 61, 56, 14,
];

// Round constants
const KECCAK_RC = [
  BigInt("0x0000000000000001"),
  BigInt("0x0000000000008082"),
  BigInt("0x800000000000808a"),
  BigInt("0x8000000080008000"),
  BigInt("0x000000000000808b"),
  BigInt("0x0000000080000001"),
  BigInt("0x8000000080008081"),
  BigInt("0x8000000000008009"),
  BigInt("0x000000000000008a"),
  BigInt("0x0000000000000088"),
  BigInt("0x0000000080008009"),
  BigInt("0x000000008000000a"),
  BigInt("0x000000008000808b"),
  BigInt("0x800000000000008b"),
  BigInt("0x8000000000008089"),
  BigInt("0x8000000000008003"),
  BigInt("0x8000000000008002"),
  BigInt("0x8000000000000080"),
  BigInt("0x000000000000800a"),
  BigInt("0x800000008000000a"),
  BigInt("0x8000000080008081"),
  BigInt("0x8000000000008080"),
  BigInt("0x0000000080000001"),
  BigInt("0x8000000080008008"),
];

// Helper functions
function rot64(x: bigint, n: number): bigint {
  if (n === 0) return x;
  n %= 64;
  const mask = BigInt("0xFFFFFFFFFFFFFFFF");
  return ((x << BigInt(n)) | (x >> BigInt(64 - n))) & mask;
}

// SHA-3 Core
class SHA3 {
  private state: bigint[]; // 1D array of 25 lanes (5x5)
  private rate: number;
  private outputLength: number;
  private buffer: Uint8Array;
  private bufferPos: number;

  constructor(rate: number, outputLength: number) {
    this.rate = rate;
    this.outputLength = outputLength;
    this.buffer = new Uint8Array(rate / 8);
    this.bufferPos = 0;
    this.state = Array.from({ length: 25 }, () => BigInt(0));
  }

  private keccakF1600(): void {
    for (let round = 0; round < KECCAK_ROUNDS; round++) {
      // Theta step
      const C = Array.from({ length: 5 }, () => BigInt(0));
      const D = Array.from({ length: 5 }, () => BigInt(0));

      // Compute column parities
      for (let x = 0; x < 5; x++) {
        C[x] =
          this.state[x] ^
          this.state[x + 5] ^
          this.state[x + 10] ^
          this.state[x + 15] ^
          this.state[x + 20];
      }

      // Apply theta
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ rot64(C[(x + 1) % 5], 1);
        for (let y = 0; y < 5; y++) {
          this.state[y * 5 + x] ^= D[x];
        }
      }

      // Rho and Pi steps
      const B = Array.from({ length: 25 }, () => BigInt(0));
      for (let i = 0; i < 25; i++) {
        const x = i % 5;
        const y = Math.floor(i / 5);
        const newPos = ((2 * x + 3 * y) % 5) * 5 + y;
        B[newPos] = rot64(this.state[i], KECCAK_RHO_OFFSETS[i]);
      }

      // Chi step
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const pos = y * 5 + x;
          const pos1 = y * 5 + ((x + 1) % 5);
          const pos2 = y * 5 + ((x + 2) % 5);
          this.state[pos] = B[pos] ^ (~B[pos1] & B[pos2]);
        }
      }

      // Iota step
      this.state[0] ^= KECCAK_RC[round];
    }
  }

  private absorbBlock(): void {
    // XOR buffer into state in 8-byte chunks (little-endian)
    for (let i = 0; i < this.buffer.length; i += 8) {
      let laneValue = BigInt(0);
      for (let j = 0; j < 8 && i + j < this.buffer.length; j++) {
        laneValue |= BigInt(this.buffer[i + j]) << BigInt(8 * j);
      }
      this.state[i / 8] ^= laneValue;
    }

    this.keccakF1600();
    this.bufferPos = 0;
  }

  update(data: Uint8Array): this {
    for (let i = 0; i < data.length; i++) {
      this.buffer[this.bufferPos++] = data[i];
      if (this.bufferPos === this.buffer.length) {
        this.absorbBlock();
      }
    }
    return this;
  }

  private pad(): void {
    // SHA-3 padding: append 0x06, then pad with zeros, then set MSB
    this.buffer[this.bufferPos++] = 0x06;

    // Fill with zeros
    while (this.bufferPos < this.buffer.length) {
      this.buffer[this.bufferPos++] = 0x00;
    }

    // Set the MSB of the last byte
    this.buffer[this.buffer.length - 1] |= 0x80;

    // Absorb the final block
    this.absorbBlock();
  }

  digest(): Uint8Array {
    this.pad();

    const outputBytes = this.outputLength / 8;
    const result = new Uint8Array(outputBytes);
    let outputPos = 0;

    // Squeeze phase
    while (outputPos < outputBytes) {
      // Extract bytes from current state
      for (let i = 0; i < this.rate / 8 && outputPos < outputBytes; i += 8) {
        const lane = this.state[i / 8];
        for (let j = 0; j < 8 && outputPos < outputBytes; j++) {
          result[outputPos++] = Number(
            (lane >> BigInt(8 * j)) & BigInt("0xFF")
          );
        }
      }

      // If we need more output, apply Keccak-f again
      if (outputPos < outputBytes) {
        this.keccakF1600();
      }
    }

    return result;
  }

  hexDigest(): string {
    return Array.from(this.digest())
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

export function sha3_256(input: Uint8Array | string): string {
  const sha3 = new SHA3(1088, 256); // rate = 1600 - 2*256 = 1088

  if (typeof input === "string") {
    const encoder = new TextEncoder();
    sha3.update(encoder.encode(input));
  } else {
    sha3.update(input);
  }

  return sha3.hexDigest();
}

export function sha3_512(input: Uint8Array | string): string {
  const sha3 = new SHA3(576, 512); // rate = 1600 - 2*512 = 576

  if (typeof input === "string") {
    const encoder = new TextEncoder();
    sha3.update(encoder.encode(input));
  } else {
    sha3.update(input);
  }

  return sha3.hexDigest();
}
