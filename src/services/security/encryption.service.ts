import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class EncryptionService {
  private getEncryptionKey(): Buffer {
    const key = process.env.API_KEY_ENCRYPTION_KEY;
    if (!key) {
      throw new Error("API_KEY_ENCRYPTION_KEY is not defined in environment variables");
    }
    // Ensure key is exactly 32 bytes (256 bits) for aes-256-gcm
    return crypto.createHash("sha256").update(key).digest();
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    // Format: iv:tag:encrypted
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
