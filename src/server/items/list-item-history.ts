import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function listItemHistory(itemId: number) {
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("Prawidłowe ID przedmiotu jest wymagane");
  }

  const current = await requireCurrentWarehouse();
  return withWarehouseRead(current, (transaction) => transaction.itemHistory.findMany({
    where: {
      itemId,
      item: { location: { warehouseId: current.warehouse.id } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      oldValue: true,
      newValue: true,
      description: true,
      createdAt: true,
      actorName: true,
      userId: true,
    },
  }));
}
