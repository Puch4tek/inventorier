import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

const { decryptSecretWithKey, encryptSecretWithKey, getAppEncryptionKey, parseEncryptionKey } =
  await import("../src/server/security/secret-encryption.ts");

test("APP encryption keys must be canonical base64 for exactly 32 bytes", () => {
  const key = randomBytes(32);
  assert.deepEqual(parseEncryptionKey(key.toString("base64")), key);
  for (const invalid of [undefined, "", "invalid", Buffer.alloc(31).toString("base64"), `${key.toString("base64")}x`]) {
    assert.throws(() => parseEncryptionKey(invalid), { code: "KEY" });
  }
});

test("AES-256-GCM ciphertext authenticates data and requires the shared app key", () => {
  const key = randomBytes(32);
  const ciphertext = encryptSecretWithKey("sensitive value", key);
  assert.match(ciphertext, /^v1:/);
  assert.equal(decryptSecretWithKey(ciphertext, key), "sensitive value");
  assert.throws(() => decryptSecretWithKey(ciphertext, randomBytes(32)), { code: "CIPHERTEXT" });
  assert.throws(() => decryptSecretWithKey(`${ciphertext}x`, key), { code: "CIPHERTEXT" });

  const original = process.env.APP_ENCRYPTION_KEY;
  delete process.env.APP_ENCRYPTION_KEY;
  try {
    assert.throws(() => getAppEncryptionKey(), { code: "KEY" });
  } finally {
    if (original === undefined) delete process.env.APP_ENCRYPTION_KEY;
    else process.env.APP_ENCRYPTION_KEY = original;
  }
});
