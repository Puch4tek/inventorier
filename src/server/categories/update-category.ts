import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";

export async function updateCategory(input: {
  id: number;
  name: string;
  description?: string | null;
}) {
  if (!Number.isInteger(input.id) || input.id <= 0) {
    throw new Error("Valid category ID is required");
  }

  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");

  const current = await requireWarehouseDataManager();
  return withWarehouseMutation(current, true, async (transaction) => {
    const category = await transaction.category.findFirst({
      where: { id: input.id, warehouseId: current.warehouse.id },
      select: { id: true },
    });
    if (!category) throw new Error("Category not found");
    return transaction.category.update({
      where: { id: category.id, warehouseId: current.warehouse.id },
    data: {
      name,
      description: input.description?.trim() || null,
    },
    select: { id: true, name: true, description: true, updatedAt: true },
    });
  });
}
