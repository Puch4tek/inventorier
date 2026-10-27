import "server-only";

import { requireCurrentUser } from "./get-current-user";
import type { Role } from "@/generated/prisma/client";

export type AppRole = Role;

export async function requireRole(minimumRole: AppRole) {
  const user = await requireCurrentUser();
  if (minimumRole === "ADMIN" && user.role !== "ADMIN") {
    throw new Error("Nie masz uprawnień do wykonania tej operacji.");
  }
  return user;
}
