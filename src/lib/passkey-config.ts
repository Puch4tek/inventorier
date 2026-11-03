import { isIP } from "node:net";

const DEV_ORIGIN = "http://localhost:3000";
const DEV_RP_ID = "localhost";

function isBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function parseOrigin(name: string, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} musi być poprawnym adresem URL.`);
  }
  if (url.origin !== value.replace(/\/$/, "")) {
    throw new Error(`${name} musi zawierać wyłącznie origin (schemat, host i opcjonalny port).`);
  }
  return url;
}

export function getPasskeyConfig(env: NodeJS.ProcessEnv = process.env) {
  const rpName = "Inventorier";
  const production = env.NODE_ENV === "production";
  const rpIdValue = env.PASSKEY_RP_ID?.trim();
  const originValue = env.PASSKEY_ORIGIN?.trim();

  if (!production) {
    return {
      rpID: rpIdValue || DEV_RP_ID,
      rpName,
      origin: originValue || DEV_ORIGIN,
    };
  }

  if (isBuildPhase() && (!rpIdValue || !originValue)) {
    return { rpID: rpIdValue || DEV_RP_ID, rpName, origin: originValue || DEV_ORIGIN };
  }

  const resolvedOrigin = originValue || env.BETTER_AUTH_URL?.trim();
  if (!resolvedOrigin) {
    throw new Error("W produkcji wymagany jest BETTER_AUTH_URL.");
  }
  const origin = parseOrigin(
    originValue ? "PASSKEY_ORIGIN" : "BETTER_AUTH_URL",
    resolvedOrigin,
  );
  if (origin.protocol !== "https:" && origin.protocol !== "http:") {
    throw new Error("PASSKEY_ORIGIN musi używać HTTP lub HTTPS.");
  }
  const hostname = origin.hostname.replace(/^\[|\]$/g, "");
  const rpID = (rpIdValue || hostname).toLowerCase();
  const validRpId =
    isIP(rpID) !== 0 ||
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(
      rpID,
    );
  if (!validRpId) {
    throw new Error("PASSKEY_RP_ID musi być nazwą domeny lub adresem IP bez schematu i portu.");
  }
  if (
    hostname !== rpID &&
    (isIP(hostname) !== 0 || isIP(rpID) !== 0 || !hostname.endsWith(`.${rpID}`))
  ) {
    throw new Error("PASSKEY_RP_ID musi być hostem PASSKEY_ORIGIN lub jego nadrzędną domeną.");
  }

  let betterAuthOrigin: string;
  try {
    betterAuthOrigin = new URL(env.BETTER_AUTH_URL ?? "").origin;
  } catch {
    throw new Error("W produkcji BETTER_AUTH_URL musi być poprawnym adresem URL.");
  }
  if (betterAuthOrigin !== origin.origin) {
    throw new Error("BETTER_AUTH_URL musi mieć ten sam origin co PASSKEY_ORIGIN.");
  }
  return { rpID, rpName, origin: origin.origin };
}
