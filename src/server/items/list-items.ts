import "server-only";

import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseRead } from "@/server/warehouses/permissions";

export type ListItemsOptions = {
    search?: string;
    locationId?: number;
    categoryId?: number | null;
    archived?: boolean;
    sortBy?: "name" | "quantity" | "updatedAt";
    sortDirection?: "asc" | "desc";
};

export async function listItems(options: ListItemsOptions = {}) {
    const current = await requireCurrentWarehouse();
    const {
        search,
        locationId,
        categoryId,
        archived = false,
        sortBy = "name",
        sortDirection = "asc",
    } = options;

    const normalizedSearch = search?.trim();
    const where = {
        location: { warehouseId: current.warehouse.id },
        isArchived: archived,
        ...(locationId !== undefined ? { locationId } : {}),
        ...(categoryId === null
          ? { categoryId: null }
          : categoryId !== undefined
            ? { category: { id: categoryId, warehouseId: current.warehouse.id } }
            : {}),
        ...(normalizedSearch
          ? {
              OR: [
                { name: { contains: normalizedSearch, mode: "insensitive" as const } },
                { barcode: { contains: normalizedSearch, mode: "insensitive" as const } },
                { description: { contains: normalizedSearch, mode: "insensitive" as const } },
                {
                  location: {
                    name: { contains: normalizedSearch, mode: "insensitive" as const },
                  },
                },
                {
                  category: {
                    warehouseId: current.warehouse.id,
                    name: { contains: normalizedSearch, mode: "insensitive" as const },
                  },
                },
              ],
            }
          : {}),
    };

    const items = await withWarehouseRead(current, (transaction) => transaction.item.findMany({
        where,
        orderBy: {
          [sortBy]: sortDirection,
        },
        select: {
            id: true,
            name: true,
            quantity: true,
            unit: true,
            description: true,
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
            isArchived: true,
            createdAt: true,
            updatedAt: true,
            imageUrl: true,
        },
    }));

    return items.map((item) => ({ ...item, categoryId: item.category?.id ?? null }));
}