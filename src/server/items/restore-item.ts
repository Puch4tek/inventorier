import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";
import { itemHistoryDescriptions } from "@/lib/items/history";

export async function restoreItem(id: number) {
  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error("Prawidłowe ID przedmiotu jest wymagane");
  }

  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, async (transaction) => {
    const item = await transaction.item.findFirst({
      where: { id, location: { warehouseId: current.warehouse.id } },
      select: { id: true, isArchived: true },
    });
    if (!item) throw new Error("Przedmiot nie istnieje");
    if (!item.isArchived) throw new Error("Przedmiot jest już aktywny");

    const restoredItem = await transaction.item.update({
      where: { id, location: { warehouseId: current.warehouse.id } },
      data: { isArchived: false },
      select: { id: true, isArchived: true },
    });

    await transaction.itemHistory.create({
      data: {
        itemId: id,
        userId: current.user.id,
        actorName: current.user.name,
        type: "ITEM_RESTORED",
        description: itemHistoryDescriptions.restored,
      },
    });

    return restoredItem;
  });
}
