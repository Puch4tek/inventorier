import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import pg from "pg";
import { setDatabaseEnvironment } from "./database-env.mjs";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("Run this suite with tests/run-postgres-tests.sh.");

const url = new URL(testUrl);
if (
  !["127.0.0.1", "localhost", "::1"].includes(url.hostname) ||
  !/^inventory_contract_test_[a-z0-9_]+$/.test(url.pathname.slice(1))
) {
  throw new Error("Tests require a loopback connection to a uniquely named test database.");
}

const database = `${url.pathname.slice(1)}_password_reset`;
const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";
url.pathname = `/${database}`;
const admin = new pg.Client({ connectionString: adminUrl.toString() });
const db = new pg.Client({ connectionString: url.toString() });
const encryptionKey = randomBytes(32).toString("base64");
const actorId = randomUUID();
const actorSessionId = randomUUID();
const userId = randomUUID();
const disabledUserId = randomUUID();
let prisma;
let reset;
let emailSettings;
let adminReset;

const smtp = {
  host: "127.0.0.1",
  port: 1,
  tls: "implicit",
  username: "mailer",
  password: "smtp-password",
  fromEmail: "mail@example.test",
  fromName: "Inventory",
};

function digest(token) {
  return createHash("sha256").update(token).digest("hex");
}

async function createToken(ownerId, expiresAt = new Date(Date.now() + 60_000)) {
  const token = randomBytes(32).toString("hex");
  await prisma.verification.create({
    data: {
      id: randomUUID(),
      identifier: `password-reset:${digest(token)}`,
      value: ownerId,
      expiresAt,
    },
  });
  return token;
}

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  await db.connect();
  await db.query(
    await readFile("prisma/migrations/20261027115504_apply_the_schema/migration.sql", "utf8"),
  );
  await db.query(
    `INSERT INTO "AppSettings" ("id", "registrationEnabled") VALUES (1, false)`,
  );
  await db.query(
    await readFile("prisma/migrations/20261028180000_email_settings/migration.sql", "utf8"),
  );
  await db.query(
    await readFile("prisma/migrations/20261028210000_remove_user_password_hash/migration.sql", "utf8"),
  );
  await db.query(
    await readFile("prisma/migrations/20261030190000_oidc_settings/migration.sql", "utf8"),
  );
  await db.query(
    await readFile("prisma/migrations/20261030192000_oidc_settings_revision/migration.sql", "utf8"),
  );

  setDatabaseEnvironment(url.toString());
  process.env.APP_ENCRYPTION_KEY = encryptionKey;
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client.ts");
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
  reset = await import("../src/server/auth/password-reset.ts");
  emailSettings = await import("../src/server/settings/email.ts");
  ({ resetUserPassword: adminReset } = await import("../src/server/users/reset-user-password.ts"));

  await prisma.user.create({
    data: {
      id: actorId,
      name: "Administrator",
      email: `${actorId}@example.test`,
      role: "ADMIN",
    },
  });
  await prisma.session.create({
    data: { id: actorSessionId, userId: actorId, token: randomUUID(), expiresAt: new Date(Date.now() + 3_600_000) },
  });
  await prisma.user.create({
    data: {
      id: userId,
      name: "Reset User",
      email: "reset-user@example.test",
      mustChangePassword: true,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  });
  await prisma.user.create({
    data: {
      id: disabledUserId,
      name: "Disabled User",
      email: "disabled-user@example.test",
      isActive: false,
    },
  });
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: "old-hash",
    },
  });
  await prisma.session.create({
    data: {
      id: randomUUID(),
      userId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  await prisma.twoFactor.create({
    data: {
      id: randomUUID(),
      userId,
      secret: "factor-secret",
      backupCodes: "backup-codes",
    },
  });
  await prisma.passkey.create({
    data: {
      id: randomUUID(),
      userId,
      publicKey: "public-key",
      credentialID: randomUUID(),
      counter: 0,
      deviceType: "singleDevice",
      backedUp: false,
    },
  });
  await emailSettings.saveEmailSettings(
    {
      ...smtp,
      resetEnabled: true,
      resetExpiryMinutes: 60,
    },
    actorId,
    actorSessionId,
  );
});

after(async () => {
  await prisma?.$disconnect();
  await db.end();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.end();
});

test("reset requests are neutral and a failed SMTP send removes the new token", async () => {
  await assert.doesNotReject(() =>
    reset.requestPasswordReset("reset-user@example.test"),
  );
  await assert.doesNotReject(() =>
    reset.requestPasswordReset("unknown@example.test"),
  );
  await assert.doesNotReject(() =>
    reset.requestPasswordReset("disabled-user@example.test"),
  );

  assert.equal(
    await prisma.verification.count({
      where: { identifier: { not: { startsWith: "password-reset-limit:" } } },
    }),
    0,
  );
  const before = await emailSettings.getResetSettings();
  await emailSettings.saveEmailSettings(
    { ...smtp, resetEnabled: false, resetExpiryMinutes: 60 },
    actorId,
    actorSessionId,
  );
  await reset.requestPasswordReset("reset-user@example.test");
  assert.deepEqual(await emailSettings.getResetSettings(), {
    enabled: false,
    expiryMinutes: 60,
  });
  assert.equal(
    await prisma.verification.count({
      where: { identifier: { not: { startsWith: "password-reset-limit:" } } },
    }),
    0,
  );
  assert.equal(before.enabled, true);
});

test("reset requests use the configured trusted IP rate limit", async () => {
  const previousEnvironment = process.env.NODE_ENV;
  const previousIpHeader = process.env.TRUSTED_PROXY_IP_HEADER;
  process.env.NODE_ENV = "production";
  process.env.TRUSTED_PROXY_IP_HEADER = "x-real-ip";

  try {
    await emailSettings.saveEmailSettings(
      { ...smtp, resetEnabled: true, resetExpiryMinutes: 60 },
      actorId,
      actorSessionId,
    );
    const headers = new Headers({ "x-real-ip": "192.0.2.44" });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await reset.requestPasswordReset(`unknown-${attempt}@example.test`, { headers });
    }
    await reset.requestPasswordReset("reset-user@example.test", { headers });

    const ipKey = `password-reset-ip-limit:${createHash("sha256")
      .update("192.0.2.44")
      .digest("hex")}`;
    assert.equal(
      await prisma.verification.count({ where: { identifier: ipKey } }),
      20,
    );
    assert.equal(
      await prisma.verification.count({
        where: { identifier: { not: { startsWith: "password-reset-limit:" } } },
      }),
      20,
    );
  } finally {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment;
    if (previousIpHeader === undefined) delete process.env.TRUSTED_PROXY_IP_HEADER;
    else process.env.TRUSTED_PROXY_IP_HEADER = previousIpHeader;
  }
});

test("reset updates the credential hash, consumes the token, revokes sessions and preserves MFA", async () => {
  const token = await createToken(userId);
  const stored = await prisma.verification.findFirst({
    where: { identifier: `password-reset:${digest(token)}` },
  });
  assert.ok(stored);
  assert.equal(stored.value, userId);
  assert.notEqual(stored.identifier, token);

  await reset.resetPassword(token, "correct horse battery");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  assert.equal(user.mustChangePassword, false);
  assert.equal(user.emailVerified, true);
  assert.equal(user.isActive, true);
  assert.ok(account?.password);
  assert.ok(await bcrypt.compare("correct horse battery", account.password));
  assert.equal(await prisma.session.count({ where: { userId } }), 0);
  assert.equal(await prisma.twoFactor.count({ where: { userId } }), 1);
  assert.equal(await prisma.passkey.count({ where: { userId } }), 1);
  assert.equal(await prisma.verification.count({ where: { id: stored.id } }), 0);
  await assert.rejects(reset.resetPassword(token, "another password"), reset.PasswordResetError);
});

test("invalid, expired, inactive and credential-less resets fail without partial changes", async () => {
  await assert.rejects(
    reset.resetPassword("not-a-token", "correct horse battery"),
    reset.PasswordResetError,
  );

  const expiredToken = await createToken(
    userId,
    new Date(Date.now() - 60_000),
  );
  await assert.rejects(
    reset.resetPassword(expiredToken, "correct horse battery"),
    reset.PasswordResetError,
  );

  const inactiveToken = await createToken(disabledUserId);
  await assert.rejects(
    reset.resetPassword(inactiveToken, "correct horse battery"),
    reset.PasswordResetError,
  );

  const noCredentialId = randomUUID();
  await prisma.user.create({
    data: {
      id: noCredentialId,
      name: "No Credential",
      email: `${noCredentialId}@example.test`,
    },
  });
  const noCredentialToken = await createToken(noCredentialId);
  await assert.rejects(
    reset.resetPassword(noCredentialToken, "correct horse battery"),
    reset.PasswordResetError,
  );

  assert.equal(
    await prisma.verification.count({ where: { identifier: `password-reset:${digest(noCredentialToken)}` } }),
    1,
  );
  assert.equal(
    await prisma.account.count({
      where: { userId: noCredentialId, providerId: "credential" },
    }),
    0,
  );
  await assert.rejects(
    adminReset(noCredentialId, "administrator password", actorId),
    /konta umożliwiającego logowanie hasłem/,
  );
  assert.equal(
    (await prisma.user.findUnique({ where: { id: noCredentialId } })).mustChangePassword,
    false,
  );
});

test("concurrent use of one token can commit only once", async () => {
  const token = await createToken(userId);
  const outcomes = await Promise.allSettled([
    reset.resetPassword(token, "first concurrent password"),
    reset.resetPassword(token, "second concurrent password"),
  ]);
  assert.equal(outcomes.filter(({ status }) => status === "fulfilled").length, 1);
  assert.equal(outcomes.filter(({ status }) => status === "rejected").length, 1);
});

test("password changes revoke reset links but preserve other verification", async () => {
  const first = await createToken(userId);
  const second = await createToken(userId);
  const otherId = randomUUID();
  await prisma.verification.create({
    data: { id: otherId, identifier: `trust-device-${randomUUID()}`, value: userId, expiresAt: new Date(Date.now() + 60_000) },
  });
  await reset.resetPassword(first, "fresh password here");
  await assert.rejects(reset.resetPassword(second, "another password"), reset.PasswordResetError);
  assert.ok(await prisma.verification.findUnique({ where: { id: otherId } }));

  const third = await createToken(userId);
  const fourth = await createToken(userId);
  await adminReset(userId, "administrator password", actorId);
  const updatedAccount = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  assert.ok(updatedAccount?.password);
  assert.ok(await bcrypt.compare("administrator password", updatedAccount.password));
  assert.equal(
    (await prisma.user.findUnique({ where: { id: userId } })).mustChangePassword,
    true,
  );
  await assert.rejects(reset.resetPassword(third, "another password"), reset.PasswordResetError);
  await assert.rejects(reset.resetPassword(fourth, "another password"), reset.PasswordResetError);
  assert.ok(await prisma.verification.findUnique({ where: { id: otherId } }));
});

test("unprefixed verification identifiers cannot be used as password reset tokens", async () => {
  const token = randomBytes(32).toString("hex");
  const id = randomUUID();
  await prisma.verification.create({
    data: { id, identifier: digest(token), value: userId, expiresAt: new Date(Date.now() + 60_000) },
  });
  await assert.rejects(reset.resetPassword(token, "another password"), reset.PasswordResetError);
  await adminReset(userId, "administrator password", actorId);
  assert.ok(await prisma.verification.findUnique({ where: { id } }));
});

test("a token that expires while awaiting the mutation lock is rejected", async () => {
  const token = await createToken(userId, new Date(Date.now() + 1_500));
  await db.query("BEGIN");
  await db.query("SELECT pg_advisory_xact_lock(1196573523, 1)");
  try {
    const attempt = reset.resetPassword(token, "new password after expiry");
    const outcome = attempt.then(() => null, (error) => error);
    await new Promise((resolve) => setTimeout(resolve, 1_700));
    await db.query("COMMIT");
    assert.ok((await outcome) instanceof reset.PasswordResetError);
  } finally {
    await db.query("ROLLBACK");
  }
});
