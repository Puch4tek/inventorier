import "server-only";

import type { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function updateUserRole(
  userId: number,
  role: Role,
  currentUserId: number,
) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Nieprawidłowy użytkownik.");
  }
  if (!["USER", "MANAGER", "ADMIN"].includes(role)) {
    throw new Error("Nieprawidłowa rola.");
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) {
    throw new Error("Użytkownik nie istnieje.");
  }

  if (target.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("W systemie musi pozostać przynajmniej jeden administrator.");
    }
  }

  if (target.id === currentUserId && role !== "ADMIN") {
    throw new Error("Nie możesz odebrać sobie roli administratora.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, role: true },
  });
}

