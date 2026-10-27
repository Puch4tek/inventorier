import assert from "node:assert/strict";
import { test } from "node:test";
import { getPasskeyConfig } from "../src/lib/passkey-config.ts";

test("passkey config defaults to localhost for development", () => {
  assert.deepEqual(
    getPasskeyConfig({ NODE_ENV: "development" }),
    {
      rpID: "localhost",
      rpName: "Inventory App",
      origin: "http://localhost:3000",
    },
  );
});

test("production passkey config requires an explicit HTTPS origin and RP ID", () => {
  assert.throws(
    () => getPasskeyConfig({ NODE_ENV: "production" }),
    /PASSKEY_RP_ID i PASSKEY_ORIGIN/,
  );
  assert.throws(
    () =>
      getPasskeyConfig({
        NODE_ENV: "production",
        PASSKEY_RP_ID: "inventory.example.com",
        PASSKEY_ORIGIN: "http://inventory.example.com",
        BETTER_AUTH_URL: "http://inventory.example.com",
      }),
    /HTTPS/,
  );
});

test("production passkey origin must match Better Auth and be an RP subdomain", () => {
  const config = getPasskeyConfig({
    NODE_ENV: "production",
    PASSKEY_RP_ID: "example.com",
    PASSKEY_ORIGIN: "https://inventory.example.com",
    BETTER_AUTH_URL: "https://inventory.example.com",
  });
  assert.deepEqual(config, {
    rpID: "example.com",
    rpName: "Inventory App",
    origin: "https://inventory.example.com",
  });

  assert.throws(
    () =>
      getPasskeyConfig({
        NODE_ENV: "production",
        PASSKEY_RP_ID: "evil-example.com",
        PASSKEY_ORIGIN: "https://inventory.example.com",
        BETTER_AUTH_URL: "https://inventory.example.com",
      }),
    /nadrzędną domeną/,
  );
  assert.throws(
    () =>
      getPasskeyConfig({
        NODE_ENV: "production",
        PASSKEY_RP_ID: "example.com",
        PASSKEY_ORIGIN: "https://inventory.example.com",
        BETTER_AUTH_URL: "https://other.example.com",
      }),
    /ten sam origin/,
  );
});
