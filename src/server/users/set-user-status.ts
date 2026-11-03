import "server-only";

import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function setUserStatus(
  userId: string,
  active: boolean,
  currentUserId: string,
  sessionId: string,
) {
  if (!userId || (userId === currentUserId && !active)) {
    throw new Error(
      userId === currentUserId
        ? "Nie możesz zablokować własnego konta."
        : "Nieprawidłowy użytkownik.",
    );
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

    if (!active && user.role === "ADMIN" && user.isActive) {
      const activeAdmins = await transaction.user.count({
        where: { role: "ADMIN", isActive: true },
      });
      if (activeAdmins <= 1) {
        throw new Error("W systemie musi pozostać przynajmniej jeden aktywny administrator.");
      }
    }

    await transaction.user.update({
      where: { id: userId },
      data: { isActive: active },
    });

    if (!active) {
      await transaction.session.deleteMany({ where: { userId } });
    }
  });
}
