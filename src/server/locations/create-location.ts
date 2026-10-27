import "server-only";

import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";

type CreateLocationInput = {
    name: string;
    description?: string;
    parentId?: number;
};

export async function createLocation(input: CreateLocationInput) {
    const current = await requireWarehouseDataManager();
    const name = input.name.trim();
    const description = input.description?.trim() || null;

    if (!name) {
        throw new Error("Location name is required");
    }

    if (
        input.parentId !== undefined &&
        (!Number.isInteger(input.parentId) || input.parentId <= 0)
    ) {
        throw new Error("Parent location ID must be a positive integer");
    }

    return withWarehouseMutation(current, true, async (transaction) => {
        if (input.parentId !== undefined) {
            const parentLocation = await transaction.location.findFirst({
                where: { id: input.parentId, warehouseId: current.warehouse.id },
                select: { id: true },
            });
            if (!parentLocation) throw new Error("Parent location does not exist");
        }

        return transaction.location.create({
        data: {
            warehouseId: current.warehouse.id,
            name,
            description,
            parentId: input.parentId ?? null,
        },
        select: {
            id: true,
            name: true,
            description: true,
            parentId: true,
            createdAt: true,
        },
        });
    });
}
