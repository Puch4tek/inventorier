import "server-only";

import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function deleteUser(userId: string, currentUserId: string, sessionId: string) {
  if (!userId) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (userId === currentUserId) {
    throw new Error("Nie możesz usunąć własnego konta.");
  }

  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, currentUserId, sessionId);
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!user) {
      throw new Error("Użytkownik nie istnieje.");
    }

    if (user.role === "ADMIN" && user.isActive) {
      const adminCount = await transaction.user.count({
        where: { role: "ADMIN", isActive: true },
      });
      if (adminCount <= 1) {
        throw new Error("W systemie musi pozostać przynajmniej jeden aktywny administrator.");
      }
    }

    await transaction.session.deleteMany({ where: { userId } });
    await transaction.user.delete({ where: { id: userId } });
  });
}
