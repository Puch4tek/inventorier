import { toNextJsHandler } from "better-auth/next-js";
import { auth, createOidcAuth } from "@/lib/auth";
import { localReturnPath } from "@/lib/local-return-path";
import { getOidcRuntimeConfig } from "@/server/settings/oidc";

const standardHandler = toNextJsHandler(auth);
const AUTH_PREFIX = "/api/auth";
const OIDC_SIGN_IN_PATH = `${AUTH_PREFIX}/oidc/sign-in`;

function isOidcCallbackPath(pathname: string) {
  return pathname.startsWith(`${AUTH_PREFIX}/callback/oidc-`);
}

function failClosed(status = 401) {
  return new Response("OIDC authentication could not be completed.", {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function handleOidcRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url);

  if (url.pathname === OIDC_SIGN_IN_PATH) {
    if (request.method !== "GET") {
      return new Response(null, {
        status: 405,
        headers: { Allow: "GET", "cache-control": "no-store" },
      });
    }

    try {
      const runtime = await getOidcRuntimeConfig();
      if (!runtime.enabled) return failClosed(404);
      const result = await createOidcAuth(runtime).api.signInSocial({
        body: {
          provider: `oidc-${runtime.revision}`,
          callbackURL: localReturnPath(url.searchParams.get("next")),
          disableRedirect: true,
        },
        headers: request.headers,
        returnHeaders: true,
      });
      if (!result.response.url) return failClosed(502);
      const responseHeaders = new Headers(result.headers);
      responseHeaders.set("location", result.response.url);
      responseHeaders.set("cache-control", "no-store");
      return new Response(null, {
        status: 302,
        headers: responseHeaders,
      });
    } catch {
      return failClosed(503);
    }
  }

  if (!isOidcCallbackPath(url.pathname)) return null;

  try {
    const runtime = await getOidcRuntimeConfig();
    const callbackProviderId = url.pathname.slice(
      `${AUTH_PREFIX}/callback/`.length,
    );
    if (
      !runtime.enabled ||
      callbackProviderId !== `oidc-${runtime.revision}`
    ) {
      return failClosed();
    }

    const dynamicHandler = toNextJsHandler(createOidcAuth(runtime));
    return request.method === "POST"
      ? await dynamicHandler.POST(request)
      : await dynamicHandler.GET(request);
  } catch {
    return failClosed(503);
  }
}

export async function GET(request: Request) {
  return (await handleOidcRequest(request)) ?? standardHandler.GET(request);
}

export async function POST(request: Request) {
  return (await handleOidcRequest(request)) ?? standardHandler.POST(request);
}
