import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export async function getLocation(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Location ID is required");
    }
    const current = await requireCurrentWarehouse();
    return withWarehouseRead(current, (transaction) => transaction.location.findFirst({
        where: { id, warehouseId: current.warehouse.id },
        select: {
            id: true,
            name: true,
            description: true,
            parent: {
                where: { warehouseId: current.warehouse.id },
                select: {
                    id: true,
                    name: true,
                },
            },
            children: {
                where: { warehouseId: current.warehouse.id },
                select: {
                    id: true,
                    name: true,
                },
                orderBy: {
                    name: "asc",
                },
            },
            items: {
                select: {
                    id: true,
                    name: true,
                    quantity: true,
                    unit: true,
                    barcode: true,
                },
                where: {
                    isArchived: false,
                },
                orderBy: {
                    name: "asc",
                },
            },
        },
    }));
}