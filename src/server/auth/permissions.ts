import "server-only";

import { getCurrentUser } from "./get-current-user";

export type AppRole = "USER" | "MANAGER" | "ADMIN";

const roleRank: Record<AppRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasMinimumRole(
  role: AppRole,
  minimumRole: AppRole,
): boolean {
  return roleRank[role] >= roleRank[minimumRole];
}

export async function requireRole(minimumRole: AppRole) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Musisz być zalogowany.");
  }
  if (!hasMinimumRole(user.role, minimumRole)) {
    throw new Error("Nie masz uprawnień do wykonania tej operacji.");
  }
  return user;
}

