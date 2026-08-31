import test from "node:test";
import assert from "node:assert";
import { encryptionService } from "../services/security/encryption.service";

test("Encryption Service", async (t) => {
  // Set up a mock key for testing
  process.env.API_KEY_ENCRYPTION_KEY = "test_key_32_bytes_test_key_32_bytes";
  
  await t.test("encrypts and decrypts correctly", () => {
    const original = "sk-test-1234567890";
    const encrypted = encryptionService.encrypt(original);
    
    assert.notStrictEqual(encrypted, original);
    assert.ok(encrypted.includes(":")); // IV:Tag:Ciphertext format
    
    const decrypted = encryptionService.decrypt(encrypted);
    assert.strictEqual(decrypted, original);
  });

  await t.test("produces different ciphertext for repeated encryption", () => {
    const original = "sk-test-1234567890";
    const encrypted1 = encryptionService.encrypt(original);
    const encrypted2 = encryptionService.encrypt(original);
    
    assert.notStrictEqual(encrypted1, encrypted2);
  });

  await t.test("fails on invalid ciphertext", () => {
    assert.throws(() => {
      encryptionService.decrypt("invalid-format-string");
    }, /Invalid encrypted text format/);
  });
});
