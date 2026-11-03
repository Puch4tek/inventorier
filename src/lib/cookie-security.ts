import { isIP } from "node:net";

export function shouldUseSecureCookies(env: NodeJS.ProcessEnv = process.env): boolean {
  if (!env.BETTER_AUTH_URL) return env.NODE_ENV === "production";
  const origin = new URL(env.BETTER_AUTH_URL);
  if (origin.protocol === "https:") return true;
  if (env.NODE_ENV !== "production") return false;
  const hostname = origin.hostname.replace(/^\[|\]$/g, "");
  return !(origin.protocol === "http:" && (hostname === "localhost" || isIP(hostname) !== 0));
}
