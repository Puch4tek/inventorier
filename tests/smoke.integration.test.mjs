import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { auth } from "../src/lib/auth.ts";
import { prisma } from "../src/lib/db/prisma.ts";
import { createUser } from "../src/server/users/create-user.ts";
import { updateItemInTransaction } from "../src/server/items/update-item-transaction.ts";
import { requireWarehouseAccessInTransaction } from "../src/server/warehouses/transaction-lock.ts";

const appUrl = process.env.BETTER_AUTH_URL;
if (!process.env.TEST_DATABASE_URL || !appUrl) {
  throw new Error("Run this smoke test with tests/run-postgres-tests.sh.");
}

after(async () => {
  await prisma.$disconnect();
});

async function signIn(email, password) {
  const origin = new URL(appUrl);
  const response = await auth.handler(
    new Request(new URL("/api/auth/sign-in/email", origin), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: origin.origin,
      },
      body: JSON.stringify({ email, password }),
    }),
  );
  assert.equal(response.status, 200, await response.clone().text());

  const cookie = response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .join("; ");
  assert.ok(cookie, "sign-in should create an authentication cookie");

  const sessionResponse = await auth.handler(
    new Request(new URL("/api/auth/get-session", origin), {
      headers: { cookie, origin: origin.origin },
    }),
  );
  assert.equal(sessionResponse.status, 200);
  const session = await sessionResponse.json();
  assert.ok(session?.session?.id);
  return session;
}

test("fresh install supports first-admin auth, warehouse items, and access checks", async () => {
  assert.equal(await prisma.user.count(), 0);
  assert.equal(await prisma.warehouse.count(), 0);

  const suffix = randomUUID();
  const password = "Smoke-test-password-123";
  const admin = await createUser({
    name: "Smoke Administrator",
    email: `smoke-admin-${suffix}@test.invalid`,
    password,
  });
  assert.equal(admin.role, "ADMIN");

  const adminSession = await signIn(admin.email, password);
  assert.equal(adminSession.user.id, admin.id);

  const warehouse = await prisma.warehouse.create({
    data: {
      id: randomUUID(),
      name: "Smoke warehouse",
      slug: `smoke-${suffix}`,
    },
  });
  const location = await prisma.location.create({
    data: { name: "Smoke location", warehouseId: warehouse.id },
  });
  const item = await prisma.item.create({
    data: {
      name: "Initial item",
      barcode: `smoke-${suffix}`,
      quantity: 3,
      unit: "each",
      locationId: location.id,
    },
  });

  const adminContext = {
    user: { id: admin.id, name: admin.name },
    sessionId: adminSession.session.id,
    warehouse: { id: warehouse.id },
    access: "ADMIN",
  };
  const updatedItem = await prisma.$transaction(async (transaction) => {
    const access = await requireWarehouseAccessInTransaction(
      transaction,
      admin.id,
      adminSession.session.id,
      warehouse.id,
      true,
    );
    assert.equal(access.access, "ADMIN");
    return updateItemInTransaction(transaction, adminContext, {
      id: item.id,
      name: "Updated item",
    });
  });
  assert.equal(updatedItem.name, "Updated item");
  assert.deepEqual(
    await prisma.itemHistory.findMany({
      where: { itemId: item.id },
      select: { type: true, oldValue: true, newValue: true },
    }),
    [{ type: "ITEM_UPDATED", oldValue: "Initial item", newValue: "Updated item" }],
  );

  const user = await createUser({
    name: "Smoke User",
    email: `smoke-user-${suffix}@test.invalid`,
    password,
  });
  assert.equal(user.role, "USER");
  const userSession = await signIn(user.email, password);
  assert.equal(userSession.user.id, user.id);
  await assert.rejects(
    prisma.$transaction((transaction) =>
      requireWarehouseAccessInTransaction(
        transaction,
        user.id,
        userSession.session.id,
        warehouse.id,
      ),
    ),
  );
});
