import "server-only";

import { requireRoleSession } from "@/server/auth/permissions";
import { withAdminRead } from "@/server/warehouses/permissions";
import { OIDC_PROVIDER_ID } from "@/lib/oidc-provider-config";

export async function listUsers() {
  const actor = await requireRoleSession("ADMIN");
  return withAdminRead(actor.user.id, actor.session.id, async (transaction) => {
    const settings = await transaction.appSettings.findUnique({
      where: { id: 1 }, select: { oidcEnabled: true },
    });
    const users = await transaction.user.findMany({
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
        accounts: {
          where: { OR: [{ providerId: "credential" }, { providerId: OIDC_PROVIDER_ID }, { providerId: { startsWith: "oidc-" } }] },
          select: { providerId: true, password: true },
        },
        _count: {
          select: { passkeys: true },
        },
      },
    });
    return users.map(({ accounts, ...user }) => {
      const hasPassword = accounts.some((account) => account.providerId === "credential" && !!account.password);
      const hasOidc = accounts.some((account) => account.providerId === OIDC_PROVIDER_ID);
      const staleOidc = accounts.some((account) => account.providerId.startsWith("oidc-"));
      const authStatus: "connected" | "provisioned" | "local" | "unavailable" =
        hasOidc ? (hasPassword ? "connected" : "provisioned") : hasPassword ? "local" : "unavailable";
      return {
        ...user,
        hasPassword,
        hasOidc,
        staleOidc,
        oidcEnabled: settings?.oidcEnabled === true,
        hasAnyOidc: hasOidc || staleOidc,
        authStatus,
      };
    });
  });
}
