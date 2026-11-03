import "server-only";

import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function setPasswordChangeRequired(userId: string, actorId: string, sessionId: string) {
  if (!userId) {
    throw new Error("Nieprawidłowy użytkownik.");
  }

  const result = await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actorId, sessionId);
    return transaction.user.updateMany({
      where: { id: userId },
      data: { mustChangePassword: true },
    });
  });

  if (result.count !== 1) {
    throw new Error("Użytkownik nie istnieje.");
  }
}
