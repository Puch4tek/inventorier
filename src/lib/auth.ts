import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { deleteSessionCookie, splitSetCookieHeader } from "better-auth/cookies";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { twoFactor } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/db/prisma";
import { getPasskeyConfig } from "@/lib/passkey-config";
import { createOidcProviderConfig } from "@/lib/oidc-provider-config";
import type { OidcRuntimeConfig } from "@/server/settings/oidc";
import {
  isRegistrationEnabled,
  REGISTRATION_DISABLED_MESSAGE,
} from "@/server/settings/registration";
import { getSmtpConfig } from "@/server/settings/email";
import { sendEmailVerificationMail } from "@/server/email/email-verification-mail";
import { getAppEncryptionKey } from "@/server/security/secret-encryption";
import { localeCookieName, resolveLocale } from "@/i18n/locale";
import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

const PASSKEY_REAUTH_COOKIE = "inventory-passkey-reauth";
const PASSKEY_REAUTH_IDENTIFIER_PREFIX = "passkey-reauth:";
const OIDC_PROVIDER_PREFIX = "oidc-";

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
): never {
  deleteSessionCookie(ctx);
  throw APIError.from("UNAUTHORIZED", {
    code,
    message,
  });
}

async function checkAuthState<T>(
  ctx: AuthHookContext,
  operation: () => Promise<T>,
  token?: string | null,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("Nie udało się zweryfikować stanu uwierzytelniania:", error instanceof Error ? error.name : "UnknownError");
    deleteSessionCookie(ctx);
    for (const name of ["two_factor", "trust_device"]) {
      const cookie = ctx.context.createAuthCookie(name);
      removeSetCookie(ctx, cookie.name);
      expireAuthCookie(ctx, cookie);
    }
    if (token) {
      try {
        deleteSessionCookie(ctx);
        await checkAuthState(ctx, () => ctx.context.internalAdapter.deleteSession(token), token);
      } catch (deleteError) {
        console.error("Nie udało się unieważnić nieweryfikowanej sesji:", deleteError instanceof Error ? deleteError.name : "UnknownError");
      }
    }
    throw APIError.from("SERVICE_UNAVAILABLE", {
      code: "AUTH_STATE_UNAVAILABLE",
      message: "Nie można teraz zweryfikować stanu uwierzytelniania. Spróbuj ponownie później.",
    });
  }
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

  const returned = await getReturnedBody(ctx.context.returned);
  const user = returned?.user;
  const token = typeof returned?.token === "string" ? returned.token : null;
  const incomingSession = await checkAuthState(ctx, () => getSessionFromCtx(ctx, {
    disableCookieCache: true,
  }), token);
  if (incomingSession?.session) return;

  const userId =
    user && typeof user === "object" && "id" in user &&
    typeof user.id === "string"
      ? user.id
      : null;
  if (!token || !userId) return;

  const currentUser = await checkAuthState(ctx, () => prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    }), token);
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
                ? await checkAuthState(ctx, () => prisma.passkey.findFirst({
                      where: {
                        userId: newSession.user.id,
                        credentialID,
                      },
                      select: { id: true },
                    }), newSession.session.token)
                : null;

            if (passkey) return;

            deleteSessionCookie(ctx);
            await checkAuthState(ctx, () =>
              ctx.context.internalAdapter.deleteSession(newSession.session.token),
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
            const currentUser = await checkAuthState(ctx, () => prisma.user.findUnique({
                where: { id: newSession.user.id },
                select: { twoFactorEnabled: true },
              }), newSession.session.token);
            if (currentUser?.twoFactorEnabled !== true) {
              deleteSessionCookie(ctx);
              const trustCookie = ctx.context.createAuthCookie("trust_device");
              removeSetCookie(ctx, trustCookie.name);
              expireAuthCookie(ctx, trustCookie);
              await checkAuthState(ctx, () => ctx.context.internalAdapter.deleteSession(
                newSession.session.token,
              ), newSession.session.token);
              await checkAuthState(ctx, () => prisma.verification.deleteMany({
                where: {
                  value: newSession.user.id,
                  identifier: { startsWith: "trust-device-" },
                },
              }));
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

          const user = await checkAuthState(ctx, () => prisma.user.findUnique({
              where: { email: email.trim().toLowerCase() },
              select: { id: true, twoFactorEnabled: true },
            }), newSession?.session.token);
          if (user?.twoFactorEnabled === true) return;

          const twoFactorCookie = ctx.context.createAuthCookie("two_factor");
          removeSetCookie(ctx, twoFactorCookie.name);
          expireAuthCookie(ctx, twoFactorCookie);
          if (!user) {
            rejectStaleAuthSession(
              ctx,
              "Konto nie jest już dostępne. Zaloguj się ponownie.",
            );
          }
          const challenges = await checkAuthState(ctx, () => prisma.verification.findMany({
            where: {
              value: user.id,
              identifier: { startsWith: "2fa-" },
            },
            select: { identifier: true },
          }));
          const attemptIdentifiers = challenges.map(({ identifier }) =>
            `2fa-attempts-${identifier}`,
          );
          await checkAuthState(ctx, () => prisma.verification.deleteMany({
            where: {
              value: user.id,
              identifier: { startsWith: "2fa-" },
            },
          }));
          if (attemptIdentifiers.length) {
            await checkAuthState(ctx, () => prisma.verification.deleteMany({
              where: {
                identifier: { in: attemptIdentifiers },
              },
            }));
          }

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

function isOidcCallback(context: AuthHookContext | null | undefined) {
  const providerId =
    typeof context?.params?.id === "string"
      ? context.params.id
      : context?.path?.match(/^\/callback\/(oidc-[A-Za-z0-9-]+)$/)?.[1];
  return Boolean(
    typeof providerId === "string" &&
      providerId.startsWith(OIDC_PROVIDER_PREFIX) &&
      context?.context.socialProviders.some(
        (provider) => provider.id === providerId && provider.idToken,
      ),
  );
}

function buildAuth(runtime?: OidcRuntimeConfig) {
  return betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  appName: "Inventorier",
  secret: getAppEncryptionKey().toString("base64"),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    revokeSessionsOnPasswordReset: true,
  },
  emailVerification: {
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }, request) {
      const locale = resolveLocale({
        cookie: requestCookieValue(request?.headers.get("cookie") ?? null, localeCookieName),
        acceptLanguage: request?.headers.get("accept-language"),
      });
      await sendEmailVerificationMail(
        await getSmtpConfig(),
        user.email,
        url,
        locale,
      );
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(_user, context) {
          if (isOidcCallback(context)) return;
          await requireRegistrationEnabled();
        },
      },
    },
    account: {
      create: {
        async before(account) {
          if (account.providerId.startsWith(OIDC_PROVIDER_PREFIX)) {
            return { data: { ...account, idToken: null } };
          }
        },
      },
      update: {
        async before(account) {
          if (account.providerId?.startsWith(OIDC_PROVIDER_PREFIX)) {
            return { data: { ...account, idToken: null } };
          }
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
      if (
        ctx.path === "/change-password" ||
        ctx.path === "/request-password-reset" ||
        ctx.path === "/reset-password" ||
        ctx.path.startsWith("/reset-password/")
      ) {
        throw APIError.from("FORBIDDEN", {
          code: "USE_PASSWORD_FORM",
          message: "Użyj formularza zmiany lub resetowania hasła.",
        });
      }
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
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: false,
    },
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
  account: {
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      disableImplicitLinking: false,
      requireLocalEmailVerified: true,
    },
  },
  plugins: [
    twoFactor(),
    passkey({
      ...getPasskeyConfig(),
      registration: { requireSession: false },
    }),
    ...(runtime
      ? [genericOAuth({ config: [createOidcProviderConfig(runtime)] })]
      : []),
    mfaRecoveryRaceGuard,
    nextCookies(),
  ],
});
}

export function createOidcAuth(runtime: OidcRuntimeConfig) {
  if (!runtime.enabled) {
    throw new Error("OIDC authentication is disabled.");
  }
  return buildAuth(runtime);
}

export const auth = buildAuth();
