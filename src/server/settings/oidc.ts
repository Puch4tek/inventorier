import "server-only";

import { prisma } from "@/lib/db/prisma";
import { OIDC_PROVIDER_ID } from "@/lib/oidc-provider-config";
import { decryptSecret, encryptSecret, SecretEncryptionError } from "@/server/security/secret-encryption";
import { lockInstanceMutation, requireAdminSessionInTransaction } from "@/server/warehouses/transaction-lock";

export type OidcSettings = {
  enabled: boolean;
  issuer: string;
  clientId: string;
  hasClientSecret: boolean;
  clientSecretUnreadable: boolean;
  redirectUri: string | null;
};

export type SaveOidcSettingsInput = {
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret?: string;
};

export type OidcRuntimeConfig = {
  enabled: boolean;
  issuer: string;
  clientId: string;
  clientSecret: string;
};

export class OidcSettingsError extends Error {
  readonly code: "VALIDATION" | "CONFIGURATION" | "ENCRYPTION";

  constructor(code: "VALIDATION" | "CONFIGURATION" | "ENCRYPTION", message: string) {
    super(message);
    this.name = "OidcSettingsError";
    this.code = code;
  }
}

const ID = 1;

function validIssuer(issuer: string): boolean {
  if (!issuer) return true;
  if (issuer.length > 2048 || issuer !== issuer.trim() || /[\x00-\x20\x7f]/.test(issuer)) return false;
  try {
    const url = new URL(issuer);
    return url.protocol === "https:" &&
      !!url.hostname && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

function validate(input: SaveOidcSettingsInput): void {
  if (
    typeof input.enabled !== "boolean" ||
    typeof input.issuer !== "string" || !validIssuer(input.issuer) ||
    typeof input.clientId !== "string" || input.clientId.length > 512 ||
    /[\x00-\x1f\x7f]/.test(input.clientId) ||
    (input.clientSecret !== undefined &&
      (typeof input.clientSecret !== "string" || input.clientSecret.length > 4096))
  ) {
    throw new OidcSettingsError("VALIDATION", "Nieprawidłowe ustawienia OIDC.");
  }
}

function getRedirectUri(): string | null {
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!baseUrl) return null;
  try {
    return new URL(`/api/auth/callback/${OIDC_PROVIDER_ID}`, baseUrl).toString();
  } catch {
    return null;
  }
}

function decryptClientSecret(encrypted: string): string {
  try {
    return decryptSecret(encrypted);
  } catch (error) {
    if (error instanceof SecretEncryptionError) {
      throw new OidcSettingsError("ENCRYPTION", "Nie można odszyfrować client secret. Sprawdź klucz APP_ENCRYPTION_KEY.");
    }
    throw error;
  }
}

export async function getOidcSettings(actorId: string, sessionId: string): Promise<OidcSettings> {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminSessionInTransaction(transaction, actorId, sessionId);
    const row = await transaction.appSettings.findUnique({ where: { id: ID } });
    let clientSecretUnreadable = false;
    if (row?.oidcClientSecret) {
      try {
        decryptSecret(row.oidcClientSecret);
      } catch (error) {
        if (!(error instanceof SecretEncryptionError)) throw error;
        clientSecretUnreadable = true;
      }
    }
    return {
      enabled: row?.oidcEnabled ?? false,
      issuer: row?.oidcIssuer ?? "",
      clientId: row?.oidcClientId ?? "",
      hasClientSecret: !!row?.oidcClientSecret,
      clientSecretUnreadable,
      redirectUri: getRedirectUri(),
    };
  });
}

export async function getOidcRuntimeConfig(): Promise<OidcRuntimeConfig> {
  const row = await prisma.appSettings.findUnique({
    where: { id: ID },
    select: {
      oidcEnabled: true,
      oidcIssuer: true,
      oidcClientId: true,
      oidcClientSecret: true,
    },
  });
  if (!row) {
    return { enabled: false, issuer: "", clientId: "", clientSecret: "" };
  }
  const clientSecret = row.oidcClientSecret ? decryptClientSecret(row.oidcClientSecret) : "";
  if (row.oidcEnabled && (!row.oidcIssuer || !row.oidcClientId || !clientSecret)) {
    throw new OidcSettingsError("CONFIGURATION", "Konfiguracja OIDC jest niekompletna.");
  }
  return {
    enabled: row.oidcEnabled,
    issuer: row.oidcIssuer,
    clientId: row.oidcClientId,
    clientSecret,
  };
}

export async function saveOidcSettings(
  input: SaveOidcSettingsInput,
  actorId: string,
  sessionId: string,
): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminSessionInTransaction(transaction, actorId, sessionId);
    validate(input);
    const current = await transaction.appSettings.findUnique({ where: { id: ID } });
    let encrypted = current?.oidcClientSecret ?? null;
    if (input.clientSecret) {
      try {
        encrypted = encryptSecret(input.clientSecret);
      } catch (error) {
        if (error instanceof SecretEncryptionError) {
          throw new OidcSettingsError("ENCRYPTION", "Nieprawidłowy lub brakujący klucz APP_ENCRYPTION_KEY.");
        }
        throw error;
      }
    } else if (input.enabled && encrypted) {
      decryptClientSecret(encrypted);
    }
    if (input.enabled && (!input.issuer || !input.clientId || !encrypted)) {
      throw new OidcSettingsError("CONFIGURATION", "Konfiguracja OIDC jest niekompletna.");
    }
    const settings = {
      oidcEnabled: input.enabled,
      oidcIssuer: input.issuer,
      oidcClientId: input.clientId,
      oidcClientSecret: encrypted,
    };
    await transaction.appSettings.upsert({
      where: { id: ID },
      create: { id: ID, ...settings },
      update: settings,
    });
  });
}
