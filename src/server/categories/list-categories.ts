import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function listCategories() {
  const current = await requireCurrentWarehouse();
  return withWarehouseRead(current, (transaction) => transaction.category.findMany({
    where: { warehouseId: current.warehouse.id },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          items: { where: { location: { warehouseId: current.warehouse.id } } },
        },
      },
    },
  }));
}
