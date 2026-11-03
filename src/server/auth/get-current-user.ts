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
    if (isAPIError(error) && error.body?.code === "ACCOUNT_DISABLED") {
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
    },
  });
  return user?.isActive ? { user, session: session.session } : null;
}

export async function getActiveSessionUser() {
  return (await getActiveSession())?.user ?? null;
}

export async function getCurrentUser() {
  return (await getCurrentSession())?.user ?? null;
}

export async function getCurrentSession() {
  const active = await getActiveSession();
  if (active?.user.mustChangePassword) redirect("/change-password");
  return active;
}

export async function requireCurrentSession() {
  const active = await getActiveSession();
  if (!active) throw new Error("Musisz być zalogowany.");
  if (active.user.mustChangePassword) {
    throw new Error("Zmień hasło, aby kontynuować.");
  }
  return active;
}

export async function requireCurrentUser() {
  return (await requireCurrentSession()).user;
}