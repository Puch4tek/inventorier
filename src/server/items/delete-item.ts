import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteItem(id: number, userId: number) {
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(userId) || userId <= 0) {
    throw new Error("Prawidłowe ID przedmiotu jest wymagane");
  }

  const item = await prisma.item.findUnique({
    where: { id },
    select: { id: true, isArchived: true },
  });

  if (!item) throw new Error("Przedmiot nie istnieje");
  if (item.isArchived) throw new Error("Przedmiot jest już zarchiwizowany");

  return prisma.$transaction(async (transaction) => {
    const archivedItem = await transaction.item.update({
      where: { id },
      data: { isArchived: true },
      select: { id: true, isArchived: true },
    });
    await transaction.itemHistory.create({
      data: {
        itemId: id,
        userId,
        type: "ITEM_ARCHIVED",
        description: "Zarchiwizowano przedmiot",
      },
    });
    return archivedItem;
  });
}
