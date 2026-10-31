import type { GenericOAuthConfig, GenericOAuthUserInfo } from "better-auth/plugins/generic-oauth";
import type { OidcRuntimeConfig } from "@/server/settings/oidc";

const OIDC_PROVIDER_PREFIX = "oidc-";

export function createOidcProviderConfig(
  runtime: OidcRuntimeConfig,
): GenericOAuthConfig {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(runtime.revision)) {
    throw new Error("The OIDC configuration revision is invalid.");
  }
  if (!runtime.enabled || !runtime.issuer || !runtime.clientId || !runtime.clientSecret) {
    throw new Error("The OIDC runtime configuration is incomplete.");
  }

  const providerId = `${OIDC_PROVIDER_PREFIX}${runtime.revision}`;
  const issuerBase = runtime.issuer.endsWith("/") ? runtime.issuer : `${runtime.issuer}/`;
  const discoveryUrl = new URL(".well-known/openid-configuration", issuerBase).toString();

  return {
    providerId,
    name: "OpenID Connect",
    discoveryUrl,
    requireIdTokenVerification: true,
    clientId: runtime.clientId,
    clientSecret: runtime.clientSecret,
    scopes: ["openid", "email", "profile"],
    pkce: true,
    userInfoUrl: "",
    disableImplicitSignUp: false,
    disableSignUp: false,
    disableProviderLogout: true,
    requireEmailVerification: true,
    accountSubject: ({ tokens, profile }) => {
      if (
        !tokens.idToken ||
        typeof profile.sub !== "string" ||
        !profile.sub.trim() ||
        profile.iss !== runtime.issuer ||
        typeof profile.email !== "string" ||
        !profile.email.trim() ||
        profile.email_verified !== true
      ) {
        throw new Error("The ID token does not contain a verified OIDC identity.");
      }
      return profile.sub;
    },
    mapProfileToUser: (profile: GenericOAuthUserInfo) => ({
      name:
        typeof profile.name === "string" && profile.name.trim()
          ? profile.name
          : typeof profile.email === "string"
            ? profile.email
            : "",
      emailVerified: profile.email_verified === true,
    }),
  };
}
