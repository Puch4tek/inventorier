import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function listItemHistory(itemId: number) {
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("Prawidłowe ID przedmiotu jest wymagane");
  }

  return prisma.itemHistory.findMany({
    where: { itemId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      oldValue: true,
      newValue: true,
      description: true,
      createdAt: true,
      user: {
        select: { id: true, name: true },
      },
    },
  });
}
