import crypto from "node:crypto";
import { env } from "../../config/env.js";

/**
 * We use AES-256-GCM:
 * - AES-256 requires a 32-byte (256-bit) key.
 * - GCM provides confidentiality + integrity (tamper detection) via an auth tag.
 */
const ALGORITHM = "aes-256-gcm";

/**
 * GCM standard IV (nonce) length is 12 bytes.
 * Using 12 bytes is recommended for performance + security properties of GCM.
 */
const IV_LENGTH_BYTES = 12;

/**
 * Recommended: store TOKEN_ENCRYPTION_KEY as base64 for exactly 32 bytes.
 *
 * Example generation (run once in terminal):
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Then set:
 *   TOKEN_ENCRYPTION_KEY="...base64..."
 */
function getKey(): Buffer {
  const raw = env.TOKEN_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is missing.");
  }

  // Try base64 first (recommended)
  // If it decodes cleanly to 32 bytes, we use it.
  try {
    const key = Buffer.from(raw, "base64");
    if (key.length === 32) return key;
  } catch {
    // ignore and fall back below
  }

  /**
   * Fallback: if someone set TOKEN_ENCRYPTION_KEY as a plain string,
   * we derive a fixed 32-byte key from it using SHA-256.
   *
   * This is safer than slicing characters (which can lead to weak/incorrect key bytes),
   * but base64 32 random bytes is still the best option.
   */
  return crypto.createHash("sha256").update(raw, "utf8").digest(); // 32 bytes
}

/**
 * Optional: "additional authenticated data".
 * If you include AAD during encryption, you MUST provide the exact same AAD for decryption.
 *
 * This is useful to bind ciphertext to a context, e.g. userId, provider, etc.
 * If the ciphertext is copied elsewhere with different AAD, decryption fails.
 */
type EncryptOptions = {
  aad?: string;
};

/**
 * Output format:
 *   base64(iv) : base64(tag) : base64(ciphertext)
 *
 * - iv: random nonce, not secret, required for decryption
 * - tag: authentication tag (integrity)
 * - ciphertext: encrypted bytes
 */
export function encryptString(plaintext: string, options: EncryptOptions = {}): string {
  if (typeof plaintext !== "string") {
    throw new Error("encryptString expects a string.");
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // If AAD is used, set it BEFORE encrypting/finalizing.
  if (options.aad) {
    cipher.setAAD(Buffer.from(options.aad, "utf8"));
  }

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  // Auth tag proves ciphertext was not altered + key/aad/iv match.
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptString(payload: string, options: EncryptOptions = {}): string {
  if (typeof payload !== "string") {
    throw new Error("decryptString expects a string payload.");
  }

  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected iv:tag:ciphertext");
  }

  const [ivBase64, tagBase64, ciphertextBase64] = parts;

  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const ciphertext = Buffer.from(ciphertextBase64, "base64");

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH_BYTES} bytes.`);
  }
  if (tag.length !== 16) {
    // GCM tags are commonly 16 bytes (128-bit). Node returns 16 by default.
    throw new Error("Invalid auth tag length.");
  }

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  // Must match encryption AAD (if used), set BEFORE final().
  if (options.aad) {
    decipher.setAAD(Buffer.from(options.aad, "utf8"));
  }

  decipher.setAuthTag(tag);

  // If anything is wrong (wrong key, wrong tag, tampering, wrong AAD),
  // decipher.final() will throw.
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");

  return plaintext;
}
