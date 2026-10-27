import "server-only";

import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function resetUserTwoFactor(userId: string, actorId: string) {
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actorId);
    const user = await transaction.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
      select: { id: true },
    });
    await transaction.twoFactor.deleteMany({ where: { userId: user.id } });
    await transaction.session.deleteMany({ where: { userId: user.id } });
  });
}
