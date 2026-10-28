import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";
import { deleteUserPasswordResetTokens } from "@/server/auth/password-reset-tokens";

export async function resetUserPassword(userId: string, password: string, actorId: string) {
  if (!userId) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (password.length < 8) {
    throw new Error("Hasło musi mieć co najmniej 8 znaków.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actorId);
    const updated = await transaction.user.updateMany({
      where: { id: userId },
      data: { mustChangePassword: true },
    });
    if (updated.count !== 1) throw new Error("Użytkownik nie istnieje.");
    const accountUpdated = await transaction.account.updateMany({
      where: { userId, providerId: "credential" },
      data: { password: passwordHash },
    });
    if (accountUpdated.count !== 1) {
      throw new Error("Użytkownik nie ma konta umożliwiającego logowanie hasłem.");
    }
    await deleteUserPasswordResetTokens(transaction, userId);
    await transaction.session.deleteMany({ where: { userId } });
  });
}
