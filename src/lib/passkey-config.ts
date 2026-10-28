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

  if (!rpIdValue || !originValue) {
    throw new Error("W produkcji wymagane są PASSKEY_RP_ID i PASSKEY_ORIGIN.");
  }
  const origin = parseOrigin("PASSKEY_ORIGIN", originValue);
  if (origin.protocol !== "https:") {
    throw new Error("PASSKEY_ORIGIN musi używać HTTPS.");
  }
  const rpID = rpIdValue.toLowerCase();
  const validRpId =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/.test(
      rpID,
    );
  if (!validRpId || rpID === "localhost" || isIP(rpID)) {
    throw new Error("PASSKEY_RP_ID musi być nazwą domeny bez schematu i portu.");
  }
  if (origin.hostname !== rpID && !origin.hostname.endsWith(`.${rpID}`)) {
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
