import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";

export async function deleteCategory(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Valid category ID is required");
  }

  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, async (transaction) => {
    const category = await transaction.category.findFirst({
      where: { id, warehouseId: current.warehouse.id },
      select: { id: true, _count: { select: { items: true } } },
    });

    if (!category) throw new Error("Category not found");
    if (category._count.items > 0) {
      throw new Error("Category has items and cannot be deleted");
    }

    return transaction.category.delete({ where: { id, warehouseId: current.warehouse.id } });
  });
}
