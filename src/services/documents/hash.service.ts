import crypto from "crypto";

export class HashService {
  /**
   * Generates a SHA-256 hash of the provided buffer.
   */
  generateHash(buffer: Buffer): string {
    const hashSum = crypto.createHash("sha256");
    hashSum.update(buffer);
    return hashSum.digest("hex");
  }
}

export const hashService = new HashService();
