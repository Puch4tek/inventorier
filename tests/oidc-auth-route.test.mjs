import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import pg from "pg";
import { splitSetCookieHeader } from "better-auth/cookies";
import bcrypt from "bcryptjs";

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("TEST_DATABASE_URL is required.");
const url = new URL(testUrl);
if (
  !["127.0.0.1", "localhost", "::1"].includes(url.hostname) ||
  !/^inventory_contract_test_[a-z0-9_]+$/.test(url.pathname.slice(1))
) {
  throw new Error("Tests require a loopback connection to a uniquely named test database.");
}

const adminUrl = new URL(testUrl);
adminUrl.pathname = "/postgres";
const databaseName = `${url.pathname.slice(1)}_oidc_auth_${randomUUID().replaceAll("-", "")}`;
const databaseUrl = new URL(testUrl);
databaseUrl.pathname = `/${databaseName}`;
const admin = new pg.Client({ connectionString: adminUrl.toString() });
const database = new pg.Client({ connectionString: databaseUrl.toString() });
const clientId = "oidc-auth-route-test";
const clientSecret = "oidc-auth-route-secret";
const subject = "stable-oidc-subject";
const keyId = randomUUID();
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: keyId, alg: "RS256", use: "sig" };
let issuer;
let authorizationRequest;
let prisma;
let settings;
let route;
let server;
const identitiesByCode = new Map([
  ["oidc-auth-code", { email: "oidc-user@example.test", subject }],
  ["oidc-disabled-code", { email: "oidc-user@example.test", subject }],
  ["oidc-link-code", { email: "local-user@example.test", subject: "linked-oidc-subject" }],
]);

async function applyMigration(file) {
  await database.query(await readFile(file, "utf8"));
}

before(async () => {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  await database.connect();
  await applyMigration("prisma/migrations/20261027115504_apply_the_schema/migration.sql");
  await applyMigration("prisma/migrations/20261028180000_email_settings/migration.sql");
  await applyMigration("prisma/migrations/20261028210000_remove_user_password_hash/migration.sql");
  await applyMigration("prisma/migrations/20261030190000_oidc_settings/migration.sql");
  await applyMigration("prisma/migrations/20261030192000_oidc_settings_revision/migration.sql");
  await database.query(
    `INSERT INTO "AppSettings" ("id", "registrationEnabled") VALUES (1, false)`,
  );

  process.env.DATABASE_URL = databaseUrl.toString();
  process.env.TEST_DATABASE_URL = databaseUrl.toString();
  process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("base64url");
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  process.env.PASSKEY_RP_ID = "localhost";
  process.env.PASSKEY_ORIGIN = "http://localhost:3000";

  ({ prisma } = await import("../src/lib/db/prisma.ts"));
  settings = await import("../src/server/settings/oidc.ts");
  const { encryptSecret } = await import("../src/server/security/secret-encryption.ts");

  server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url, issuer);
    if (requestUrl.pathname === "/issuer/.well-known/openid-configuration") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        jwks_uri: `${issuer}/jwks`,
        id_token_signing_alg_values_supported: ["RS256"],
      }));
      return;
    }
    if (requestUrl.pathname === "/issuer/jwks") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    if (requestUrl.pathname === "/issuer/authorize") {
      authorizationRequest = requestUrl;
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("authorization endpoint");
      return;
    }
    if (requestUrl.pathname === "/issuer/token" && request.method === "POST") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const form = new URLSearchParams(Buffer.concat(chunks).toString());
      const verifier = form.get("code_verifier") ?? "";
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const identity = identitiesByCode.get(form.get("code"));
      if (
        !identity ||
        form.get("client_id") !== clientId ||
        form.get("client_secret") !== clientSecret ||
        challenge !== authorizationRequest?.searchParams.get("code_challenge")
      ) {
        response.writeHead(400, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "invalid_grant" }));
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const idToken = await new SignJWT({
        email: identity.email,
        email_verified: true,
        name: identity.email === "local-user@example.test" ? "Linked User" : "OIDC User",
        nonce: authorizationRequest.searchParams.get("nonce"),
      })
        .setProtectedHeader({ alg: "RS256", kid: keyId })
        .setIssuer(issuer)
        .setSubject(identity.subject)
        .setAudience(clientId)
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .sign(privateKey);
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        access_token: `access-${form.get("code")}`,
        token_type: "Bearer",
        expires_in: 300,
        id_token: idToken,
      }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  issuer = `http://127.0.0.1:${port}/issuer`;

  const revision = randomUUID();
  await database.query(
    `UPDATE "AppSettings"
     SET "oidcEnabled" = true, "oidcIssuer" = $1, "oidcClientId" = $2,
         "oidcClientSecret" = $3, "oidcRevision" = $4
     WHERE "id" = 1`,
    [issuer, clientId, encryptSecret(clientSecret), revision],
  );
  route = await import("../src/app/api/auth/[...all]/route.ts");
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await prisma?.$disconnect();
  await database.end();
  await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
  await admin.end();
});

test("OIDC start preserves the signed state cookie and callback completes PKCE login", async () => {
  const start = await route.GET(new Request(
    "http://localhost:3000/api/auth/oidc/sign-in?next=%2Fdashboard",
    { headers: { host: "localhost:3000" } },
  ));
  assert.equal(start.status, 302);
  authorizationRequest = new URL(start.headers.get("location"));

  const setCookies = splitSetCookieHeader(start.headers.get("set-cookie") ?? "");
  const stateCookie = setCookies.find((value) =>
    value.slice(0, value.indexOf("=")).toLowerCase().includes("state"),
  );
  assert.ok(stateCookie, "start response must preserve Better Auth's state cookie");
  assert.ok(authorizationRequest.searchParams.get("state"));
  assert.ok(authorizationRequest.searchParams.get("nonce"));
  assert.equal(
    authorizationRequest.searchParams.get("code_challenge_method"),
    "S256",
  );
  assert.ok(authorizationRequest.searchParams.get("code_challenge"));
  assert.equal(authorizationRequest.searchParams.get("client_id"), clientId);

  const cookiePair = stateCookie.split(";")[0];
  const callback = new URL(
    authorizationRequest.searchParams.get("redirect_uri"),
  );
  callback.searchParams.set("code", "oidc-auth-code");
  callback.searchParams.set("state", authorizationRequest.searchParams.get("state"));
  const completed = await route.GET(new Request(callback, {
    headers: {
      cookie: cookiePair,
      host: "localhost:3000",
    },
  }));
  assert.equal(completed.status, 302);
  assert.equal(
    new URL(completed.headers.get("location"), "http://localhost:3000").pathname,
    "/dashboard",
    completed.headers.get("location") ?? "Missing callback redirect.",
  );
  assert.ok(completed.headers.get("set-cookie"));

  const user = await prisma.user.findUnique({
    where: { email: "oidc-user@example.test" },
    select: { id: true, role: true, emailVerified: true },
  });
  assert.ok(user);
  assert.equal(user.role, "USER");
  assert.equal(user.emailVerified, true);
  assert.ok(await prisma.session.findFirst({ where: { userId: user.id } }));
  const account = await prisma.account.findFirst({
    where: { providerId: `oidc-${(await settings.getOidcRuntimeConfig()).revision}` },
  });
  assert.ok(account);
  assert.equal(account.accountId, subject);
  assert.equal(account.idToken, null);
  assert.ok(account.accessToken);
  assert.notEqual(account.accessToken, "access-oidc-auth-code");
  assert.ok(!account.accessToken.includes("access-oidc-auth-code"));
});

test("OIDC registration works while local registration is disabled, without replacing local auth", async () => {
  const { auth } = await import("../src/lib/auth.ts");
  const signUp = await route.POST(new Request("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Blocked local signup",
      email: "blocked-local@example.test",
      password: "A-long-local-password1!",
    }),
  }));
  assert.equal(signUp.status, 403);
  assert.equal(
    await prisma.user.findUnique({ where: { email: "blocked-local@example.test" } }),
    null,
  );

  const localUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: "Local User",
      email: "local-user@example.test",
      emailVerified: true,
    },
  });
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: localUser.id,
      providerId: "credential",
      userId: localUser.id,
      password: await bcrypt.hash("Local-password1!", 12),
    },
  });

  const start = await route.GET(new Request(
    "http://localhost:3000/api/auth/oidc/sign-in?next=%2Fsettings",
    { headers: { host: "localhost:3000" } },
  ));
  const authUrl = new URL(start.headers.get("location"));
  authorizationRequest = authUrl;
  const stateCookie = splitSetCookieHeader(start.headers.get("set-cookie") ?? "").find((value) =>
    value.slice(0, value.indexOf("=")).toLowerCase().includes("state"),
  );
  assert.ok(stateCookie);
  const callback = new URL(authUrl.searchParams.get("redirect_uri"));
  callback.searchParams.set("code", "oidc-link-code");
  callback.searchParams.set("state", authUrl.searchParams.get("state"));
  const linked = await route.GET(new Request(callback, {
    headers: {
      cookie: stateCookie.split(";")[0],
      host: "localhost:3000",
    },
  }));
  assert.equal(linked.status, 302);
  assert.equal(
    new URL(linked.headers.get("location"), "http://localhost:3000").pathname,
    "/settings",
  );

  const linkedUser = await prisma.user.findUnique({
    where: { email: "local-user@example.test" },
    include: { accounts: true },
  });
  assert.equal(linkedUser.id, localUser.id);
  assert.ok(linkedUser.accounts.some((account) => account.providerId === "credential" && account.password));
  assert.ok(linkedUser.accounts.some((account) => account.accountId === "linked-oidc-subject"));

  const signIn = await auth.api.signInEmail({
    body: { email: "local-user@example.test", password: "Local-password1!" },
  });
  assert.equal(signIn.user.id, localUser.id);
});

test("OIDC callback rejects an outdated runtime revision", async () => {
  const start = await route.GET(new Request(
    "http://localhost:3000/api/auth/oidc/sign-in",
    { headers: { host: "localhost:3000" } },
  ));
  const authUrl = new URL(start.headers.get("location"));
  const stateCookie = splitSetCookieHeader(start.headers.get("set-cookie") ?? "").find((value) =>
    value.slice(0, value.indexOf("=")).toLowerCase().includes("state"),
  );
  assert.ok(stateCookie);
  const callback = new URL(authUrl.searchParams.get("redirect_uri"));
  callback.searchParams.set("code", "oidc-auth-code");
  callback.searchParams.set("state", authUrl.searchParams.get("state"));

  const current = await settings.getOidcRuntimeConfig();
  const newerRevision = randomUUID();
  await database.query(`UPDATE "AppSettings" SET "oidcRevision" = $1 WHERE id = 1`, [newerRevision]);
  try {
    const stale = await route.GET(new Request(callback, {
      headers: {
        cookie: stateCookie.split(";")[0],
        host: "localhost:3000",
      },
    }));
    assert.equal(stale.status, 401);
  } finally {
    await database.query(`UPDATE "AppSettings" SET "oidcRevision" = $1 WHERE id = 1`, [current.revision]);
  }
});

test("disabled OIDC accounts cannot receive a new session", async () => {
  const user = await prisma.user.findUnique({ where: { email: "oidc-user@example.test" } });
  assert.ok(user);
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
  const start = await route.GET(new Request(
    "http://localhost:3000/api/auth/oidc/sign-in?next=%2Fdisabled-target",
    { headers: { host: "localhost:3000" } },
  ));
  const authUrl = new URL(start.headers.get("location"));
  authorizationRequest = authUrl;
  const stateCookie = splitSetCookieHeader(start.headers.get("set-cookie") ?? "").find((value) =>
    value.slice(0, value.indexOf("=")).toLowerCase().includes("state"),
  );
  assert.ok(stateCookie);
  const callback = new URL(authUrl.searchParams.get("redirect_uri"));
  callback.searchParams.set("code", "oidc-disabled-code");
  callback.searchParams.set("state", authUrl.searchParams.get("state"));
  const completed = await route.GET(new Request(callback, {
    headers: {
      cookie: stateCookie.split(";")[0],
      host: "localhost:3000",
    },
  }));
  assert.notEqual(
    new URL(completed.headers.get("location"), "http://localhost:3000").pathname,
    "/disabled-target",
  );
  assert.equal(
    await prisma.session.count({ where: { userId: user.id } }),
    1,
  );
});
