import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import pg from "pg";
import { setDatabaseEnvironment } from "./database-env.mjs";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("TEST_DATABASE_URL is required.");
const url = new URL(testUrl);
if (!["127.0.0.1", "localhost", "::1"].includes(url.hostname) ||
    !/^inventory_contract_test_[a-z0-9_]+$/.test(url.pathname.slice(1))) {
  throw new Error("Tests require a loopback connection to a uniquely named test database.");
}
const database = `${url.pathname.slice(1)}_smtp`;
const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";
url.pathname = `/${database}`;
const admin = new pg.Client({ connectionString: adminUrl.toString() });
const db = new pg.Client({ connectionString: url.toString() });
const actor = randomUUID();
const user = randomUUID();
const actorSession = randomUUID();
const userSession = randomUUID();
const key = randomBytes(32).toString("base64");
let api;
let prisma;

const valid = {
  host: "smtp.example.test", port: 587, tls: "starttls", username: "mailer",
  fromEmail: "mail@example.test", fromName: "Inventory", resetEnabled: false,
  resetExpiryMinutes: 60,
};

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  await db.connect();
  await db.query(await readFile("prisma/migrations/20261027115504_apply_the_schema/migration.sql", "utf8"));
  await db.query(`INSERT INTO "AppSettings" ("id", "registrationEnabled") VALUES (1, false)`);
  await db.query(await readFile("prisma/migrations/20261028180000_email_settings/migration.sql", "utf8"));
  await db.query(await readFile("prisma/migrations/20261028210000_remove_user_password_hash/migration.sql", "utf8"));
  await db.query(await readFile("prisma/migrations/20261030190000_oidc_settings/migration.sql", "utf8"));
  await db.query(await readFile("prisma/migrations/20261030192000_oidc_settings_revision/migration.sql", "utf8"));
  await db.query(`INSERT INTO "user" ("id", "email", "name", "role", "updatedAt")
    VALUES ($1, $2, 'Admin', 'ADMIN', now()), ($3, $4, 'User', 'USER', now())`,
  [actor, `${actor}@example.test`, user, `${user}@example.test`]);
  await db.query(`INSERT INTO "session" ("id", "userId", "token", "expiresAt", "updatedAt")
    VALUES ($1, $2, $3, now() + interval '1 hour', now()),
           ($4, $5, $6, now() + interval '1 hour', now())`,
  [actorSession, actor, randomUUID(), userSession, user, randomUUID()]);
  setDatabaseEnvironment(url.toString());
  process.env.APP_ENCRYPTION_KEY = key;
  api = await import("../src/server/settings/email.ts");
  ({ prisma } = await import("../src/lib/db/prisma.ts"));
});

after(async () => {
  await prisma?.$disconnect();
  await db.end();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.end();
});

test("migration preserves existing settings and creates safe defaults", async () => {
  const { rows } = await db.query(`SELECT * FROM "AppSettings" WHERE id = 1`);
  assert.equal(rows[0].registrationEnabled, false);
  assert.equal(rows[0].smtpPassword, null);
  assert.equal(rows[0].resetEnabled, false);
  assert.equal(rows[0].resetExpiryMinutes, 60);
  assert.deepEqual(await api.getEmailSettings(actor, actorSession), {
    host: "", port: 587, tls: "starttls", username: "", fromEmail: "", fromName: "",
    hasPassword: false, passwordUnreadable: false, resetEnabled: true, resetExpiryMinutes: 60,
  });
  assert.deepEqual(await api.getResetSettings(), { enabled: false, expiryMinutes: 60 });
  await assert.rejects(api.getSmtpConfig(), { code: "CONFIGURATION" });
  await db.query(`DELETE FROM "AppSettings" WHERE id = 1`);
  assert.equal((await api.getEmailSettings(actor, actorSession)).hasPassword, false);
  assert.deepEqual(await api.getResetSettings(), { enabled: false, expiryMinutes: 60 });
  await assert.rejects(api.getSmtpConfig(), { code: "CONFIGURATION" });
  await db.query(`INSERT INTO "AppSettings" ("id", "registrationEnabled") VALUES (1, false)`);
});

test("reads and writes require an authorized active administrator", async () => {
  await assert.rejects(api.getEmailSettings(user, userSession));
  await assert.rejects(api.saveEmailSettings(valid, user, userSession));
  await db.query(`UPDATE "user" SET "isActive" = false WHERE id = $1`, [actor]);
  await assert.rejects(api.getEmailSettings(actor, actorSession));
  await assert.rejects(api.saveEmailSettings(valid, actor, actorSession));
  await db.query(`UPDATE "user" SET "isActive" = true WHERE id = $1`, [actor]);
  await db.query(`UPDATE "user" SET "twoFactorEnabled" = true WHERE id = $1`, [actor]);
  await assert.doesNotReject(api.getEmailSettings(actor, actorSession));
  await assert.doesNotReject(api.saveEmailSettings(valid, actor, actorSession));
  await assert.rejects(api.getEmailSettings(actor, randomUUID()));
  await assert.rejects(api.getAdminSmtpConfig(actor, randomUUID()), /uprawnień/);
  await db.query(`UPDATE "session" SET "expiresAt" = now() - interval '1 minute' WHERE id = $1`, [actorSession]);
  await assert.rejects(api.saveEmailSettings(valid, actor, actorSession));
  await db.query(`UPDATE "session" SET "expiresAt" = now() + interval '1 hour' WHERE id = $1`, [actorSession]);
  await db.query(`UPDATE "user" SET "twoFactorEnabled" = false WHERE id = $1`, [actor]);
});

test("validation and enablement reject incomplete or malformed values", async () => {
  for (const change of [
    { port: 0 }, { port: 65536 }, { port: 1.5 }, { tls: "plain" },
    { resetExpiryMinutes: 14 }, { resetExpiryMinutes: 1441 },
    { host: "smtp.example.test:587" }, { fromEmail: "bad@example" },
    { fromName: "A\r\nB" }, { password: "x".repeat(4097) },
  ]) {
    await assert.rejects(api.saveEmailSettings({ ...valid, ...change }, actor, actorSession), { code: "VALIDATION" });
  }
  await assert.rejects(api.saveEmailSettings({ ...valid, resetEnabled: true }, actor, actorSession), { code: "CONFIGURATION" });
  await api.saveEmailSettings({ ...valid, port: 1, resetExpiryMinutes: 15 }, actor, actorSession);
  await api.saveEmailSettings({ ...valid, port: 65535, resetExpiryMinutes: 1440 }, actor, actorSession);
});

test("first configuration defaults reset on but activates it only for complete SMTP", async () => {
  await db.query(`UPDATE "AppSettings" SET "smtpHost" = '', "smtpUsername" = '', "smtpFromEmail" = '', "smtpFromName" = '', "smtpPassword" = NULL, "resetEnabled" = false`);
  const initial = await api.getEmailSettings(actor, actorSession);
  assert.equal(initial.resetEnabled, true);
  assert.equal((await api.getResetSettings()).enabled, false);
  await api.saveEmailSettings({ ...valid, resetEnabled: true }, actor, actorSession);
  assert.equal((await api.getResetSettings()).enabled, false);
  await api.saveEmailSettings({ ...valid, password: "first", resetEnabled: true }, actor, actorSession);
  assert.equal((await api.getResetSettings()).enabled, true);
});

test("existing persisted reset flags are not altered by reading settings", async () => {
  await db.query(`UPDATE "AppSettings" SET "smtpHost" = 'smtp.example.test', "smtpPassword" = NULL, "resetEnabled" = false`);
  assert.equal((await api.getEmailSettings(actor, actorSession)).resetEnabled, false);
  assert.equal((await db.query(`SELECT "resetEnabled" FROM "AppSettings" WHERE id = 1`)).rows[0].resetEnabled, false);
  await assert.rejects(api.saveEmailSettings({ ...valid, resetEnabled: true }, actor, actorSession), { code: "CONFIGURATION" });
});

test("password is encrypted, retained and replaced; it cannot be cleared", async () => {
  const password = "secret SMTP password";
  await api.saveEmailSettings({ ...valid, password, resetEnabled: true }, actor, actorSession);
  const first = (await db.query(`SELECT "smtpPassword" FROM "AppSettings" WHERE id = 1`)).rows[0].smtpPassword;
  assert.ok(first.startsWith("v1:"));
  assert.ok(!first.includes(password));
  const publicSettings = await api.getEmailSettings(actor, actorSession);
  assert.equal(publicSettings.hasPassword, true);
  assert.ok(!JSON.stringify(publicSettings).includes(password));
  assert.equal((await api.getSmtpConfig()).password, password);
  await api.saveEmailSettings({ ...valid, password: "", resetEnabled: false }, actor, actorSession);
  assert.equal((await api.getSmtpConfig()).password, password);
  assert.deepEqual(await api.getResetSettings(), { enabled: false, expiryMinutes: 60 });
  await api.saveEmailSettings({ ...valid, password }, actor, actorSession);
  const second = (await db.query(`SELECT "smtpPassword" FROM "AppSettings" WHERE id = 1`)).rows[0].smtpPassword;
  assert.notEqual(first, second);
  await api.saveEmailSettings({ ...valid, password: "replacement" }, actor, actorSession);
  assert.equal((await api.getSmtpConfig()).password, "replacement");
  await api.saveEmailSettings({ ...valid, password: undefined, clearPassword: true }, actor, actorSession);
  assert.equal((await api.getSmtpConfig()).password, "replacement");
});

test("bad key or modified ciphertext is recoverable by entering a replacement password", async () => {
  await api.saveEmailSettings({ ...valid, password: "secret" }, actor, actorSession);
  const stored = (await db.query(`SELECT "smtpPassword" FROM "AppSettings" WHERE id = 1`)).rows[0].smtpPassword;
  for (const badKey of ["", "invalid", randomBytes(32).toString("base64")]) {
    process.env.APP_ENCRYPTION_KEY = badKey;
    const view = await api.getEmailSettings(actor, actorSession);
    assert.equal(view.passwordUnreadable, true);
    await assert.rejects(api.getSmtpConfig(), { code: "ENCRYPTION" });
    await assert.rejects(api.saveEmailSettings({ ...valid, resetEnabled: true }, actor, actorSession), { code: "ENCRYPTION" });
    await api.saveEmailSettings(valid, actor, actorSession);
    assert.equal((await db.query(`SELECT "smtpPassword" FROM "AppSettings" WHERE id = 1`)).rows[0].smtpPassword, stored);
  }
  process.env.APP_ENCRYPTION_KEY = key;
  await db.query(`UPDATE "AppSettings" SET "smtpPassword" = $1 WHERE id = 1`, [`${stored}x`]);
  assert.equal((await api.getEmailSettings(actor, actorSession)).passwordUnreadable, true);
  await api.saveEmailSettings({ ...valid, password: "recovered", resetEnabled: true }, actor, actorSession);
  assert.equal((await api.getEmailSettings(actor, actorSession)).passwordUnreadable, false);
  assert.equal((await api.getSmtpConfig()).password, "recovered");
});
