import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function getCategory(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Category ID is required");
  }

  const current = await requireCurrentWarehouse();
  return withWarehouseRead(current, (transaction) => transaction.category.findFirst({
    where: { id, warehouseId: current.warehouse.id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      items: {
        where: { isArchived: false, location: { warehouseId: current.warehouse.id } },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          barcode: true,
          location: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { items: { where: { location: { warehouseId: current.warehouse.id } } } },
      },
    },
  }));
}
