import "server-only";

import type { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { lockInstanceMutation, requireAdminInTransaction } from "@/server/warehouses/transaction-lock";

export async function updateUserRole(
  userId: string,
  role: Role,
  currentUserId: string,
) {
  if (!userId) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (!["USER", "ADMIN"].includes(role)) {
    throw new Error("Nieprawidłowa rola.");
  }
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, currentUserId);
    const target = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) throw new Error("Użytkownik nie istnieje.");

    if (target.role === "ADMIN" && role !== "ADMIN" && target.isActive) {
      const activeAdmins = await transaction.user.count({
        where: { role: "ADMIN", isActive: true },
      });
      if (activeAdmins <= 1) {
        throw new Error("W systemie musi pozostać przynajmniej jeden aktywny administrator.");
      }
    }

    if (target.id === currentUserId && role !== "ADMIN") {
      throw new Error("Nie możesz odebrać sobie roli administratora.");
    }

    return transaction.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
  });
}
