import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function resetUserPassword(userId: string, password: string, actorId: string) {
  if (!userId) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (password.length < 8) {
    throw new Error("Hasło musi mieć co najmniej 8 znaków.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actorId);
    const updated = await transaction.user.updateMany({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: true },
    });
    await transaction.account.updateMany({
      where: { userId, providerId: "credential" },
      data: { password: passwordHash },
    });
    await transaction.session.deleteMany({ where: { userId } });
    return updated;
  });

  if (user.count !== 1) {
    throw new Error("Użytkownik nie istnieje.");
  }
}
