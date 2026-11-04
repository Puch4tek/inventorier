import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import pg from "pg";
import { auth, createOidcAuth } from "../src/lib/auth.ts";
import { prisma } from "../src/lib/db/prisma.ts";
import { createUser } from "../src/server/users/create-user.ts";
import { unlinkOidcAccounts } from "../src/server/security/oidc-accounts.ts";
import { getOidcRuntimeConfig, getOidcSettings, saveOidcSettings } from "../src/server/settings/oidc.ts";
import { encryptSecret } from "../src/server/security/secret-encryption.ts";
import { GET as oidcGet, POST as oidcPost } from "../src/app/api/auth/[...all]/route.ts";

const appUrl = process.env.BETTER_AUTH_URL;
if (!process.env.TEST_DATABASE_URL || !appUrl) {
  throw new Error("Run this integration test with tests/run-postgres-tests.sh.");
}

const clientId = "oidc-test-client";
const providerId = "oidc";
const pendingTokens = new Map();
let server;
let issuer;
let oidcAuth;
let privateKey;
let publicJwk;
let tokenAudience = clientId;

before(async () => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  privateKey = keys.privateKey;
  publicJwk = { ...keys.publicKey.export({ format: "jwk" }), kid: "test-key", alg: "RS256", use: "sig" };
  server = createServer(async (req, res) => {
    res.setHeader("content-type", "application/json");
    if (req.url === "/.well-known/openid-configuration") {
      res.end(JSON.stringify({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/jwks`,
        id_token_signing_alg_values_supported: ["RS256"],
      }));
    } else if (req.url === "/jwks") {
      res.end(JSON.stringify({ keys: [publicJwk] }));
    } else if (req.url === "/token" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const code = new URLSearchParams(body).get("code");
      const claims = pendingTokens.get(code);
      pendingTokens.delete(code);
      if (!claims) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "invalid_grant" }));
        return;
      }
      const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
      const issuedAt = Math.floor(Date.now() / 1000);
      const jwt = [
        encode({ alg: "RS256", kid: "test-key" }),
        encode({ ...claims, iss: issuer, aud: tokenAudience, iat: issuedAt, exp: issuedAt + 300 }),
      ].join(".");
      const idToken = `${jwt}.${sign("RSA-SHA256", Buffer.from(jwt), privateKey).toString("base64url")}`;
      res.end(JSON.stringify({ access_token: "test-access-token", token_type: "Bearer", id_token: idToken }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "not_found" }));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  issuer = `http://127.0.0.1:${server.address().port}`;
  oidcAuth = createOidcAuth({
    enabled: true,
    issuer,
    clientId,
    clientSecret: "test-client-secret",
  });
  await prisma.appSettings.upsert({
    where: { id: 1 },
    create: { id: 1, oidcEnabled: true, oidcIssuer: issuer, oidcClientId: clientId, oidcClientSecret: encryptSecret("test-client-secret") },
    update: { oidcEnabled: true, oidcIssuer: issuer, oidcClientId: clientId, oidcClientSecret: encryptSecret("test-client-secret") },
  });
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

async function localSession() {
  const password = "Local-test-password-123";
  const user = await createUser({ name: "Local user", email: `${randomUUID()}@test.invalid`, password });
  const origin = new URL(appUrl);
  const response = await auth.handler(new Request(new URL("/api/auth/sign-in/email", origin), {
    method: "POST",
    headers: { "content-type": "application/json", origin: origin.origin },
    body: JSON.stringify({ email: user.email, password }),
  }));
  assert.equal(response.status, 200, await response.clone().text());
  const cookie = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  assert.ok(session?.session.id);
  return { user, cookie, sessionId: session.session.id };
}

async function signIn(claims, sessionCookie, dropSession = false) {
  const origin = new URL(appUrl);
  const start = await oidcAuth.handler(new Request(new URL(sessionCookie ? "/api/auth/link-social" : "/api/auth/sign-in/social", origin), {
    method: "POST",
    headers: { "content-type": "application/json", origin: origin.origin, ...(sessionCookie ? { cookie: sessionCookie } : {}) },
    body: JSON.stringify({ provider: providerId, callbackURL: "/success" }),
  }));
  assert.equal(start.status, 200, await start.clone().text());
  const authorizationUrl = new URL((await start.json()).url);
  assert.deepEqual(new Set(authorizationUrl.searchParams.get("scope").split(" ")), new Set(["openid", "email", "profile"]));
  const cookie = [
    !dropSession && sessionCookie,
    ...start.headers.getSetCookie().map((value) => value.split(";", 1)[0]),
  ].filter(Boolean).join("; ");
  assert.ok(cookie);
  const code = randomUUID();
  pendingTokens.set(code, { ...claims, nonce: authorizationUrl.searchParams.get("nonce") });
  const callback = new URL(`/api/auth/callback/${providerId}`, origin);
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", authorizationUrl.searchParams.get("state"));
  const response = await oidcAuth.handler(new Request(callback, {
    headers: { cookie, origin: origin.origin },
  }));
  assert.equal(response.status, dropSession ? 401 : 302);
  return response;
}

test("OIDC accepts unverified or absent email_verified and signs in again by subject", async () => {
  for (const verified of [false, undefined]) {
    const sub = randomUUID();
    const email = `oidc-${sub}@test.invalid`;
    const claims = { sub, email, ...(verified === undefined ? {} : { email_verified: verified }) };
    const first = await signIn(claims);
    assert.equal(new URL(first.headers.get("location"), appUrl).pathname, "/success");
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.equal(user.emailVerified, false);
    const account = await prisma.account.findFirstOrThrow({ where: { providerId, accountId: sub } });
    assert.equal(account.userId, user.id);
    const second = await signIn(claims);
    assert.equal(new URL(second.headers.get("location"), appUrl).pathname, "/success");
    assert.equal(await prisma.account.count({ where: { providerId, accountId: sub } }), 1);
  }
});

test("OIDC refuses implicit linking even for a verified email", async () => {
  const email = `existing-${randomUUID()}@test.invalid`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), email, name: "Existing user", emailVerified: true },
  });
  const sub = randomUUID();
  const response = await signIn({ sub, email, email_verified: true });
  assert.equal(new URL(response.headers.get("location"), appUrl).searchParams.get("error"), "account_not_linked");
  assert.equal(await prisma.account.count({ where: { userId: user.id, providerId } }), 0);
});

test("an authenticated user can link a different unverified email and sign in", async () => {
  const { user, cookie } = await localSession();
  const sub = randomUUID();
  const claims = { sub, email: `${randomUUID()}@test.invalid` };
  const response = await signIn(claims, cookie);
  assert.equal(new URL(response.headers.get("location"), appUrl).pathname, "/success");
  const account = await prisma.account.findFirstOrThrow({ where: { providerId, accountId: sub } });
  assert.equal(account.userId, user.id);
  assert.equal(new URL((await signIn(claims)).headers.get("location"), appUrl).pathname, "/success");
});

test("the application link route initiates and completes an authenticated OIDC callback", async () => {
  const { user, cookie } = await localSession();
  const origin = new URL(appUrl);
  const routeUrl = new URL("/api/auth/oidc/link", origin);
  const badOrigin = await oidcPost(new Request(routeUrl, { method: "POST", headers: { origin: "https://evil.invalid", cookie } }));
  assert.equal(badOrigin.status, 403);
  const anonymous = await oidcPost(new Request(routeUrl, { method: "POST", headers: { origin: origin.origin } }));
  assert.equal(anonymous.status, 401);
  const start = await oidcPost(new Request(routeUrl, { method: "POST", headers: { origin: origin.origin, cookie } }));
  assert.equal(start.status, 302, await start.clone().text());
  const authorizationUrl = new URL(start.headers.get("location"));
  const stateCookie = start.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  const code = randomUUID();
  const sub = randomUUID();
  pendingTokens.set(code, { sub, email: `${randomUUID()}@test.invalid`, nonce: authorizationUrl.searchParams.get("nonce") });
  const callback = new URL(`/api/auth/callback/${providerId}`, origin);
  callback.searchParams.set("code", code);
  callback.searchParams.set("state", authorizationUrl.searchParams.get("state"));
  const response = await oidcGet(new Request(callback, { headers: { cookie: `${cookie}; ${stateCookie}`, origin: origin.origin } }));
  assert.equal(response.status, 302, await response.clone().text());
  assert.equal(new URL(response.headers.get("location"), appUrl).searchParams.get("oidc"), "connected");
  assert.equal((await prisma.account.findFirstOrThrow({ where: { providerId, accountId: sub } })).userId, user.id);
});

test("an identity cannot be linked to a different user or without the initiating session", async () => {
  const first = await localSession();
  const second = await localSession();
  const sub = randomUUID();
  const claims = { sub, email: `${randomUUID()}@test.invalid` };
  assert.equal(new URL((await signIn(claims, first.cookie)).headers.get("location"), appUrl).pathname, "/success");
  const rejected = await signIn(claims, second.cookie);
  assert.notEqual(new URL(rejected.headers.get("location"), appUrl).pathname, "/success");
  assert.equal((await prisma.account.findFirstOrThrow({ where: { providerId, accountId: sub } })).userId, first.user.id);
  const noSessionSub = randomUUID();
  await signIn({ sub: noSessionSub, email: claims.email }, second.cookie, true);
  assert.equal(await prisma.account.count({ where: { providerId, accountId: noSessionSub } }), 0);
});

test("concurrent linking of one identity cannot assign it to two users", async () => {
  const first = await localSession();
  const second = await localSession();
  const sub = randomUUID();
  const claims = { sub, email: `${randomUUID()}@test.invalid` };
  await Promise.all([signIn(claims, first.cookie), signIn(claims, second.cookie)]);
  const accounts = await prisma.account.findMany({ where: { providerId, accountId: sub } });
  assert.equal(accounts.length, 1);
  assert.ok([first.user.id, second.user.id].includes(accounts[0].userId));
});

test("OIDC unlink requires the owner or an admin and a local password; native unlink is blocked", async () => {
  const owner = await localSession();
  const other = await localSession();
  const sub = randomUUID();
  const claims = { sub, email: `${randomUUID()}@test.invalid` };
  await signIn(claims, owner.cookie);
  const account = await prisma.account.findFirstOrThrow({ where: { providerId, accountId: sub } });
  await assert.rejects(unlinkOidcAccounts(owner.user.id, other.user.id, other.sessionId, false));
  const native = await auth.handler(new Request(new URL("/api/auth/unlink-account", appUrl), {
    method: "POST",
    headers: { "content-type": "application/json", origin: new URL(appUrl).origin, cookie: owner.cookie },
    body: JSON.stringify({ accountId: account.id }),
  }));
  assert.equal(native.status, 403);
  await unlinkOidcAccounts(owner.user.id, owner.user.id, owner.sessionId, false);
  assert.equal(await prisma.account.count({ where: { id: account.id } }), 0);
  const provisionedSub = randomUUID();
  const signedIn = await signIn({ sub: provisionedSub, email: `${randomUUID()}@test.invalid` });
  const provisioned = await prisma.account.findFirstOrThrow({ where: { providerId, accountId: provisionedSub } });
  const cookie = signedIn.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  const provisionedSession = await auth.api.getSession({ headers: new Headers({ cookie }) });
  assert.ok(provisionedSession);
  await assert.rejects(unlinkOidcAccounts(provisioned.userId, provisioned.userId, provisionedSession.session.id, false));
  await assert.rejects(unlinkOidcAccounts(provisioned.userId, other.user.id, other.sessionId, false));
  await assert.rejects(unlinkOidcAccounts(provisioned.userId, other.user.id, other.sessionId, true));
});

test("admin can unlink a user with a password but not one without it", async () => {
  const adminUser = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const origin = new URL(appUrl);
  const signedIn = await auth.handler(new Request(new URL("/api/auth/sign-in/email", origin), {
    method: "POST",
    headers: { "content-type": "application/json", origin: origin.origin },
    body: JSON.stringify({ email: adminUser.email, password: "Smoke-test-password-123" }),
  }));
  assert.equal(signedIn.status, 200);
  const cookie = signedIn.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  const admin = { userId: adminUser.id, sessionId: session.session.id };
  const owner = await localSession();
  const sub = randomUUID();
  await signIn({ sub, email: `${randomUUID()}@test.invalid` }, owner.cookie);
  await unlinkOidcAccounts(owner.user.id, admin.userId, admin.sessionId, true);
  assert.equal(await prisma.account.count({ where: { providerId, accountId: sub } }), 0);
  const provisioned = await prisma.account.findFirstOrThrow({
    where: { providerId, user: { accounts: { none: { providerId: "credential", password: { not: null } } } } },
  });
  await assert.rejects(unlinkOidcAccounts(provisioned.userId, admin.userId, admin.sessionId, true));
});

test("the same subject remains linked after changing the client ID", async () => {
  const sub = randomUUID();
  const email = `${randomUUID()}@test.invalid`;
  await signIn({ sub, email });
  const userId = (await prisma.account.findFirstOrThrow({ where: { providerId, accountId: sub } })).userId;
  const newClientId = "replacement-client";
  await prisma.appSettings.update({ where: { id: 1 }, data: { oidcClientId: newClientId } });
  tokenAudience = newClientId;
  try {
    const origin = new URL(appUrl);
    const start = await oidcGet(new Request(new URL("/api/auth/oidc/sign-in", origin)));
    assert.equal(start.status, 302);
    const authorizationUrl = new URL(start.headers.get("location"));
    assert.equal(authorizationUrl.searchParams.get("client_id"), newClientId);
    assert.equal(authorizationUrl.searchParams.get("redirect_uri"), new URL("/api/auth/callback/oidc", origin).toString());
    const stateCookie = start.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    const code = randomUUID();
    pendingTokens.set(code, { sub, email, nonce: authorizationUrl.searchParams.get("nonce") });
    const callback = new URL("/api/auth/callback/oidc", origin);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", authorizationUrl.searchParams.get("state"));
    const response = await oidcGet(new Request(callback, { headers: { cookie: stateCookie, origin: origin.origin } }));
    assert.equal(response.status, 302);
    const cookie = response.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    assert.equal(session?.user.id, userId);
  } finally {
    tokenAudience = clientId;
    await prisma.appSettings.update({ where: { id: 1 }, data: { oidcClientId: clientId } });
  }
});

test("OIDC callback stays fixed after settings changes", async () => {
  const adminUser = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const session = await prisma.session.findFirstOrThrow({ where: { userId: adminUser.id } });
  const config = { enabled: true, issuer: "https://idp.test.invalid/application/o/test/", clientId, clientSecret: "secret-one" };
  await saveOidcSettings(config, adminUser.id, session.id);
  const expectedUri = new URL("/api/auth/callback/oidc", appUrl).toString();
  assert.equal((await getOidcSettings(adminUser.id, session.id)).redirectUri, expectedUri);
  await saveOidcSettings({ ...config, clientSecret: "secret-two", enabled: false }, adminUser.id, session.id);
  const disabledCallback = await oidcGet(new Request(new URL("/api/auth/callback/oidc", appUrl)));
  assert.equal(disabledCallback.status, 401);
  await saveOidcSettings({ ...config, clientSecret: "", clientId: "different-client" }, adminUser.id, session.id);
  assert.equal((await getOidcSettings(adminUser.id, session.id)).redirectUri, expectedUri);
  assert.ok(await prisma.account.findFirst({ where: { providerId } }));
});

test("an unreadable OIDC secret is reported when reading or enabling settings", async () => {
  const adminUser = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
  const session = await prisma.session.findFirstOrThrow({ where: { userId: adminUser.id } });
  const previous = await prisma.appSettings.findUniqueOrThrow({ where: { id: 1 } });
  await prisma.appSettings.update({ where: { id: 1 }, data: { oidcClientSecret: "invalid" } });
  try {
    assert.equal((await getOidcSettings(adminUser.id, session.id)).clientSecretUnreadable, true);
    await assert.rejects(getOidcRuntimeConfig(), { code: "ENCRYPTION" });
    await assert.rejects(saveOidcSettings({
      enabled: true,
      issuer: previous.oidcIssuer,
      clientId: previous.oidcClientId,
    }, adminUser.id, session.id), { code: "ENCRYPTION" });
  } finally {
    await prisma.appSettings.update({ where: { id: 1 }, data: { oidcClientSecret: previous.oidcClientSecret } });
  }
});

test("migration preserves current linked accounts and leaves older identities untouched", async () => {
  const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
  databaseUrl.searchParams.delete("schema");
  const client = new pg.Client({ connectionString: databaseUrl.toString() });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TEMP TABLE "AppSettings" ("id" integer, "oidcRevision" text) ON COMMIT DROP;
      CREATE TEMP TABLE "account" ("id" text, "providerId" text, "accountId" text, "userId" text,
        UNIQUE ("providerId", "accountId")) ON COMMIT DROP;
      INSERT INTO "AppSettings" VALUES (1, 'current');
      INSERT INTO "account" VALUES
        ('active', 'oidc-current', 'subject', 'owner'),
        ('old', 'oidc-old', 'old-subject', 'old-owner'),
        ('local', 'credential', 'owner', 'owner');`);
    const migration = await readFile(new URL("../prisma/migrations/20261105000000_static_oidc_provider/migration.sql", import.meta.url), "utf8");
    await client.query(migration);
    const { rows } = await client.query(`SELECT "id", "providerId", "userId" FROM "account" ORDER BY "id"`);
    assert.deepEqual(rows, [
      { id: "active", providerId: "oidc", userId: "owner" },
      { id: "local", providerId: "credential", userId: "owner" },
      { id: "old", providerId: "oidc-old", userId: "old-owner" },
    ]);
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
});
