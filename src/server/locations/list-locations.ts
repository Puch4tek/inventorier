import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function listLocations() {
  const current = await requireCurrentWarehouse();
  const locations = await withWarehouseRead(current, (transaction) => transaction.location.findMany({
    where: { warehouseId: current.warehouse.id },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      parent: {
        where: { warehouseId: current.warehouse.id },
        select: { id: true },
      },
      createdAt: true,
      _count: {
        select: {
          items: true,
          children: { where: { warehouseId: current.warehouse.id } },
        },
      },
    },
  }));

  return locations.map(({ parent, ...location }) => ({
    ...location,
    parentId: parent?.id ?? null,
  }));
}
