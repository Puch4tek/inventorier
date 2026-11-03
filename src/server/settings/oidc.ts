import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
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
  revision: string;
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
const DEFAULTS: OidcSettings = {
  enabled: false,
  issuer: "",
  clientId: "",
  hasClientSecret: false,
  clientSecretUnreadable: false,
  redirectUri: null,
};

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

function getRedirectUri(revision: string): string | null {
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!baseUrl) return null;
  try {
    return new URL(`/api/auth/callback/oidc-${revision}`, baseUrl).toString();
  } catch {
    return null;
  }
}

export async function getOidcSettings(actorId: string, sessionId: string): Promise<OidcSettings> {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminSessionInTransaction(transaction, actorId, sessionId);
    const row = await transaction.appSettings.findUnique({ where: { id: ID } });
    if (!row) return { ...DEFAULTS };
    let clientSecretUnreadable = false;
    if (row.oidcClientSecret) {
      try {
        decryptSecret(row.oidcClientSecret);
      } catch (error) {
        if (!(error instanceof SecretEncryptionError)) throw error;
        clientSecretUnreadable = true;
      }
    }
    return {
      enabled: row.oidcEnabled,
      issuer: row.oidcIssuer,
      clientId: row.oidcClientId,
      hasClientSecret: !!row.oidcClientSecret,
      clientSecretUnreadable,
      redirectUri: getRedirectUri(row.oidcRevision),
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
      oidcRevision: true,
    },
  });
  if (!row) {
    return { enabled: false, issuer: "", clientId: "", clientSecret: "", revision: randomUUID() };
  }
  let clientSecret = "";
  if (row.oidcClientSecret) {
    try {
      clientSecret = decryptSecret(row.oidcClientSecret);
    } catch (error) {
      if (error instanceof SecretEncryptionError) {
        throw new OidcSettingsError("ENCRYPTION", "Nie można odszyfrować client secret. Sprawdź klucz APP_ENCRYPTION_KEY.");
      }
      throw error;
    }
  }
  if (!row.oidcRevision || (row.oidcEnabled && (!row.oidcIssuer || !row.oidcClientId || !clientSecret))) {
    throw new OidcSettingsError("CONFIGURATION", "Konfiguracja OIDC jest niekompletna.");
  }
  return {
    enabled: row.oidcEnabled,
    issuer: row.oidcIssuer,
    clientId: row.oidcClientId,
    clientSecret,
    revision: row.oidcRevision,
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
      try {
        decryptSecret(encrypted);
      } catch (error) {
        if (error instanceof SecretEncryptionError) {
          throw new OidcSettingsError("ENCRYPTION", "Nie można odszyfrować client secret. Sprawdź klucz APP_ENCRYPTION_KEY.");
        }
        throw error;
      }
    }
    if (input.enabled && (!input.issuer || !input.clientId || !encrypted)) {
      throw new OidcSettingsError("CONFIGURATION", "Konfiguracja OIDC jest niekompletna.");
    }
    let revision = randomUUID();
    while (revision === current?.oidcRevision) revision = randomUUID();
    await transaction.appSettings.upsert({
      where: { id: ID },
      create: {
        id: ID,
        oidcEnabled: input.enabled,
        oidcIssuer: input.issuer,
        oidcClientId: input.clientId,
        oidcClientSecret: encrypted,
        oidcRevision: revision,
      },
      update: {
        oidcEnabled: input.enabled,
        oidcIssuer: input.issuer,
        oidcClientId: input.clientId,
        oidcClientSecret: encrypted,
        oidcRevision: revision,
      },
    });
  });
}
