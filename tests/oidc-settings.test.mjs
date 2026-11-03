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
const database = `${url.pathname.slice(1)}_oidc`;
const adminUrl = new URL(url);
adminUrl.pathname = "/postgres";
url.pathname = `/${database}`;
const admin = new pg.Client({ connectionString: adminUrl.toString() });
const db = new pg.Client({ connectionString: url.toString() });
const actor = randomUUID();
const user = randomUUID();
const actorSession = randomUUID();
const userSession = randomUUID();
const appKey = randomBytes(32);
let oidc;
let email;
let prisma;

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
  process.env.APP_ENCRYPTION_KEY = appKey.toString("base64");
  process.env.BETTER_AUTH_URL = "https://inventory.example.test";
  ({ prisma } = await import("../src/lib/db/prisma.ts"));
  oidc = await import("../src/server/settings/oidc.ts");
  email = await import("../src/server/settings/email.ts");
});

after(async () => {
  await prisma?.$disconnect();
  await db.end();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.end();
});

test("OIDC settings are admin-only and never return the client secret", async () => {
  const defaultRuntime = await oidc.getOidcRuntimeConfig();
  assert.deepEqual(await oidc.getOidcSettings(actor, actorSession), {
    enabled: false, issuer: "", clientId: "", hasClientSecret: false,
    clientSecretUnreadable: false,
    redirectUri: `https://inventory.example.test/api/auth/callback/oidc-${defaultRuntime.revision}`,
  });
  await assert.rejects(oidc.getOidcSettings(user, userSession));
  await assert.rejects(oidc.saveOidcSettings({
    enabled: false, issuer: "", clientId: "", clientSecret: "private",
  }, user, userSession));
  await assert.rejects(oidc.saveOidcSettings({
    enabled: true, issuer: "https://issuer.example.test", clientId: "app",
  }, actor, actorSession), { code: "CONFIGURATION" });
  await assert.rejects(oidc.saveOidcSettings({
    enabled: false, issuer: "http://attacker.example", clientId: "app",
  }, actor, actorSession), { code: "VALIDATION" });
  await assert.rejects(oidc.saveOidcSettings({
    enabled: false, issuer: "http://localhost", clientId: "app",
  }, actor, actorSession), { code: "VALIDATION" });

  const first = {
    enabled: true, issuer: "https://issuer.example.test/tenant", clientId: "inventory",
    clientSecret: "top-secret",
  };
  await oidc.saveOidcSettings(first, actor, actorSession);
  const stored = (await db.query(`SELECT "oidcClientSecret" FROM "AppSettings" WHERE id = 1`)).rows[0].oidcClientSecret;
  assert.ok(stored.startsWith("v1:"));
  assert.ok(!stored.includes(first.clientSecret));
  const visible = await oidc.getOidcSettings(actor, actorSession);
  const savedRuntime = await oidc.getOidcRuntimeConfig();
  assert.deepEqual(visible, {
    enabled: true, issuer: first.issuer, clientId: first.clientId,
    hasClientSecret: true, clientSecretUnreadable: false,
    redirectUri: `https://inventory.example.test/api/auth/callback/oidc-${savedRuntime.revision}`,
  });
  assert.ok(!JSON.stringify(visible).includes(first.clientSecret));

  await oidc.saveOidcSettings({
    enabled: true, issuer: first.issuer, clientId: "updated-client",
  }, actor, actorSession);
  assert.equal((await db.query(`SELECT "oidcClientSecret" FROM "AppSettings" WHERE id = 1`)).rows[0].oidcClientSecret, stored);
  assert.equal((await oidc.getOidcSettings(actor, actorSession)).clientSecretUnreadable, false);

  process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  assert.equal((await oidc.getOidcSettings(actor, actorSession)).clientSecretUnreadable, true);
  await assert.rejects(oidc.saveOidcSettings({
    enabled: true, issuer: first.issuer, clientId: "updated-client",
  }, actor, actorSession), { code: "ENCRYPTION" });
  await oidc.saveOidcSettings({
    enabled: false, issuer: first.issuer, clientId: "updated-client",
  }, actor, actorSession);
  assert.equal((await db.query(`SELECT "oidcClientSecret" FROM "AppSettings" WHERE id = 1`)).rows[0].oidcClientSecret, stored);
  process.env.APP_ENCRYPTION_KEY = appKey.toString("base64");

  await db.query(`UPDATE "session" SET "expiresAt" = now() - interval '1 minute' WHERE id = $1`, [actorSession]);
  await assert.rejects(oidc.getOidcSettings(actor, actorSession));
  await db.query(`UPDATE "session" SET "expiresAt" = now() + interval '1 hour' WHERE id = $1`, [actorSession]);
});

test("runtime settings include decrypted secret and a persisted revision for every save", async () => {
  const adminView = await oidc.getOidcSettings(actor, actorSession);
  assert.equal(Object.hasOwn(adminView, "clientSecret"), false);
  assert.equal(Object.hasOwn(adminView, "revision"), false);

  const first = await oidc.getOidcRuntimeConfig();
  assert.deepEqual(first, {
    enabled: false,
    issuer: "https://issuer.example.test/tenant",
    clientId: "updated-client",
    clientSecret: "top-secret",
    revision: (await db.query(`SELECT "oidcRevision" FROM "AppSettings" WHERE id = 1`)).rows[0].oidcRevision,
  });

  await oidc.saveOidcSettings({
    enabled: false, issuer: first.issuer, clientId: first.clientId,
  }, actor, actorSession);
  const changed = await oidc.getOidcRuntimeConfig();
  assert.notEqual(changed.revision, first.revision);
  assert.equal(changed.clientSecret, first.clientSecret);

  await oidc.saveOidcSettings({
    enabled: true, issuer: first.issuer, clientId: first.clientId,
  }, actor, actorSession);
  const enabled = await oidc.getOidcRuntimeConfig();
  assert.notEqual(enabled.revision, changed.revision);
  assert.equal(enabled.enabled, true);

  await oidc.saveOidcSettings({
    enabled: false, issuer: enabled.issuer, clientId: enabled.clientId,
  }, actor, actorSession);
  const disabled = await oidc.getOidcRuntimeConfig();
  assert.notEqual(disabled.revision, enabled.revision);
  assert.equal(disabled.enabled, false);

  await oidc.saveOidcSettings({
    enabled: false, issuer: disabled.issuer, clientId: disabled.clientId,
    clientSecret: "rotated-secret",
  }, actor, actorSession);
  const rotated = await oidc.getOidcRuntimeConfig();
  assert.notEqual(rotated.revision, disabled.revision);
  assert.equal(rotated.clientSecret, "rotated-secret");
});

test("SMTP settings use APP_ENCRYPTION_KEY for secret storage", async () => {
  const settings = {
    host: "smtp.example.test", port: 587, tls: "starttls", username: "mailer",
    fromEmail: "mail@example.test", fromName: "Inventory", resetEnabled: false,
    resetExpiryMinutes: 60, password: "smtp-private",
  };
  await email.saveEmailSettings(settings, actor, actorSession);
  const ciphertext = (await db.query(`SELECT "smtpPassword" FROM "AppSettings" WHERE id = 1`)).rows[0].smtpPassword;
  assert.ok(ciphertext.startsWith("v1:"));
  assert.ok(!ciphertext.includes(settings.password));
  assert.equal((await email.getSmtpConfig()).password, settings.password);
});
