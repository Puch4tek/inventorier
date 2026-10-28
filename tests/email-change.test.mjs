import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { after, before, test } from "node:test";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import pg from "pg";
import { splitSetCookieHeader } from "better-auth/cookies";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("Run this suite with tests/run-postgres-tests.sh.");

const url = new URL(testUrl);
if (
  !["127.0.0.1", "localhost", "::1"].includes(url.hostname) ||
  !/^inventory_contract_test_[a-z0-9_]+$/.test(url.pathname.slice(1))
) {
  throw new Error("Tests require a loopback connection to a uniquely named test database.");
}

const adminUrl = new URL(testUrl);
adminUrl.pathname = "/postgres";
const databaseName = `email_change_${randomUUID().replaceAll("-", "")}`;
const databaseUrl = new URL(testUrl);
databaseUrl.pathname = `/${databaseName}`;
let prisma;
let auth;
let adminId;
let adminSessionId;

async function connectTo(connectionString) {
  const client = new pg.Client({ connectionString });
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

async function createUser(email) {
  const id = randomUUID();
  const password = "correct horse battery";
  await prisma.user.create({
    data: {
      id,
      email,
      name: "Email change test",
      emailVerified: false,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await bcrypt.hash(password, 4),
        },
      },
    },
  });
  return { email, password, id };
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
  process.env.SMTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");

  ({ prisma } = await import("../src/lib/db/prisma.ts"));
  ({ auth } = await import("../src/lib/auth.ts"));

  adminId = randomUUID();
  adminSessionId = randomUUID();
  await prisma.user.create({
    data: {
      id: adminId,
      email: `${adminId}@example.test`,
      name: "SMTP test admin",
      role: "ADMIN",
    },
  });
  await prisma.session.create({
    data: {
      id: adminSessionId,
      userId: adminId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  const { saveEmailSettings } = await import("../src/server/settings/email.ts");
  await saveEmailSettings({
    host: "smtp.example.test",
    port: 587,
    tls: "starttls",
    username: "mailer",
    password: "test-smtp-password",
    fromEmail: "mail@example.test",
    fromName: "Inventory",
    resetEnabled: false,
    resetExpiryMinutes: 60,
  }, adminId, adminSessionId);
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

test("Better Auth changes email only after verification at the new address", async (t) => {
  const sent = [];
  t.mock.method(nodemailer, "createTransport", () => ({
    async sendMail(message) {
      sent.push(message);
      return {};
    },
  }));

  const user = await createUser("old-address@example.test");
  const cookieJar = new Map();
  await apiCall("signInEmail", cookieJar, {
    body: { email: user.email, password: user.password },
  });

  const newEmail = "new-address@example.test";
  const callbackURL = "/settings?tab=email&emailChange=success";
  const requested = await apiCall("changeEmail", cookieJar, {
    body: { newEmail, callbackURL },
  });
  assert.equal(requested.status, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, newEmail);
  const pendingUser = await prisma.user.findUnique({ where: { id: user.id } });
  assert.equal(pendingUser.email, user.email);
  assert.equal(pendingUser.emailVerified, false);
  assert.equal(sent[0].subject, "Potwierdź adres e-mail");

  const verificationUrl = new URL(sent[0].text.match(/https?:\/\/\S+/)?.[0] ?? "");
  assert.equal(verificationUrl.pathname, "/api/auth/verify-email");
  assert.equal(verificationUrl.searchParams.get("callbackURL"), callbackURL);
  const token = verificationUrl.searchParams.get("token");
  assert.ok(token);

  const verified = await apiCall("verifyEmail", cookieJar, {
    query: { token },
  });
  assert.equal(verified.status, true);
  assert.equal(
    (await prisma.user.findUnique({ where: { id: user.id } })).email,
    newEmail,
  );
  const session = await auth.api.getSession({
    headers: cookieHeaders(cookieJar),
    query: { disableCookieCache: true },
  });
  assert.equal(session.user.email, newEmail);

  await assert.rejects(() => apiCall("verifyEmail", cookieJar, { query: { token } }));
});
