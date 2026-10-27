import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";

export async function createCategory(input: {
  name: string;
  description?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");
  const current = await requireWarehouseDataManager();

  return withWarehouseMutation(current, true, (transaction) => transaction.category.create({
    data: {
      warehouseId: current.warehouse.id,
      name,
      description: input.description?.trim() || null,
    },
    select: { id: true, name: true, description: true },
  }));
}
