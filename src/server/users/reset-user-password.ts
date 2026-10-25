import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

export async function resetUserPassword(userId: number, password: string) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (password.length < 8) {
    throw new Error("Hasło musi mieć co najmniej 8 znaków.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.updateMany({
    where: { id: userId },
    data: { passwordHash },
  });

  if (user.count !== 1) {
    throw new Error("Użytkownik nie istnieje.");
  }
}

