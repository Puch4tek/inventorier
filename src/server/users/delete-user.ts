import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteUser(userId: number, currentUserId: number) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (userId === currentUserId) {
    throw new Error("Nie możesz usunąć własnego konta.");
  }

  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new Error("Użytkownik nie istnieje.");
    }

    if (user.role === "ADMIN") {
      const adminCount = await transaction.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new Error("W systemie musi pozostać przynajmniej jeden administrator.");
      }
    }

    await transaction.session.deleteMany({ where: { userId } });
    await transaction.itemHistory.deleteMany({ where: { userId } });
    await transaction.user.delete({ where: { id: userId } });
  });
}

