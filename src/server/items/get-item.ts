import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function getItem(itemId: number) {
    if (!Number.isInteger(itemId) || itemId <= 0) {
        throw new Error("Valid item ID is required");
    }

    const current = await requireCurrentWarehouse();
    const item = await withWarehouseRead(current, (transaction) => transaction.item.findFirst({
        where: { id: itemId, location: { warehouseId: current.warehouse.id } },
        select: {
            id: true,
            name: true,
            description: true,
            quantity: true,
            unit: true,
            barcode: true,
            locationId: true,
            location: {
                select: {
                    id: true,
                    name: true,
                }
            },
            categoryId: true,
            category: {
                where: { warehouseId: current.warehouse.id },
                select: {
                    id: true,
                    name: true,
                }
            },
            createdAt: true,
            updatedAt: true,
            imageUrl: true,
            isArchived: true,
            itemHistories: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    type: true,
                    oldValue: true,
                    newValue: true,
                    description: true,
                    createdAt: true,
                    actorName: true,
                },
            },
        },
    }));

    if (!item) {
        throw new Error("Item not found");
    }

    return { ...item, categoryId: item.category?.id ?? null };
}