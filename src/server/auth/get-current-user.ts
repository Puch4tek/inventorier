import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function getActiveSession() {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
  } catch (error) {
    if (isAPIError(error) && (error.body?.code === "ACCOUNT_DISABLED" || error.body?.code === "TWO_FACTOR_RESET_REQUIRED")) {
      return null;
    }
    throw error;
  }
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      twoFactorEnabled: true,
    },
  });
  return user?.isActive && !user.twoFactorEnabled ? { user, session: session.session } : null;
}

export async function getActiveSessionUser() {
  return (await getActiveSession())?.user ?? null;
}

export async function getCurrentUser() {
  const user = await getActiveSessionUser();
  if (user?.mustChangePassword) redirect("/change-password");
  return user;
}

export async function requireCurrentUser() {
  const user = await getActiveSessionUser();
  if (!user) throw new Error("Musisz być zalogowany.");
  if (user.mustChangePassword) {
    throw new Error("Zmień hasło, aby kontynuować.");
  }
  return user;
}