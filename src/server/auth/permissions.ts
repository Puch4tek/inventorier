import "server-only";

import { requireCurrentSession } from "./get-current-user";
import type { Role } from "@/generated/prisma/client";

export type AppRole = Role;

export async function requireRoleSession(minimumRole: AppRole) {
  const active = await requireCurrentSession();
  if (minimumRole === "ADMIN" && active.user.role !== "ADMIN") {
    throw new Error("Nie masz uprawnień do wykonania tej operacji.");
  }
  return active;
}

export async function requireRole(minimumRole: AppRole) {
  return (await requireRoleSession(minimumRole)).user;
}
