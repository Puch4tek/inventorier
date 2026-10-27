import "server-only";

import { requireRole } from "@/server/auth/permissions";
import { withAdminRead } from "@/server/warehouses/permissions";

export async function listUsers() {
  const actor = await requireRole("ADMIN");
  return withAdminRead(actor.id, (transaction) => transaction.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      twoFactorEnabled: true,
      createdAt: true,
      _count: {
        select: { passkeys: true },
      },
    },
  }));
}
