import "server-only";

import { prisma } from "@/lib/db/prisma";
import { OIDC_PROVIDER_ID } from "@/lib/oidc-provider-config";
import {
  lockInstanceMutation,
  requireActiveUserInTransaction,
  requireAdminInTransaction,
} from "@/server/warehouses/transaction-lock";

export async function unlinkOidcAccounts(userId: string, actorId: string, sessionId: string, admin: boolean) {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    if (admin) {
      await requireAdminInTransaction(transaction, actorId, sessionId);
    } else {
      if (userId !== actorId) throw new Error("Unauthorized OIDC unlink.");
      await requireActiveUserInTransaction(transaction, actorId, sessionId);
    }
    const password = await transaction.account.findFirst({
      where: { userId, providerId: "credential", password: { not: null } },
      select: { id: true },
    });
    if (!password) throw new Error("A local password is required to unlink OIDC.");
    const result = await transaction.account.deleteMany({
      where: { userId, providerId: OIDC_PROVIDER_ID },
    });
    if (!result.count) throw new Error("No OIDC account to unlink.");
  });
}
