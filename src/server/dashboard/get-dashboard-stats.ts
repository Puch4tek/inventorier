import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function getDashboardStats() {
  const current = await requireCurrentWarehouse();
  const warehouseId = current.warehouse.id;
  const [
    activeItems,
    archivedItems,
    locations,
    categories,
    quantities,
    uncategorizedItems,
    recentItems,
  ] = await withWarehouseRead(current, (transaction) => Promise.all([
    transaction.item.count({ where: { isArchived: false, location: { warehouseId } } }),
    transaction.item.count({ where: { isArchived: true, location: { warehouseId } } }),
    transaction.location.count({ where: { warehouseId } }),
    transaction.category.count({ where: { warehouseId } }),
    transaction.item.groupBy({
      by: ["unit"],
      where: { isArchived: false, location: { warehouseId } },
      _sum: { quantity: true },
      orderBy: { unit: "asc" },
    }),
    transaction.item.count({
      where: { isArchived: false, categoryId: null, location: { warehouseId } },
    }),
    transaction.item.findMany({
      where: { isArchived: false, location: { warehouseId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true,
        createdAt: true,
        location: { select: { name: true } },
        category: { where: { warehouseId }, select: { name: true } },
      },
    }),
  ]));

  return {
    counts: {
      activeItems,
      archivedItems,
      locations,
      categories,
      uncategorizedItems,
    },
    quantities: quantities.map(({ unit, _sum }) => ({ unit, quantity: _sum.quantity ?? 0 })),
    recentItems,
  };
}
