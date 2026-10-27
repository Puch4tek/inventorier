import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { after, before, test } from "node:test";
import pg from "pg";

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
const freshDatabase = `${url.pathname.slice(1)}_fresh`;
const populatedDatabase = `${url.pathname.slice(1)}_populated`;
const bootstrapConfig = "tests/bootstrap-prisma.config.ts";
let client;

function databaseUrl(name) {
  const result = new URL(testUrl);
  result.pathname = `/${name}`;
  return result.toString();
}

async function connectTo(urlString) {
  const connection = new Client({ connectionString: urlString });
  await connection.connect();
  return connection;
}

async function createDatabase(name) {
  const admin = await connectTo(adminUrl.toString());
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }
}

function deployBootstrap(name) {
  const env = { ...process.env, TEST_DATABASE_URL: databaseUrl(name) };
  delete env.DATABASE_URL;
  return spawnSync(
    "node_modules/.bin/prisma",
    ["migrate", "deploy", "--config", bootstrapConfig],
    { cwd: process.cwd(), env, encoding: "utf8" },
  );
}

before(async () => {
  await createDatabase(freshDatabase);
  await createDatabase(populatedDatabase);
  const result = deployBootstrap(freshDatabase);
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(
    result.status,
    0,
    `${result.stdout}\n${result.stderr}`,
  );
  client = await connectTo(databaseUrl(freshDatabase));
});

after(async () => {
  await client?.end();
  const admin = await connectTo(adminUrl.toString());
  try {
    for (const name of [freshDatabase, populatedDatabase]) {
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    }
  } finally {
    await admin.end();
  }
});

test("fresh bootstrap creates per-warehouse roles and no seeded warehouse", async () => {
  const tables = await client.query(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`,
  );
  const tableNames = new Set(tables.rows.map(({ tablename }) => tablename));
  assert.ok(tableNames.has("WarehouseMember"));
  assert.ok(tableNames.has("Warehouse"));
  assert.ok(!tableNames.has("Organization"));
  assert.ok(!tableNames.has("OrganizationMember"));

  const roles = await client.query(
    `SELECT enumlabel FROM pg_enum
     JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
     WHERE pg_type.typname = 'WarehouseRole'
     ORDER BY enumsortorder`,
  );
  assert.deepEqual(roles.rows.map(({ enumlabel }) => enumlabel), ["USER", "MANAGER"]);

  const warehouses = await client.query(`SELECT count(*)::int AS count FROM "Warehouse"`);
  assert.equal(warehouses.rows[0].count, 0);
  const settings = await client.query(`SELECT count(*)::int AS count FROM "AppSettings"`);
  assert.equal(settings.rows[0].count, 0);
});

test("membership rows represent independent roles per warehouse; admins need no membership", async () => {
  const suffix = randomUUID();
  const insertUser = `
    INSERT INTO "user" ("id", "email", "name", "role", "updatedAt")
    VALUES ($1, $2, $3, $4::"Role", now())
  `;
  await client.query(insertUser, [`user-${suffix}`, `${suffix}@test.invalid`, "Member", "USER"]);
  await client.query(insertUser, [`admin-${suffix}`, `admin-${suffix}@test.invalid`, "Admin", "ADMIN"]);
  await client.query(
    `INSERT INTO "Warehouse" ("id", "name", "slug", "updatedAt")
     VALUES ($1, 'Warehouse A', $2, now()), ($3, 'Warehouse B', $4, now()), ($5, 'Warehouse C', $6, now())`,
    [`a-${suffix}`, `a-${suffix}`, `b-${suffix}`, `b-${suffix}`, `c-${suffix}`, `c-${suffix}`],
  );
  await client.query(
    `INSERT INTO "WarehouseMember" ("id", "userId", "warehouseId", "role", "updatedAt")
     VALUES ($1, $2, $3, 'USER', now()), ($4, $2, $5, 'MANAGER', now())`,
    [`member-a-${suffix}`, `user-${suffix}`, `a-${suffix}`, `member-b-${suffix}`, `b-${suffix}`],
  );

  const assignments = await client.query(
    `SELECT w."id", m."role"::text
     FROM "Warehouse" w
     LEFT JOIN "WarehouseMember" m
       ON m."warehouseId" = w."id" AND m."userId" = $1
     WHERE w."id" = ANY($2::text[])
     ORDER BY w."id"`,
    [`user-${suffix}`, [`a-${suffix}`, `b-${suffix}`, `c-${suffix}`]],
  );
  assert.deepEqual(
    Object.fromEntries(assignments.rows.map(({ id, role }) => [id, role])),
    { [`a-${suffix}`]: "USER", [`b-${suffix}`]: "MANAGER", [`c-${suffix}`]: null },
  );

  const adminMemberships = await client.query(
    `SELECT count(*)::int AS count FROM "WarehouseMember" WHERE "userId" = $1`,
    [`admin-${suffix}`],
  );
  assert.equal(adminMemberships.rows[0].count, 0);

  await assert.rejects(
    client.query(
      `INSERT INTO "WarehouseMember" ("id", "userId", "warehouseId", "role", "updatedAt")
       VALUES ($1, $2, $3, 'USER', now())`,
      [`duplicate-${suffix}`, `user-${suffix}`, `a-${suffix}`],
    ),
    { code: "23505" },
  );
});

test("warehouse membership foreign keys cascade on warehouse and user deletion", async () => {
  const suffix = randomUUID();
  const userId = `user-${suffix}`;
  const warehouseId = `warehouse-${suffix}`;
  await client.query(
    `INSERT INTO "user" ("id", "email", "name", "updatedAt")
     VALUES ($1, $2, 'Member', now())`,
    [userId, `${suffix}@test.invalid`],
  );
  await client.query(
    `INSERT INTO "Warehouse" ("id", "name", "slug", "updatedAt")
     VALUES ($1, 'Disposable', $2, now())`,
    [warehouseId, suffix],
  );
  await client.query(
    `INSERT INTO "WarehouseMember" ("id", "userId", "warehouseId", "updatedAt")
     VALUES ($1, $2, $3, now())`,
    [`membership-${suffix}`, userId, warehouseId],
  );

  await client.query(`DELETE FROM "Warehouse" WHERE "id" = $1`, [warehouseId]);
  const memberships = await client.query(
    `SELECT count(*)::int AS count FROM "WarehouseMember" WHERE "id" = $1`,
    [`membership-${suffix}`],
  );
  assert.equal(memberships.rows[0].count, 0);

  const secondWarehouseId = `warehouse-user-cascade-${suffix}`;
  await client.query(
    `INSERT INTO "Warehouse" ("id", "name", "slug", "updatedAt")
     VALUES ($1, 'Second disposable', $2, now())`,
    [secondWarehouseId, `second-${suffix}`],
  );
  await client.query(
    `INSERT INTO "WarehouseMember" ("id", "userId", "warehouseId", "updatedAt")
     VALUES ($1, $2, $3, now())`,
    [`user-cascade-membership-${suffix}`, userId, secondWarehouseId],
  );
  await client.query(`DELETE FROM "user" WHERE "id" = $1`, [userId]);
  const userMemberships = await client.query(
    `SELECT count(*)::int AS count FROM "WarehouseMember" WHERE "id" = $1`,
    [`user-cascade-membership-${suffix}`],
  );
  assert.equal(userMemberships.rows[0].count, 0);
});

test("barcode uniqueness is global and history retains its actor after user deletion", async () => {
  const suffix = randomUUID();
  const userId = `history-user-${suffix}`;
  const warehouseIds = [`history-a-${suffix}`, `history-b-${suffix}`];
  await client.query(
    `INSERT INTO "user" ("id", "email", "name", "updatedAt")
     VALUES ($1, $2, 'History actor', now())`,
    [userId, `${suffix}@test.invalid`],
  );
  await client.query(
    `INSERT INTO "Warehouse" ("id", "name", "slug", "updatedAt")
     VALUES ($1, 'History A', $2, now()), ($3, 'History B', $4, now())`,
    [warehouseIds[0], `history-a-${suffix}`, warehouseIds[1], `history-b-${suffix}`],
  );
  const locations = await client.query(
    `INSERT INTO "Location" ("warehouseId", "name", "updatedAt")
     VALUES ($1, 'Location A', now()), ($2, 'Location B', now())
     RETURNING "id"`,
    warehouseIds,
  );
  const items = await client.query(
    `INSERT INTO "Item" ("barcode", "name", "quantity", "unit", "locationId", "updatedAt")
     VALUES ($1, 'Item A', 1, 'each', $2, now()), ($3, 'Item B', 1, 'each', $4, now())
     RETURNING "id"`,
    [`global-barcode-${suffix}`, locations.rows[0].id, `other-barcode-${suffix}`, locations.rows[1].id],
  );
  await assert.rejects(
    client.query(
      `INSERT INTO "Item" ("barcode", "name", "quantity", "unit", "locationId", "updatedAt")
       VALUES ($1, 'Duplicate barcode', 1, 'each', $2, now())`,
      [`global-barcode-${suffix}`, locations.rows[1].id],
    ),
    { code: "23505" },
  );
  await client.query(
    `INSERT INTO "ItemHistory" ("itemId", "userId", "actorName", "type")
     VALUES ($1, $2, 'History actor', 'QUANTITY_CHANGED')`,
    [items.rows[0].id, userId],
  );
  await client.query(`DELETE FROM "user" WHERE "id" = $1`, [userId]);

  const history = await client.query(
    `SELECT "userId", "actorName" FROM "ItemHistory" WHERE "itemId" = $1`,
    [items.rows[0].id],
  );
  assert.deepEqual(history.rows, [{ userId: null, actorName: "History actor" }]);
});

test("fresh-install bootstrap refuses a populated schema without deleting its marker", async () => {
  const populated = await connectTo(databaseUrl(populatedDatabase));
  try {
    await populated.query(`CREATE TABLE "keep_marker" ("value" text NOT NULL)`);
    await populated.query(`INSERT INTO "keep_marker" VALUES ('preserve me')`);
  } finally {
    await populated.end();
  }

  const result = deployBootstrap(populatedDatabase);
  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /P3005/,
  );

  const verify = await connectTo(databaseUrl(populatedDatabase));
  try {
    const marker = await verify.query(`SELECT "value" FROM "keep_marker"`);
    assert.deepEqual(marker.rows, [{ value: "preserve me" }]);
    const baseline = await verify.query(
      `SELECT to_regclass('public."Warehouse"') AS warehouse_table`,
    );
    assert.equal(baseline.rows[0].warehouse_table, null);
  } finally {
    await verify.end();
  }
});
