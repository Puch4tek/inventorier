import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";

export async function deleteLocation(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("Location ID is required");

  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, async (transaction) => {
    const location = await transaction.location.findFirst({
      where: { id, warehouseId: current.warehouse.id },
      select: {
        id: true,
        _count: { select: { items: true, children: true } },
      },
    });
    if (!location) throw new Error("Location not found");
    if (location._count.items > 0 || location._count.children > 0) {
      throw new Error("Location has items or children");
    }
    return transaction.location.delete({
      where: { id, warehouseId: current.warehouse.id },
    });
  });
}
