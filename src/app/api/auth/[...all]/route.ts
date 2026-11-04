import { toNextJsHandler } from "better-auth/next-js";
import { isAPIError } from "better-auth/api";
import { auth, createOidcAuth } from "@/lib/auth";
import { localReturnPath } from "@/lib/local-return-path";
import { getOidcRuntimeConfig } from "@/server/settings/oidc";
import { OIDC_PROVIDER_ID } from "@/lib/oidc-provider-config";

const standardHandler = toNextJsHandler(auth);
const AUTH_PREFIX = "/api/auth";
const OIDC_SIGN_IN_PATH = `${AUTH_PREFIX}/oidc/sign-in`;
const OIDC_LINK_PATH = `${AUTH_PREFIX}/oidc/link`;

function failClosed(status = 401) {
  return new Response("OIDC authentication could not be completed.", {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function handleOidcRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const isSignIn = url.pathname === OIDC_SIGN_IN_PATH;
  const isLink = url.pathname === OIDC_LINK_PATH;
  const isCallback = url.pathname === `${AUTH_PREFIX}/callback/${OIDC_PROVIDER_ID}`;
  if (!isSignIn && !isLink && !isCallback) return null;

  const allowedMethod = isSignIn ? "GET" : isLink ? "POST" : null;
  if (allowedMethod && request.method !== allowedMethod) {
    return new Response(null, {
      status: 405,
      headers: { Allow: allowedMethod, "cache-control": "no-store" },
    });
  }
  if (isLink) {
    const origin = request.headers.get("origin");
    const baseUrl = process.env.BETTER_AUTH_URL;
    if (!baseUrl || !origin || origin !== new URL(baseUrl).origin) return failClosed(403);
  }

  try {
    const runtime = await getOidcRuntimeConfig();
    if (!runtime.enabled) return failClosed(isCallback ? 401 : 404);
    const oidcAuth = createOidcAuth(runtime);
    if (isCallback) {
      const handler = toNextJsHandler(oidcAuth);
      return request.method === "POST"
        ? await handler.POST(request)
        : await handler.GET(request);
    }

    const body = {
      provider: OIDC_PROVIDER_ID,
      callbackURL: isLink ? "/settings?tab=security&oidc=connected" : localReturnPath(url.searchParams.get("next")),
      errorCallbackURL: isLink ? "/settings?tab=security" : "/login",
      disableRedirect: true,
    };
    const options = { body, headers: request.headers, returnHeaders: true as const };
    const result = isLink
      ? await oidcAuth.api.linkSocialAccount(options)
      : await oidcAuth.api.signInSocial(options);
    if (!result.response.url) return failClosed(502);
    const responseHeaders = new Headers(result.headers);
    responseHeaders.set("location", result.response.url);
    responseHeaders.set("cache-control", "no-store");
    return new Response(null, { status: 302, headers: responseHeaders });
  } catch (error) {
    if (isLink) {
      console.error("Could not start OIDC account linking:", error);
      return failClosed(isAPIError(error) ? error.statusCode : 503);
    }
    return failClosed(503);
  }
}

export async function GET(request: Request) {
  return (await handleOidcRequest(request)) ?? standardHandler.GET(request);
}

export async function POST(request: Request) {
  return (await handleOidcRequest(request)) ?? standardHandler.POST(request);
}
