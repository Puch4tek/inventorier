import assert from "node:assert/strict";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { after, before, test } from "node:test";
import pg from "pg";
import { splitSetCookieHeader } from "better-auth/cookies";

const { Client } = pg;
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  throw new Error("Run this suite with tests/run-postgres-tests.sh.");
}

const url = new URL(testUrl);
if (
  !["127.0.0.1", "localhost", "::1"].includes(url.hostname) ||
  !/^inventory_contract_test_[a-z0-9_]+$/.test(url.pathname.slice(1))
) {
  throw new Error("Tests require a loopback connection to a uniquely named test database.");
}

const adminUrl = new URL(testUrl);
adminUrl.pathname = "/postgres";
const databaseName = `${url.pathname.slice(1)}_mfa_${randomUUID().replaceAll("-", "")}`;
const databaseUrl = new URL(testUrl);
databaseUrl.pathname = `/${databaseName}`;
let prisma;
let auth;

async function connectTo(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

function deployBootstrap() {
  const env = {
    ...process.env,
    TEST_DATABASE_URL: databaseUrl.toString(),
    DATABASE_URL: databaseUrl.toString(),
  };
  return spawnSync(
    "node_modules/.bin/prisma",
    ["migrate", "deploy", "--config", "tests/bootstrap-prisma.config.ts"],
    { cwd: process.cwd(), env, encoding: "utf8" },
  );
}

before(async () => {
  const admin = await connectTo(adminUrl.toString());
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
  } finally {
    await admin.end();
  }

  const migration = deployBootstrap();
  assert.equal(migration.error, undefined, migration.error?.message);
  assert.equal(migration.status, 0, `${migration.stdout}\n${migration.stderr}`);

  process.env.DATABASE_URL = databaseUrl.toString();
  process.env.TEST_DATABASE_URL = databaseUrl.toString();
  process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("base64url");
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.PASSKEY_RP_ID = "localhost";
  process.env.PASSKEY_ORIGIN = "http://localhost:3000";

  ({ prisma } = await import("../src/lib/db/prisma.ts"));
  ({ auth } = await import("../src/lib/auth.ts"));
});

after(async () => {
  await prisma?.$disconnect();
  const admin = await connectTo(adminUrl.toString());
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  } finally {
    await admin.end();
  }
});

function cookieHeaders(cookieJar) {
  const value = [...cookieJar.entries()]
    .map(([name, cookie]) => `${name}=${cookie}`)
    .join("; ");
  return new Headers(value ? { cookie: value } : undefined);
}

function updateCookieJar(cookieJar, headers) {
  const setCookieHeader = headers?.get("set-cookie");
  if (!setCookieHeader) return;

  for (const setCookie of splitSetCookieHeader(setCookieHeader)) {
    const [pair, ...attributes] = setCookie.split(";");
    const separator = pair.indexOf("=");
    if (separator <= 0) continue;

    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    const expired = attributes.some((attribute) => {
      const [key, rawValue] = attribute.trim().split("=");
      if (key.toLowerCase() === "max-age") return Number(rawValue) === 0;
      if (key.toLowerCase() === "expires") {
        const expiry = new Date(rawValue);
        return !Number.isNaN(expiry.getTime()) && expiry.getTime() <= Date.now();
      }
      return false;
    });

    if (expired) cookieJar.delete(name);
    else cookieJar.set(name, value);
  }
}

async function apiCall(method, cookieJar, input = {}) {
  const result = await auth.api[method]({
    ...input,
    headers: cookieHeaders(cookieJar),
    returnHeaders: true,
  });
  updateCookieJar(cookieJar, result.headers);
  return result.response;
}

function base32Decode(encoded) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let buffer = 0;
  const bytes = [];
  for (const character of encoded.toUpperCase().replace(/=+$/, "")) {
    const value = alphabet.indexOf(character);
    if (value < 0) throw new Error("Invalid base32 TOTP secret.");
    buffer = (buffer << 5) | value;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpCode(uri) {
  const secret = new URL(uri).searchParams.get("secret");
  assert.ok(secret);
  const counter = Math.floor(Date.now() / 30_000);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", base32Decode(secret))
    .update(message)
    .digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

test("Better Auth enforces TOTP and consumes backup codes once", async () => {
  const password = "MFA-contract-test-password";
  const userId = randomUUID();
  const email = `${userId}@test.invalid`;
  const passwordHash = await (await import("bcryptjs")).default.hash(password, 4);
  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: "MFA contract test",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });

  const cookieJar = new Map();
  const signedIn = await apiCall("signInEmail", cookieJar, {
    body: { email, password },
  });
  assert.ok(signedIn.user);
  assert.ok(cookieJar.size > 0);

  const setup = await auth.api.enableTwoFactor({
    body: { method: "totp", password, issuer: "Inventorier" },
    headers: cookieHeaders(cookieJar),
  });
  assert.equal(setup.method, "totp");
  assert.ok(setup.totpURI);
  assert.ok(setup.backupCodes.length > 0);

  const verifiedSetup = await apiCall("verifyTOTP", cookieJar, {
    body: { code: totpCode(setup.totpURI) },
  });
  assert.ok(verifiedSetup.token);
  assert.equal(
    (await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })).twoFactorEnabled,
    true,
  );

  await apiCall("signOut", cookieJar);
  const challenge = await apiCall("signInEmail", cookieJar, {
    body: { email, password },
  });
  assert.equal(challenge.twoFactorRedirect, true);
  assert.deepEqual(challenge.twoFactorMethods, ["totp"]);
  const totpLogin = await apiCall("verifyTOTP", cookieJar, {
    body: { code: totpCode(setup.totpURI) },
  });
  assert.ok(totpLogin.user);
  assert.ok(
    await auth.api.getSession({
      headers: cookieHeaders(cookieJar),
      query: { disableCookieCache: true },
    }),
  );

  await apiCall("signOut", cookieJar);
  const backupChallenge = await apiCall("signInEmail", cookieJar, {
    body: { email, password },
  });
  assert.equal(backupChallenge.twoFactorRedirect, true);
  const backupLogin = await apiCall("verifyBackupCode", cookieJar, {
    body: { code: setup.backupCodes[0] },
  });
  assert.ok(backupLogin.user);

  await apiCall("signOut", cookieJar);
  await apiCall("signInEmail", cookieJar, { body: { email, password } });
  await assert.rejects(
    auth.api.verifyBackupCode({
      body: { code: setup.backupCodes[0] },
      headers: cookieHeaders(cookieJar),
    }),
    (error) => error?.body?.code === "INVALID_BACKUP_CODE",
  );
});

test("administrator reset removes all MFA state without deleting other users' challenges", async () => {
  const suffix = randomUUID();
  const adminId = `mfa-admin-${suffix}`;
  const targetId = `mfa-target-${suffix}`;
  const unrelatedId = `mfa-unrelated-${suffix}`;
  const challenge = `2fa-challenge-${suffix}`;

  await prisma.user.create({
    data: {
      id: adminId,
      email: `${adminId}@test.invalid`,
      name: "MFA test admin",
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      id: targetId,
      email: `${targetId}@test.invalid`,
      name: "MFA target",
      twoFactorEnabled: true,
    },
  });
  await prisma.user.create({
    data: {
      id: unrelatedId,
      email: `${unrelatedId}@test.invalid`,
      name: "Unrelated user",
    },
  });
  await prisma.twoFactor.create({
    data: {
      id: `factor-${suffix}`,
      secret: "encrypted-secret",
      backupCodes: "encrypted-codes",
      userId: targetId,
    },
  });
  await prisma.passkey.create({
    data: {
      id: `passkey-${suffix}`,
      publicKey: "public-key",
      userId: targetId,
      credentialID: `credential-${suffix}`,
      counter: 1,
      deviceType: "singleDevice",
      backedUp: false,
    },
  });
  await prisma.session.create({
    data: {
      id: `session-${suffix}`,
      token: `session-token-${suffix}`,
      userId: targetId,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  await prisma.verification.createMany({
    data: [
      {
        id: `challenge-row-${suffix}`,
        identifier: challenge,
        value: targetId,
        expiresAt: new Date(Date.now() + 60_000),
      },
      {
        id: `attempt-row-${suffix}`,
        identifier: `2fa-attempts-${challenge}`,
        value: "2",
        expiresAt: new Date(Date.now() + 60_000),
      },
      {
        id: `trust-row-${suffix}`,
        identifier: `trust-device-${suffix}`,
        value: targetId,
        expiresAt: new Date(Date.now() + 60_000),
      },
      {
        id: `unrelated-challenge-${suffix}`,
        identifier: `2fa-unrelated-${suffix}`,
        value: unrelatedId,
        expiresAt: new Date(Date.now() + 60_000),
      },
    ],
  });

  const { resetUserTwoFactor } = await import(
    "../src/server/users/reset-user-two-factor.ts"
  );
  await resetUserTwoFactor(targetId, adminId);

  const [target, factors, passkeys, sessions, targetVerifications, unrelated] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: targetId },
        select: { twoFactorEnabled: true },
      }),
      prisma.twoFactor.count({ where: { userId: targetId } }),
      prisma.passkey.count({ where: { userId: targetId } }),
      prisma.session.count({ where: { userId: targetId } }),
      prisma.verification.count({
        where: {
          OR: [
            { value: targetId, identifier: { startsWith: "2fa-" } },
            { value: targetId, identifier: { startsWith: "trust-device-" } },
            { identifier: { in: [`2fa-attempts-${challenge}`] } },
          ],
        },
      }),
      prisma.verification.findUnique({
        where: { id: `unrelated-challenge-${suffix}` },
        select: { id: true },
      }),
    ]);

  assert.equal(target?.twoFactorEnabled, false);
  assert.equal(factors, 0);
  assert.equal(passkeys, 0);
  assert.equal(sessions, 0);
  assert.equal(targetVerifications, 0);
  assert.deepEqual(unrelated, { id: `unrelated-challenge-${suffix}` });
});
