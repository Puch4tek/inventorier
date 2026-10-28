import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { deleteSessionCookie, splitSetCookieHeader } from "better-auth/cookies";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/db/prisma";
import { getPasskeyConfig } from "@/lib/passkey-config";
import {
  isRegistrationEnabled,
  REGISTRATION_DISABLED_MESSAGE,
} from "@/server/settings/registration";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const PASSKEY_REAUTH_COOKIE = "inventory-passkey-reauth";
const PASSKEY_REAUTH_IDENTIFIER_PREFIX = "passkey-reauth:";

type AuthHookContext = Parameters<typeof getSessionFromCtx>[0];
type AuthCookie = ReturnType<AuthHookContext["context"]["createAuthCookie"]>;
type AuthResponseBody = Record<string, unknown> | null;

async function getReturnedBody(returned: unknown): Promise<AuthResponseBody> {
  if (returned instanceof Response) {
    try {
      const body: unknown = await returned.clone().json();
      return body && typeof body === "object"
        ? (body as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return returned && typeof returned === "object"
    ? (returned as Record<string, unknown>)
    : null;
}

function requestCookieValue(header: string | null, name: string) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return value || null;
  }
  return null;
}

function removeSetCookie(ctx: AuthHookContext, cookieName: string) {
  const responseHeaders = (
    ctx.context as typeof ctx.context & { responseHeaders?: Headers }
  ).responseHeaders;
  if (!responseHeaders) return;

  const setCookies = responseHeaders.get("set-cookie");
  if (!setCookies) return;
  const remaining = splitSetCookieHeader(setCookies).filter((cookie) => {
    const separator = cookie.indexOf("=");
    return separator < 0 || cookie.slice(0, separator).trim() !== cookieName;
  });
  responseHeaders.delete("set-cookie");
  for (const cookie of remaining) {
    responseHeaders.append("set-cookie", cookie);
  }
}

function expireAuthCookie(ctx: AuthHookContext, cookie: AuthCookie) {
  ctx.setCookie(cookie.name, "", {
    ...cookie.attributes,
    maxAge: 0,
    expires: new Date(0),
  });
}

function rejectStaleAuthSession(
  ctx: AuthHookContext,
  message: string,
  code = "TWO_FACTOR_RESET",
) {
  deleteSessionCookie(ctx);
  throw APIError.from("UNAUTHORIZED", {
    code,
    message,
  });
}

async function consumePasskeyReauthentication(
  ctx: AuthHookContext,
  consume: boolean,
) {
  const session = await getSessionFromCtx(ctx, { disableCookieCache: true });
  if (!session?.session) {
    throw APIError.from("UNAUTHORIZED", {
      code: "PASSKEY_REAUTH_REQUIRED",
      message: "Ponownie potwierdź hasło przed zarządzaniem passkeys.",
    });
  }

  const token = requestCookieValue(
    ctx.headers?.get("cookie") ?? null,
    PASSKEY_REAUTH_COOKIE,
  );
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw APIError.from("FORBIDDEN", {
      code: "PASSKEY_REAUTH_REQUIRED",
      message: "Ponownie potwierdź hasło przed zarządzaniem passkeys.",
    });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const identifier = `${PASSKEY_REAUTH_IDENTIFIER_PREFIX}${tokenHash}`;
  const value = JSON.stringify({
    userId: session.user.id,
    sessionId: session.session.id,
  });
  const now = new Date();
  const record = await prisma.verification.findFirst({
    where: { identifier, value, expiresAt: { gt: now } },
    select: { id: true },
  });
  if (!record) {
    throw APIError.from("FORBIDDEN", {
      code: "PASSKEY_REAUTH_REQUIRED",
      message: "Ponownie potwierdź hasło przed zarządzaniem passkeys.",
    });
  }

  if (consume) {
    const consumed = await prisma.verification.deleteMany({
      where: { id: record.id, identifier, value, expiresAt: { gt: new Date() } },
    });
    if (consumed.count !== 1) {
      throw APIError.from("FORBIDDEN", {
        code: "PASSKEY_REAUTH_REQUIRED",
        message: "Ponownie potwierdź hasło przed zarządzaniem passkeys.",
      });
    }
  }

  return session;
}

const mfaVerificationRecoveryGuard = createAuthMiddleware(async (ctx) => {
  if (
    ctx.path !== "/two-factor/verify-totp" &&
    ctx.path !== "/two-factor/verify-backup-code"
  ) {
    return;
  }

  const incomingSession = await getSessionFromCtx(ctx, {
    disableCookieCache: true,
  });
  if (incomingSession?.session) return;

  const returned = await getReturnedBody(ctx.context.returned);
  const user = returned?.user;
  const token = typeof returned?.token === "string" ? returned.token : null;
  const userId =
    user && typeof user === "object" && "id" in user &&
    typeof user.id === "string"
      ? user.id
      : null;
  if (!token || !userId) return;

  const currentUser = await prisma.user
    .findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    })
    .catch(() => null);
  if (currentUser?.twoFactorEnabled === true) return;

  await ctx.context.internalAdapter.deleteSession(token);
  rejectStaleAuthSession(
    ctx,
    "Uwierzytelnianie dwuskładnikowe zostało zresetowane. Zaloguj się ponownie.",
  );
});

const mfaRecoveryRaceGuard = {
  id: "mfa-recovery-race-guard",
  version: "1.0.0",
  hooks: {
    after: [
      {
        matcher(ctx: { path?: string }) {
          return (
            ctx.path === "/sign-in/email" ||
            ctx.path === "/passkey/verify-authentication"
          );
        },
        handler: createAuthMiddleware(async (ctx) => {
          if (ctx.path === "/passkey/verify-authentication") {
            const newSession = ctx.context.newSession;
            if (!newSession) return;

            const response = ctx.body as
              | { response?: { id?: unknown } }
              | undefined;
            const credentialID = response?.response?.id;
            const passkey =
              typeof credentialID === "string" &&
              credentialID.length > 0 &&
              credentialID.length <= 1024
                ? await prisma.passkey
                    .findFirst({
                      where: {
                        userId: newSession.user.id,
                        credentialID,
                      },
                      select: { id: true },
                    })
                    .catch(() => null)
                : null;

            if (passkey) return;

            await ctx.context.internalAdapter.deleteSession(
              newSession.session.token,
            );
            rejectStaleAuthSession(
              ctx,
              "Klucz dostępu został usunięty lub konto zostało zresetowane. Zaloguj się ponownie.",
              "PASSKEY_RESET",
            );
          }

          if (ctx.path !== "/sign-in/email") return;
          const returned = await getReturnedBody(ctx.context.returned);
          const newSession = ctx.context.newSession;
          if (newSession?.user.twoFactorEnabled === true) {
            const currentUser = await prisma.user
              .findUnique({
                where: { id: newSession.user.id },
                select: { twoFactorEnabled: true },
              })
              .catch(() => null);
            if (currentUser?.twoFactorEnabled !== true) {
              await ctx.context.internalAdapter.deleteSession(
                newSession.session.token,
              );
              await prisma.verification.deleteMany({
                where: {
                  value: newSession.user.id,
                  identifier: { startsWith: "trust-device-" },
                },
              });
              deleteSessionCookie(ctx);
              const trustCookie = ctx.context.createAuthCookie("trust_device");
              removeSetCookie(ctx, trustCookie.name);
              expireAuthCookie(ctx, trustCookie);
              throw APIError.from("UNAUTHORIZED", {
                code: "TWO_FACTOR_RESET",
                message:
                  "Uwierzytelnianie dwuskładnikowe zostało zresetowane. Zaloguj się ponownie.",
              });
            }
            return;
          }

          if (returned?.twoFactorRedirect !== true) return;
          const email =
            ctx.body && typeof ctx.body === "object" && "email" in ctx.body
              ? ctx.body.email
              : null;
          if (typeof email !== "string" || !email.trim()) return;

          const user = await prisma.user
            .findUnique({
              where: { email: email.trim().toLowerCase() },
              select: { id: true, twoFactorEnabled: true },
            })
            .catch(() => null);
          if (!user || user.twoFactorEnabled === true) return;

          const challenges = await prisma.verification.findMany({
            where: {
              value: user.id,
              identifier: { startsWith: "2fa-" },
            },
            select: { identifier: true },
          });
          const attemptIdentifiers = challenges.map(({ identifier }) =>
            `2fa-attempts-${identifier}`,
          );
          await prisma.verification.deleteMany({
            where: {
              value: user.id,
              identifier: { startsWith: "2fa-" },
            },
          });
          if (attemptIdentifiers.length) {
            await prisma.verification.deleteMany({
              where: {
                identifier: { in: attemptIdentifiers },
              },
            });
          }

          const twoFactorCookie = ctx.context.createAuthCookie("two_factor");
          removeSetCookie(ctx, twoFactorCookie.name);
          expireAuthCookie(ctx, twoFactorCookie);
          throw APIError.from("UNAUTHORIZED", {
            code: "TWO_FACTOR_RESET",
            message:
              "Uwierzytelnianie dwuskładnikowe zostało zresetowane. Zaloguj się ponownie.",
          });
        }),
      },
    ],
  },
};

async function requireRegistrationEnabled() {
  if (!(await isRegistrationEnabled())) {
    throw APIError.from("FORBIDDEN", {
      code: "REGISTRATION_DISABLED",
      message: REGISTRATION_DISABLED_MESSAGE,
    });
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  appName: "Inventorier",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    revokeSessionsOnPasswordReset: true,
  },
  databaseHooks: {
    user: {
      create: {
        async before() {
          await requireRegistrationEnabled();
        },
      },
    },
    session: {
      create: {
        async before(session) {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive) {
            throw APIError.from("FORBIDDEN", {
              code: "ACCOUNT_DISABLED",
              message: "To konto jest zablokowane. Skontaktuj się z administratorem.",
            });
          }
        },
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-out") return;
      if (ctx.path === "/sign-up/email") {
        await requireRegistrationEnabled();
        throw APIError.from("FORBIDDEN", {
          code: "USE_REGISTRATION_FORM",
          message: "Utwórz konto przez formularz rejestracji.",
        });
      }

      const session = await getSessionFromCtx(ctx, { disableCookieCache: true });
      const passkeyManagementPath =
        ctx.path === "/passkey/generate-register-options" ||
        ctx.path === "/passkey/verify-registration" ||
        ctx.path === "/passkey/update-passkey" ||
        ctx.path === "/passkey/delete-passkey";
      if (passkeyManagementPath && !session?.session) {
        throw APIError.from("UNAUTHORIZED", {
          code: "PASSKEY_REAUTH_REQUIRED",
          message: "Ponownie potwierdź hasło przed zarządzaniem passkeys.",
        });
      }
      if (!session) return;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isActive: true, mustChangePassword: true },
      });
      if (!user?.isActive) {
        throw APIError.from("FORBIDDEN", {
          code: "ACCOUNT_DISABLED",
          message: "To konto jest zablokowane. Skontaktuj się z administratorem.",
        });
      }
      if (user.mustChangePassword && ctx.path !== "/get-session") {
        throw APIError.from("FORBIDDEN", {
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "Zmień hasło, aby kontynuować.",
        });
      }

      if (ctx.path === "/passkey/generate-register-options") {
        const name = ctx.query?.name;
        if (
          name !== undefined &&
          (typeof name !== "string" || !name.trim() || name.trim().length > 64)
        ) {
          throw APIError.from("BAD_REQUEST", {
            code: "INVALID_PASSKEY_NAME",
            message: "Nazwa passkey musi mieć od 1 do 64 znaków.",
          });
        }
        await consumePasskeyReauthentication(ctx, false);
      } else if (
        ctx.path === "/passkey/verify-registration" ||
        ctx.path === "/passkey/update-passkey" ||
        ctx.path === "/passkey/delete-passkey"
      ) {
        await consumePasskeyReauthentication(ctx, true);
      }

      if (
        ctx.path === "/passkey/update-passkey" ||
        ctx.path === "/passkey/delete-passkey" ||
        ctx.path === "/passkey/verify-registration"
      ) {
        const body = ctx.body as Record<string, unknown> | undefined;
        if (typeof body?.id === "string" && body.id.length > 256) {
          throw APIError.from("BAD_REQUEST", {
            code: "INVALID_PASSKEY_ID",
            message: "Passkey nie jest prawidłowy.",
          });
        }
        if (
          (ctx.path === "/passkey/update-passkey" ||
            ctx.path === "/passkey/verify-registration") &&
          body?.name !== undefined &&
          (typeof body.name !== "string" ||
            !body.name.trim() ||
            body.name.trim().length > 64)
        ) {
          throw APIError.from("BAD_REQUEST", {
            code: "INVALID_PASSKEY_NAME",
            message: "Nazwa passkey musi mieć od 1 do 64 znaków.",
          });
        }
      }
    }),
    after: mfaVerificationRecoveryGuard,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [
    twoFactor(),
    passkey({
      ...getPasskeyConfig(),
      registration: { requireSession: false },
    }),
    mfaRecoveryRaceGuard,
    nextCookies(),
  ],
});
