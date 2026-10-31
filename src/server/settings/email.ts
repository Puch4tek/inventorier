import "server-only";

import { isIP } from "node:net";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { decryptSecret, encryptSecret, SecretEncryptionError } from "@/server/security/secret-encryption";
import { lockInstanceMutation } from "@/server/warehouses/transaction-lock";

export type EmailSettings = {
  host: string;
  port: number;
  tls: "implicit" | "starttls";
  username: string;
  fromEmail: string;
  fromName: string;
  hasPassword: boolean;
  passwordUnreadable: boolean;
  resetEnabled: boolean;
  resetExpiryMinutes: number;
};

export type SaveEmailSettingsInput = Omit<EmailSettings, "hasPassword" | "passwordUnreadable"> & {
  password?: string;
};

export class EmailSettingsError extends Error {
  readonly code: "VALIDATION" | "CONFIGURATION" | "ENCRYPTION";

  constructor(
    code: "VALIDATION" | "CONFIGURATION" | "ENCRYPTION",
    message: string,
  ) {
    super(message);
    this.name = "EmailSettingsError";
    this.code = code;
  }
}

const ID = 1;
const DEFAULTS: EmailSettings = {
  host: "",
  port: 587,
  tls: "starttls",
  username: "",
  fromEmail: "",
  fromName: "",
  hasPassword: false,
  passwordUnreadable: false,
  resetEnabled: true,
  resetExpiryMinutes: 60,
};

function encryptPassword(password: string): string {
  try {
    return encryptSecret(password);
  } catch (error) {
    if (error instanceof SecretEncryptionError) {
      throw new EmailSettingsError("ENCRYPTION", "Nieprawidłowy lub brakujący klucz APP_ENCRYPTION_KEY.");
    }
    throw error;
  }
}

function decryptPassword(value: string): string {
  try {
    return decryptSecret(value);
  } catch (error) {
    if (error instanceof SecretEncryptionError) {
      throw new EmailSettingsError("ENCRYPTION", "Nie można odszyfrować hasła SMTP. Sprawdź klucz APP_ENCRYPTION_KEY.");
    }
    throw error;
  }
}

function validHost(host: string): boolean {
  if (!host) return true;
  if (isIP(host)) return true;
  return host.length <= 253 && host.split(".").every(
    (label) => label.length > 0 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label),
  );
}

function validEmail(email: string): boolean {
  if (!email) return true;
  if (email.length > 254) return false;
  const parts = email.split("@");
  return parts.length === 2 && parts[0].length <= 64 &&
    /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(parts[0]) &&
    parts[1].includes(".") && validHost(parts[1]);
}

function validate(input: SaveEmailSettingsInput): void {
  if (
    typeof input.host !== "string" || !validHost(input.host) ||
    !Number.isInteger(input.port) || input.port < 1 || input.port > 65535 ||
    (input.tls !== "implicit" && input.tls !== "starttls") ||
    typeof input.username !== "string" || input.username.length > 320 || /[\x00-\x1f\x7f]/.test(input.username) ||
    typeof input.fromEmail !== "string" || !validEmail(input.fromEmail) ||
    typeof input.fromName !== "string" || input.fromName.length > 200 || /[\x00-\x1f\x7f]/.test(input.fromName) ||
    typeof input.resetEnabled !== "boolean" ||
    !Number.isInteger(input.resetExpiryMinutes) || input.resetExpiryMinutes < 15 || input.resetExpiryMinutes > 1440 ||
    (input.password !== undefined && (typeof input.password !== "string" || input.password.length > 4096))
  ) {
    throw new EmailSettingsError("VALIDATION", "Nieprawidłowe ustawienia e-mail.");
  }
}

function requireComplete(settings: Pick<EmailSettings, "host" | "username" | "fromEmail" | "fromName">, password: string): void {
  if (!settings.host || !settings.username.trim() || !settings.fromEmail || !settings.fromName.trim() || !password) {
    throw new EmailSettingsError("CONFIGURATION", "Konfiguracja SMTP jest niekompletna.");
  }
}

function isUnconfigured(row: {
  smtpHost: string; smtpUsername: string; smtpFromEmail: string; smtpFromName: string; smtpPassword: string | null;
}): boolean {
  return !row.smtpHost && !row.smtpUsername && !row.smtpFromEmail && !row.smtpFromName && !row.smtpPassword;
}

function toSettings(row: {
  smtpHost: string; smtpPort: number; smtpTls: string; smtpUsername: string;
  smtpFromEmail: string; smtpFromName: string; smtpPassword: string | null;
  resetEnabled: boolean; resetExpiryMinutes: number;
}): Omit<EmailSettings, "passwordUnreadable"> {
  const settings = {
    host: row.smtpHost, port: row.smtpPort, tls: row.smtpTls,
    username: row.smtpUsername, fromEmail: row.smtpFromEmail, fromName: row.smtpFromName,
    hasPassword: !!row.smtpPassword, resetEnabled: row.resetEnabled, resetExpiryMinutes: row.resetExpiryMinutes,
  };
  validate({ ...settings, tls: settings.tls as EmailSettings["tls"] });
  return settings as Omit<EmailSettings, "passwordUnreadable">;
}

async function requireEmailAdmin(
  transaction: Prisma.TransactionClient,
  actorId: string,
  sessionId: string,
) {
  const session = await transaction.session.findFirst({
    where: {
      id: sessionId,
      userId: actorId,
      expiresAt: { gt: new Date() },
      user: { isActive: true, mustChangePassword: false, role: "ADMIN" },
    },
    select: { id: true },
  });
  if (!session) throw new Error("Nie masz uprawnień do wykonania tej operacji.");
}

export async function getEmailSettings(actorId: string, sessionId: string): Promise<EmailSettings> {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireEmailAdmin(transaction, actorId, sessionId);
    const row = await transaction.appSettings.findUnique({ where: { id: ID } });
    if (!row) return { ...DEFAULTS };
    let passwordUnreadable = false;
    if (row.smtpPassword) {
      try {
        decryptPassword(row.smtpPassword);
      } catch (error) {
        if (!(error instanceof EmailSettingsError)) throw error;
        passwordUnreadable = true;
      }
    }
    const settings = toSettings(row);
    return { ...settings, passwordUnreadable, resetEnabled: isUnconfigured(row) ? DEFAULTS.resetEnabled : settings.resetEnabled };
  });
}

export async function saveEmailSettings(input: SaveEmailSettingsInput, actorId: string, sessionId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireEmailAdmin(transaction, actorId, sessionId);
    validate(input);
    const current = await transaction.appSettings.findUnique({ where: { id: ID } });
    let encrypted = current?.smtpPassword ?? null;
    let password = "";
    if (input.password) {
      password = input.password;
      encrypted = encryptPassword(password);
    } else if (encrypted && input.resetEnabled) {
      password = decryptPassword(encrypted);
    }
    let resetEnabled = input.resetEnabled;
    if (resetEnabled) {
      try {
        requireComplete(input, password);
      } catch (error) {
        if (!(error instanceof EmailSettingsError) || error.code !== "CONFIGURATION" || (current && !isUnconfigured(current))) throw error;
        resetEnabled = false;
      }
    }
    const data = {
      smtpHost: input.host, smtpPort: input.port, smtpTls: input.tls, smtpUsername: input.username,
      smtpPassword: encrypted, smtpFromEmail: input.fromEmail, smtpFromName: input.fromName,
      resetEnabled, resetExpiryMinutes: input.resetExpiryMinutes,
    };
    await transaction.appSettings.upsert({ where: { id: ID }, create: { id: ID, ...data }, update: data });
  });
}

type SmtpConfig = {
  host: string; port: number; tls: "implicit" | "starttls"; username: string;
  password: string; fromEmail: string; fromName: string;
};

function smtpConfigFromRow(row: Awaited<ReturnType<typeof prisma.appSettings.findUnique>>): SmtpConfig {
  if (!row) throw new EmailSettingsError("CONFIGURATION", "Konfiguracja SMTP jest niekompletna.");
  const settings = toSettings(row);
  const password = row.smtpPassword ? decryptPassword(row.smtpPassword) : "";
  requireComplete(settings, password);
  return {
    host: settings.host, port: settings.port, tls: settings.tls, username: settings.username,
    password, fromEmail: settings.fromEmail, fromName: settings.fromName,
  };
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  return smtpConfigFromRow(await prisma.appSettings.findUnique({ where: { id: ID } }));
}

export async function getAdminSmtpConfig(actorId: string, sessionId: string): Promise<SmtpConfig> {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireEmailAdmin(transaction, actorId, sessionId);
    return smtpConfigFromRow(await transaction.appSettings.findUnique({ where: { id: ID } }));
  });
}

export async function getResetSettings(): Promise<{ enabled: boolean; expiryMinutes: number }> {
  const row = await prisma.appSettings.findUnique({
    where: { id: ID }, select: { resetEnabled: true, resetExpiryMinutes: true },
  });
  if (!row) return { enabled: false, expiryMinutes: 60 };
  if (!Number.isInteger(row.resetExpiryMinutes) || row.resetExpiryMinutes < 15 || row.resetExpiryMinutes > 1440) {
    throw new EmailSettingsError("CONFIGURATION", "Nieprawidłowy czas ważności resetu hasła.");
  }
  return { enabled: row.resetEnabled, expiryMinutes: row.resetExpiryMinutes };
}
