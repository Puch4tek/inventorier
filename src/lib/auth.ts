import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db/prisma";
import {
  isRegistrationEnabled,
  REGISTRATION_DISABLED_MESSAGE,
} from "@/server/settings/registration";
import bcrypt from "bcryptjs";
import { TWO_FACTOR_RESET_REQUIRED_MESSAGE } from "@/server/auth/two-factor-policy";

function requireTwoFactorReset() {
  throw APIError.from("FORBIDDEN", {
    code: "TWO_FACTOR_RESET_REQUIRED",
    message: TWO_FACTOR_RESET_REQUIRED_MESSAGE,
  });
}

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
  appName: "Inventory App",
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
            select: { isActive: true, twoFactorEnabled: true },
          });
          if (!user?.isActive) {
            throw APIError.from("FORBIDDEN", {
              code: "ACCOUNT_DISABLED",
              message: "To konto jest zablokowane. Skontaktuj się z administratorem.",
            });
          }
          if (user.twoFactorEnabled) requireTwoFactorReset();
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
      if (!session) return;

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { isActive: true, mustChangePassword: true, twoFactorEnabled: true },
      });
      if (!user?.isActive) {
        throw APIError.from("FORBIDDEN", {
          code: "ACCOUNT_DISABLED",
          message: "To konto jest zablokowane. Skontaktuj się z administratorem.",
        });
      }
      if (user.twoFactorEnabled) requireTwoFactorReset();
      if (user.mustChangePassword && ctx.path !== "/get-session") {
        throw APIError.from("FORBIDDEN", {
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "Zmień hasło, aby kontynuować.",
        });
      }
    }),
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
  plugins: [nextCookies()],
});
