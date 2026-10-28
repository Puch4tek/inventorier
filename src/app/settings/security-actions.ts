"use server";

import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getActiveSession } from "@/server/auth/get-current-user";

export type SecurityActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type TotpSetup = { totpURI: string; backupCodes: string[] };

const PASSKEY_REAUTH_COOKIE = "inventory-passkey-reauth";
const PASSKEY_REAUTH_COOKIE_PATH = "/api/auth/passkey";
const PASSKEY_REAUTH_IDENTIFIER_PREFIX = "passkey-reauth:";
const PASSKEY_REAUTH_TTL_MS = 5 * 60 * 1000;

class PublicSecurityError extends Error {}

function failure<T>(error: string): SecurityActionResult<T> {
  return { success: false, error };
}

function publicErrorMessage(error: unknown, fallback: string) {
  return error instanceof PublicSecurityError ? error.message : fallback;
}

function getApiErrorCode(body: unknown) {
  if (!body || typeof body !== "object" || !("code" in body)) return null;
  return typeof body.code === "string" ? body.code : null;
}

function messageForApiError(body: unknown, fallback: string) {
  switch (getApiErrorCode(body)) {
    case "INVALID_PASSWORD":
      return "Nieprawidłowe obecne hasło.";
    case "INVALID_CODE":
      return "Kod jest nieprawidłowy lub wygasł.";
    case "TOTP_ALREADY_ENABLED":
      return "Uwierzytelnianie TOTP jest już aktywne.";
    case "TWO_FACTOR_NOT_ENABLED":
      return "Uwierzytelnianie dwuskładnikowe nie jest aktywne.";
    case "INVALID_SESSION":
    case "UNAUTHORIZED":
      return "Sesja wygasła. Zaloguj się ponownie i spróbuj jeszcze raz.";
    default:
      return fallback;
  }
}

async function reauthenticate(password: unknown) {
  if (
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 1024
  ) {
    throw new PublicSecurityError("Podaj obecne hasło.");
  }

  const active = await getActiveSession();
  if (!active || active.user.mustChangePassword) {
    throw new PublicSecurityError("Sesja wygasła. Zaloguj się ponownie.");
  }

  const account = await prisma.account.findFirst({
    where: { userId: active.user.id, providerId: "credential" },
    select: { password: true },
  });

  if (!account?.password || !(await bcrypt.compare(password, account.password))) {
    throw new PublicSecurityError("Nieprawidłowe obecne hasło.");
  }

  return {
    userId: active.user.id,
    sessionId: active.session.id,
    password,
  };
}

async function copyResponseCookies(response: Response) {
  const responseHeaders = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    responseHeaders.getSetCookie?.() ??
    (response.headers.get("set-cookie")
      ? [response.headers.get("set-cookie") as string]
      : []);
  const cookieStore = await cookies();

  for (const setCookie of setCookies) {
    const [cookie, ...attributes] = setCookie.split(";");
    const separator = cookie.indexOf("=");
    if (separator <= 0) continue;

    const name = cookie.slice(0, separator).trim();
    const value = cookie.slice(separator + 1).trim();
    const options: {
      domain?: string;
      expires?: Date;
      httpOnly?: boolean;
      maxAge?: number;
      path?: string;
      sameSite?: "lax" | "none" | "strict";
      secure?: boolean;
    } = {};

    for (const attribute of attributes) {
      const [rawName, ...rawValue] = attribute.trim().split("=");
      const key = rawName.toLowerCase();
      const attributeValue = rawValue.join("=").trim();
      if (key === "domain") options.domain = attributeValue;
      if (key === "path") options.path = attributeValue;
      if (key === "expires") {
        const expires = new Date(attributeValue);
        if (!Number.isNaN(expires.getTime())) options.expires = expires;
      }
      if (key === "max-age") {
        const maxAge = Number(attributeValue);
        if (Number.isFinite(maxAge)) options.maxAge = maxAge;
      }
      if (key === "httponly") options.httpOnly = true;
      if (key === "secure") options.secure = true;
      if (key === "samesite" && ["lax", "none", "strict"].includes(attributeValue.toLowerCase())) {
        options.sameSite = attributeValue.toLowerCase() as
          | "lax"
          | "none"
          | "strict";
      }
    }

    cookieStore.set(name, value, options);
  }
}

async function apiErrorMessage(response: Response, fallback: string) {
  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    return fallback;
  }
  return messageForApiError(body, fallback);
}

export async function beginTotpSetup(
  password: unknown,
): Promise<SecurityActionResult<TotpSetup>> {
  try {
    const verified = await reauthenticate(password);
    const result = await auth.api.enableTwoFactor({
      headers: await headers(),
      body: { method: "totp", issuer: "Inventorier", password: verified.password },
    });

    if (
      result.method !== "totp" ||
      !result.totpURI ||
      !Array.isArray(result.backupCodes)
    ) {
      return failure("Nie udało się rozpocząć konfiguracji TOTP.");
    }

    return {
      success: true,
      data: { totpURI: result.totpURI, backupCodes: result.backupCodes },
    };
  } catch (error) {
    return failure(publicErrorMessage(error, "Nie udało się rozpocząć konfiguracji TOTP."));
  }
}

export async function confirmTotpSetup(input: {
  password: unknown;
  code: unknown;
}): Promise<SecurityActionResult<null>> {
  try {
    await reauthenticate(input?.password);
    if (typeof input?.code !== "string" || !/^\d{6,8}$/.test(input.code)) {
      return failure("Wpisz aktualny kod z aplikacji uwierzytelniającej.");
    }

    const response = await auth.api.verifyTOTP({
      headers: await headers(),
      body: { code: input.code },
      asResponse: true,
    });
    if (!response.ok) {
      return failure(
        await apiErrorMessage(response, "Nie udało się potwierdzić kodu TOTP."),
      );
    }

    await copyResponseCookies(response);
    return { success: true, data: null };
  } catch (error) {
    return failure(publicErrorMessage(error, "Nie udało się potwierdzić kodu TOTP."));
  }
}

export async function cancelPendingTotpSetup(
  password: unknown,
): Promise<SecurityActionResult<null>> {
  try {
    const verified = await reauthenticate(password);
    const response = await auth.api.disableTwoFactor({
      headers: await headers(),
      body: { password: verified.password },
      asResponse: true,
    });
    if (!response.ok) {
      return failure(
        await apiErrorMessage(response, "Nie udało się anulować konfiguracji TOTP."),
      );
    }

    await copyResponseCookies(response);
    return { success: true, data: null };
  } catch (error) {
    return failure(publicErrorMessage(error, "Nie udało się anulować konfiguracji TOTP."));
  }
}

export async function regenerateBackupCodes(
  password: unknown,
): Promise<SecurityActionResult<{ backupCodes: string[] }>> {
  try {
    const verified = await reauthenticate(password);
    const result = await auth.api.generateBackupCodes({
      headers: await headers(),
      body: { password: verified.password },
    });
    return { success: true, data: { backupCodes: result.backupCodes } };
  } catch (error) {
    return failure(
      publicErrorMessage(error, "Nie udało się wygenerować nowych kodów zapasowych."),
    );
  }
}

export async function disableTotp(
  password: unknown,
): Promise<SecurityActionResult<null>> {
  try {
    const verified = await reauthenticate(password);
    await prisma.verification.deleteMany({
      where: {
        value: verified.userId,
        identifier: { startsWith: "trust-device-" },
      },
    });
    const response = await auth.api.disableTwoFactor({
      headers: await headers(),
      body: { password: verified.password },
      asResponse: true,
    });
    if (!response.ok) {
      return failure(
        await apiErrorMessage(response, "Nie udało się wyłączyć TOTP."),
      );
    }

    await copyResponseCookies(response);
    return { success: true, data: null };
  } catch (error) {
    return failure(publicErrorMessage(error, "Nie udało się wyłączyć TOTP."));
  }
}

export async function authorizePasskeyManagement(
  password: unknown,
): Promise<SecurityActionResult<null>> {
  try {
    const active = await reauthenticate(password);
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const identifier = `${PASSKEY_REAUTH_IDENTIFIER_PREFIX}${tokenHash}`;
    const value = JSON.stringify({
      userId: active.userId,
      sessionId: active.sessionId,
    });
    const now = new Date();

    await prisma.verification.deleteMany({
      where: {
        identifier: { startsWith: PASSKEY_REAUTH_IDENTIFIER_PREFIX },
        OR: [
          { value },
          { expiresAt: { lte: now } },
        ],
      },
    });
    await prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier,
        value,
        expiresAt: new Date(now.getTime() + PASSKEY_REAUTH_TTL_MS),
      },
    });

    (await cookies()).set(PASSKEY_REAUTH_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: PASSKEY_REAUTH_COOKIE_PATH,
      maxAge: PASSKEY_REAUTH_TTL_MS / 1000,
    });
    return { success: true, data: null };
  } catch (error) {
    return failure(
      publicErrorMessage(
        error,
        "Nie udało się potwierdzić hasła przed zarządzaniem passkeys.",
      ),
    );
  }
}
