import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getItem(itemId: number) {
    if (!Number.isInteger(itemId) || itemId <= 0) {
        throw new Error("Valid item ID is required");
    }

    const item = await prisma.item.findUnique({
        where: {
            id: itemId,
        },
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
                    user: {
                        select: { id: true, name: true },
                    },
                },
            },
        },
    });

    if (!item) {
        throw new Error("Item not found");
    }

    return item;
}