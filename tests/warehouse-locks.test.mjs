import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";

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

const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const { lockInstanceMutation, lockInstanceShared } = await import(
  "../src/server/warehouses/transaction-lock.ts"
);
const { createUser } = await import("../src/server/users/create-user.ts");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: testUrl }),
});

function deployBootstrap() {
  const env = { ...process.env, TEST_DATABASE_URL: testUrl };
  return spawnSync(
    "node_modules/.bin/prisma",
    ["migrate", "deploy", "--config", "tests/bootstrap-prisma.config.ts"],
    { cwd: process.cwd(), env, encoding: "utf8" },
  );
}

before(async () => {
  const result = deployBootstrap();
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

after(async () => {
  await prisma.$disconnect();
});

test("shared and exclusive transaction locks execute through Prisma", async () => {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
  });
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
  });
});

test("shared locks coexist while exclusive lock waits for their transactions", async () => {
  let releaseShared;
  let releaseSecondShared;
  let firstSharedAcquired;
  let secondSharedAcquired;
  const firstSharedGate = new Promise((resolve) => {
    releaseShared = resolve;
  });
  const secondSharedGate = new Promise((resolve) => {
    releaseSecondShared = resolve;
  });
  const firstAcquiredGate = new Promise((resolve) => {
    firstSharedAcquired = resolve;
  });
  const secondAcquiredGate = new Promise((resolve) => {
    secondSharedAcquired = resolve;
  });

  const firstSharedTransaction = prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    firstSharedAcquired();
    await firstSharedGate;
  });
  await firstAcquiredGate;

  const secondSharedTransaction = prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    secondSharedAcquired();
    await secondSharedGate;
  });
  await secondAcquiredGate;

  let exclusiveAcquired = false;
  const exclusiveTransaction = prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    exclusiveAcquired = true;
  });

  await delay(100);
  assert.equal(exclusiveAcquired, false);
  releaseShared();
  releaseSecondShared();
  await Promise.all([
    firstSharedTransaction,
    secondSharedTransaction,
    exclusiveTransaction,
  ]);
  assert.equal(exclusiveAcquired, true);
});

test("concurrent first registrations create exactly one admin and no warehouse access", async () => {
  const suffix = randomUUID();
  const users = await Promise.all([
    createUser({
      name: "First registrant",
      email: `first-${suffix}@test.invalid`,
      password: "Test-password-123",
    }),
    createUser({
      name: "Second registrant",
      email: `second-${suffix}@test.invalid`,
      password: "Test-password-123",
    }),
  ]);

  assert.deepEqual(
    users.map(({ role }) => role).sort(),
    ["ADMIN", "USER"],
  );
  const memberships = await prisma.warehouseMember.count({
    where: { userId: { in: users.map(({ id }) => id) } },
  });
  assert.equal(memberships, 0);
});
