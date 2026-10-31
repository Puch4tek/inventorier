import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export class SecretEncryptionError extends Error {
  readonly code: "KEY" | "CIPHERTEXT";

  constructor(code: "KEY" | "CIPHERTEXT", message: string) {
    super(message);
    this.name = "SecretEncryptionError";
    this.code = code;
  }
}

export function parseEncryptionKey(value: string | undefined, variable = "APP_ENCRYPTION_KEY"): Buffer {
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new SecretEncryptionError("KEY", `Invalid or missing ${variable}.`);
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) {
    throw new SecretEncryptionError("KEY", `Invalid or missing ${variable}.`);
  }
  return key;
}

export function getAppEncryptionKey(): Buffer {
  return parseEncryptionKey(process.env.APP_ENCRYPTION_KEY);
}

export function encryptSecretWithKey(value: string, key: Buffer): string {
  if (key.length !== 32) throw new SecretEncryptionError("KEY", "Invalid encryption key.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    nonce.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

export function decryptSecretWithKey(value: string, key: Buffer): string {
  if (key.length !== 32) throw new SecretEncryptionError("KEY", "Invalid encryption key.");
  try {
    const parts = value.split(":");
    if (parts.length !== 4 || parts[0] !== "v1") throw new Error();
    const decode = (part: string) => {
      const buffer = Buffer.from(part, "base64");
      if (buffer.toString("base64") !== part) throw new Error();
      return buffer;
    };
    const nonce = decode(parts[1]);
    const tag = decode(parts[2]);
    const ciphertext = decode(parts[3]);
    if (nonce.length !== 12 || tag.length !== 16 || ciphertext.length === 0) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw new SecretEncryptionError("CIPHERTEXT", "Secret ciphertext is invalid or cannot be decrypted.");
  }
}

export function encryptSecret(value: string): string {
  return encryptSecretWithKey(value, getAppEncryptionKey());
}

export function decryptSecret(value: string): string {
  return decryptSecretWithKey(value, getAppEncryptionKey());
}
