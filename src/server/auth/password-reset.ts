import "server-only";

import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { Locale } from "@/i18n/locale";
import { prisma } from "@/lib/db/prisma";
import { sendPasswordResetEmail } from "@/server/email/send-mail";
import { consumeEmailRateLimit } from "@/server/settings/email-rate-limit";
import { getResetSettings, getSmtpConfig } from "@/server/settings/email";
import { lockInstanceMutation } from "@/server/warehouses/transaction-lock";
import {
  deleteUserPasswordResetTokens,
  passwordResetIdentifier,
} from "./password-reset-tokens";

const TOKEN_BYTES = 32;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export class PasswordResetError extends Error {
  constructor() {
    super("Link jest nieprawidłowy lub wygasł.");
    this.name = "PasswordResetError";
  }
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordResetUrl(token: string): string {
  const configuredUrl = process.env.BETTER_AUTH_URL;
  if (!configuredUrl) throw new Error("Missing public application URL.");

  const base = new URL(configuredUrl);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    (process.env.NODE_ENV === "production" && base.protocol !== "https:")
  ) {
    throw new Error("Invalid public application URL.");
  }

  const url = new URL("/reset-password", base.origin);
  url.searchParams.set("token", token);
  return url.toString();
}

export type PasswordResetRequestContext = {
  headers?: Pick<Headers, "get">;
  locale?: Locale;
};

function getTrustedClientIp(headers?: Pick<Headers, "get">): string | null {
  if (process.env.TRUSTED_PROXY_IP_HEADER !== "x-real-ip") return null;
  const value = headers?.get("x-real-ip")?.trim();
  return value && isIP(value) ? value : null;
}

export async function requestPasswordReset(
  submittedEmail: string,
  requestContext?: PasswordResetRequestContext,
): Promise<void> {
  const email = submittedEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return;

  try {
    const settings = await getResetSettings();
    if (!settings.enabled) return;

    const clientIp = getTrustedClientIp(requestContext?.headers);
    if (process.env.NODE_ENV === "production" && !clientIp) return;
    if (
      clientIp &&
      !(await consumeEmailRateLimit(
        clientIp,
        20,
        RATE_LIMIT_WINDOW_MS,
        "password-reset-ip-limit",
      ))
    ) {
      return;
    }
    if (
      !(await consumeEmailRateLimit(
        email,
        5,
        RATE_LIMIT_WINDOW_MS,
        "password-reset-limit",
      ))
    ) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true },
    });
    if (!user?.isActive) return;
    const credential = await prisma.account.findFirst({
      where: {
        userId: user.id,
        providerId: "credential",
        password: { not: null },
      },
      select: { id: true, password: true },
    });
    if (!credential?.password) return;

    const smtpConfig = await getSmtpConfig();
    const token = randomBytes(TOKEN_BYTES).toString("hex");
    const identifier = passwordResetIdentifier(token);
    const issued = await prisma.$transaction(async (transaction) => {
      await lockInstanceMutation(transaction);
      const currentSettings = await transaction.appSettings.findUnique({
        where: { id: 1 },
        select: { resetEnabled: true, resetExpiryMinutes: true },
      });
      const currentUser = await transaction.user.findUnique({
        where: { id: user.id },
        select: { isActive: true, email: true },
      });
      const currentCredential = await transaction.account.findFirst({
        where: {
          id: credential.id,
          userId: user.id,
          providerId: "credential",
        },
        select: { password: true },
      });
      if (
        !currentSettings?.resetEnabled || !currentUser?.isActive ||
        currentUser.email !== email ||
        currentCredential?.password !== credential.password
      ) {
        return false;
      }
      if (currentSettings.resetExpiryMinutes < 15 || currentSettings.resetExpiryMinutes > 1440) {
        throw new Error("Invalid password reset expiry.");
      }
      await transaction.verification.deleteMany({
        where: { value: user.id, identifier: { startsWith: "password-reset:" }, expiresAt: { lte: new Date() } },
      });
      await transaction.verification.create({
        data: {
          id: randomUUID(),
          identifier,
          value: user.id,
          expiresAt: new Date(Date.now() + currentSettings.resetExpiryMinutes * 60_000),
        },
      });
      return true;
    });
    if (!issued) return;

    try {
      await sendPasswordResetEmail(
        smtpConfig,
        user.email,
        passwordResetUrl(token),
        requestContext?.locale ?? "pl",
      );
    } catch {
      try {
        await prisma.verification.deleteMany({
          where: { identifier, value: user.id },
        });
      } catch {
        console.error("Could not remove an unsent password reset token.");
      }
      console.error("Password reset email delivery failed.");
    }
  } catch {
    console.error("Password reset request could not be completed.");
  }
}

export async function resetPassword(
  token: string,
  newPassword: string,
  requestContext?: PasswordResetRequestContext,
): Promise<void> {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof newPassword !== "string" ||
    newPassword.length < PASSWORD_MIN_LENGTH ||
    newPassword.length > PASSWORD_MAX_LENGTH
  ) {
    throw new PasswordResetError();
  }

  const clientIp = getTrustedClientIp(requestContext?.headers);
  if (process.env.NODE_ENV === "production" && !clientIp) {
    throw new PasswordResetError();
  }
  if (
    clientIp &&
    !(await consumeEmailRateLimit(
      clientIp,
      100,
      15 * 60 * 1000,
      "password-reset-token-ip-limit",
    ))
  ) {
    throw new PasswordResetError();
  }

  const identifier = passwordResetIdentifier(token);
  const legacyIdentifier = identifier.slice("password-reset:".length);
  const now = new Date();

  try {
    const candidate = await prisma.verification.findFirst({
      where: { identifier: { in: [identifier, legacyIdentifier] }, expiresAt: { gt: now } },
      select: { value: true },
    });
    if (!candidate) throw new PasswordResetError();
    const candidateUser = await prisma.user.findUnique({
      where: { id: candidate.value },
      select: { isActive: true },
    });
    if (!candidateUser?.isActive) throw new PasswordResetError();

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction(async (transaction) => {
      await lockInstanceMutation(transaction);
      const transactionTime = new Date();

      const verification = await transaction.verification.findFirst({
        where: { identifier: { in: [identifier, legacyIdentifier] } },
        select: { id: true, identifier: true, value: true, expiresAt: true },
      });
      if (!verification || verification.expiresAt <= transactionTime) {
        throw new PasswordResetError();
      }

      const user = await transaction.user.findUnique({
        where: { id: verification.value },
        select: { id: true, isActive: true },
      });
      if (!user?.isActive) throw new PasswordResetError();

      const consumed = await transaction.verification.deleteMany({
        where: {
          id: verification.id,
          identifier: verification.identifier,
          value: user.id,
          expiresAt: { gt: transactionTime },
        },
      });
      if (consumed.count !== 1) throw new PasswordResetError();
      await deleteUserPasswordResetTokens(transaction, user.id);

      await transaction.user.update({
        where: { id: user.id },
        data: { mustChangePassword: false },
      });

      const accountUpdate = await transaction.account.updateMany({
        where: { userId: user.id, providerId: "credential" },
        data: { password: passwordHash },
      });
      if (accountUpdate.count !== 1) throw new PasswordResetError();

      await transaction.session.deleteMany({ where: { userId: user.id } });
    });
  } catch (error) {
    if (error instanceof PasswordResetError) throw error;
    throw new Error("Password reset could not be completed.");
  }
}
