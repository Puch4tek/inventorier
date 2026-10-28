import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import pg from "pg";

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

const database = `${url.pathname.slice(1)}_rate_limit`;
const adminUrl = new URL(testUrl);
adminUrl.pathname = "/postgres";
url.pathname = `/${database}`;
const admin = new pg.Client({ connectionString: adminUrl.toString() });
const db = new pg.Client({ connectionString: url.toString() });
let prisma;
let consumeEmailRateLimit;
const keysToClean = new Set();

function rememberKey(identifier, namespace = "smtp-test-limit") {
  const digest = createHash("sha256").update(identifier, "utf8").digest("hex");
  keysToClean.add(`${namespace}:${digest}`);
}

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${database}"`);
  await db.connect();
  await db.query(
    await readFile("prisma/migrations/20261027115504_apply_the_schema/migration.sql", "utf8"),
  );
  await db.query(
    await readFile("prisma/migrations/20261028210000_remove_user_password_hash/migration.sql", "utf8"),
  );
  process.env.DATABASE_URL = url.toString();
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("../src/generated/prisma/client.ts");
  ({ consumeEmailRateLimit } = await import("../src/server/settings/email-rate-limit.ts"));
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
});

after(async () => {
  if (keysToClean.size > 0) {
    await prisma.verification.deleteMany({
      where: { identifier: { in: [...keysToClean] } },
    });
  }
  await prisma?.$disconnect();
  await db.end();
  await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
  await admin.end();
});

test("SMTP test sends allow five attempts per admin in a sliding hour", async () => {
  const actorId = `email-limit-admin-${randomUUID()}`;
  const otherActorId = `email-limit-other-admin-${randomUUID()}`;
  rememberKey(actorId);
  rememberKey(otherActorId);

  const results = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    results.push(await consumeEmailRateLimit(actorId, 5, 60 * 60 * 1000));
  }

  assert.deepEqual(results, [true, true, true, true, true, false]);
  assert.equal(await consumeEmailRateLimit(otherActorId, 5, 60 * 60 * 1000), true);
  const digest = createHash("sha256").update(actorId, "utf8").digest("hex");
  const rows = await prisma.verification.findMany({
    where: { identifier: `smtp-test-limit:${digest}` },
    select: { value: true },
  });
  assert.equal(rows.length, 5);
  assert.ok(rows.every(({ value }) => value === "1"));
});

test("concurrent consumers cannot exceed the shared quota", async () => {
  const actorId = `email-limit-concurrent-${randomUUID()}`;
  rememberKey(actorId);

  const results = await Promise.all(
    Array.from({ length: 12 }, () => consumeEmailRateLimit(actorId, 5, 60 * 60 * 1000)),
  );

  assert.equal(results.filter(Boolean).length, 5);
  assert.equal(results.filter((allowed) => !allowed).length, 7);
});

test("reset-flow callers can isolate their own hashed rate-limit namespace", async () => {
  const identifier = `reset:${randomUUID()}@example.invalid`;
  rememberKey(identifier, "password-reset-limit");

  assert.equal(await consumeEmailRateLimit(identifier, 1, 60_000, "password-reset-limit"), true);
  assert.equal(await consumeEmailRateLimit(identifier, 1, 60_000, "password-reset-limit"), false);
  assert.equal(await consumeEmailRateLimit(identifier, 1, 60_000, "smtp-test-limit"), true);
});

test("expired counters for other keys are cleaned without touching other verification records", async () => {
  const expiredId = randomUUID();
  const unrelatedId = randomUUID();
  const expired = new Date(Date.now() - 60_000);
  await prisma.verification.createMany({
    data: [
      { id: expiredId, identifier: "password-reset-limit:old", value: "1", expiresAt: expired },
      { id: unrelatedId, identifier: "trust-device-old", value: "user", expiresAt: expired },
    ],
  });
  assert.equal(await consumeEmailRateLimit(randomUUID(), 1, 60_000, "password-reset-limit"), true);
  assert.equal(await prisma.verification.findUnique({ where: { id: expiredId } }), null);
  assert.ok(await prisma.verification.findUnique({ where: { id: unrelatedId } }));
});
