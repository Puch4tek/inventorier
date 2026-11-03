import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { WarehouseContext } from "@/server/warehouses/current-warehouse";
import { itemHistoryDescriptions } from "@/lib/items/history";

export async function setItemArchivedInTransaction(
  transaction: Prisma.TransactionClient,
  current: WarehouseContext,
  id: number,
  archived: boolean,
) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Prawidłowe ID przedmiotu jest wymagane");
  }

  const item = await transaction.item.findFirst({
    where: { id, location: { warehouseId: current.warehouse.id } },
    select: { id: true, isArchived: true },
  });
  if (!item) throw new Error("Przedmiot nie istnieje");
  if (item.isArchived === archived) {
    throw new Error(archived ? "Przedmiot jest już zarchiwizowany" : "Przedmiot jest już aktywny");
  }

  const updatedItem = await transaction.item.update({
    where: { id, location: { warehouseId: current.warehouse.id } },
    data: { isArchived: archived },
    select: { id: true, isArchived: true },
  });
  await transaction.itemHistory.create({
    data: {
      itemId: id,
      userId: current.user.id,
      actorName: current.user.name,
      type: archived ? "ITEM_ARCHIVED" : "ITEM_RESTORED",
      description: archived ? itemHistoryDescriptions.archived : itemHistoryDescriptions.restored,
    },
  });
  return updatedItem;
}
