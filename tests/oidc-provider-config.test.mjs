import assert from "node:assert/strict";
import { test } from "node:test";
import { createOidcProviderConfig } from "../src/lib/oidc-provider-config.ts";

const runtime = {
  enabled: true,
  issuer: "https://issuer.example.test/tenant/",
  clientId: "inventory",
  clientSecret: "private",
  revision: "5d4bd241-9cbb-4a81-8870-47e35e142fc9",
};

test("OIDC provider config requires verified ID tokens and scopes provider IDs by revision", () => {
  const provider = createOidcProviderConfig(runtime);

  assert.equal(provider.providerId, `oidc-${runtime.revision}`);
  assert.equal(
    provider.discoveryUrl,
    "https://issuer.example.test/tenant/.well-known/openid-configuration",
  );
  assert.equal(provider.requireIdTokenVerification, true);
  assert.equal(provider.pkce, true);
  assert.deepEqual(provider.scopes, ["openid", "email", "profile"]);
  assert.equal(provider.userInfoUrl, "");
  assert.equal(provider.disableSignUp, false);

  const revised = createOidcProviderConfig({
    ...runtime,
    revision: "b5a28a51-4e80-4bb2-b107-aeefda802855",
  });
  assert.notEqual(revised.providerId, provider.providerId);
});

test("OIDC account subject only accepts verified issuer-bound ID-token identities", () => {
  const provider = createOidcProviderConfig(runtime);
  const profile = {
    sub: "stable-idp-subject",
    iss: runtime.issuer,
    email: "person@example.test",
    email_verified: true,
    name: "Person",
  };

  assert.equal(
    provider.accountSubject({ tokens: { idToken: "verified-token" }, profile }),
    profile.sub,
  );
  for (const invalid of [
    { tokens: {}, profile },
    { tokens: { idToken: "verified-token" }, profile: { ...profile, iss: "https://other.example.test" } },
    { tokens: { idToken: "verified-token" }, profile: { ...profile, email_verified: false } },
    { tokens: { idToken: "verified-token" }, profile: { ...profile, sub: "" } },
    { tokens: { idToken: "verified-token" }, profile: { ...profile, email: "" } },
  ]) {
    assert.throws(() => provider.accountSubject(invalid));
  }

  assert.deepEqual(provider.mapProfileToUser(profile), {
    name: "Person",
    emailVerified: true,
  });
});

test("OIDC provider refuses incomplete runtime settings and unsafe revisions", () => {
  assert.throws(
    () => createOidcProviderConfig({ ...runtime, enabled: false }),
    /incomplete/,
  );
  assert.throws(
    () => createOidcProviderConfig({ ...runtime, revision: "not-a-revision" }),
    /revision/,
  );
});
