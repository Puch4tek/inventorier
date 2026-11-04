import type { GenericOAuthConfig, GenericOAuthUserInfo } from "better-auth/plugins/generic-oauth";
import type { OidcRuntimeConfig } from "@/server/settings/oidc";

export const OIDC_PROVIDER_ID = "oidc";

export function createOidcProviderConfig(
  runtime: OidcRuntimeConfig,
): GenericOAuthConfig {
  if (!runtime.enabled || !runtime.issuer || !runtime.clientId || !runtime.clientSecret) {
    throw new Error("The OIDC runtime configuration is incomplete.");
  }

  const issuerBase = runtime.issuer.endsWith("/") ? runtime.issuer : `${runtime.issuer}/`;
  const discoveryUrl = new URL(".well-known/openid-configuration", issuerBase).toString();

  return {
    providerId: OIDC_PROVIDER_ID,
    name: "OpenID Connect",
    discoveryUrl,
    requireIdTokenVerification: true,
    clientId: runtime.clientId,
    clientSecret: runtime.clientSecret,
    scopes: ["openid", "email", "profile"],
    pkce: true,
    userInfoUrl: "",
    disableProviderLogout: true,
    accountSubject: ({ tokens, profile }) => {
      if (
        !tokens.idToken ||
        typeof profile.sub !== "string" ||
        !profile.sub.trim() ||
        profile.iss !== runtime.issuer ||
        typeof profile.email !== "string" ||
        !profile.email.trim()
      ) {
        throw new Error("The ID token does not contain a valid OIDC identity.");
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
