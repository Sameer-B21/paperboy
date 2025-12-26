import crypto from "node:crypto";

import { env } from "../../config/env.js";

const algorithm = "aes-256-gcm";

function getKey(): Buffer {
  const key = env.TOKEN_ENCRYPTION_KEY;
  if (key.length < 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be at least 32 characters.");
  }
  return Buffer.from(key.slice(0, 32));
}

export function encryptString(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptString(payload: string): string {
  const [ivBase64, tagBase64, encryptedBase64] = payload.split(":");
  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    throw new Error("Invalid encrypted payload.");
  }
  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
