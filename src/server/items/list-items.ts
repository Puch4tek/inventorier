import "server-only";

import { prisma } from "@/lib/db/prisma";

export type ListItemsOptions = {
    search?: string;
    locationId?: number;
    categoryId?: number | null;
    archived?: boolean;
    sortBy?: "name" | "quantity" | "updatedAt";
    sortDirection?: "asc" | "desc";
};

export async function listItems(options: ListItemsOptions = {}) {
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
        isArchived: archived,
        ...(locationId !== undefined ? { locationId } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
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
                    name: { contains: normalizedSearch, mode: "insensitive" as const },
                  },
                },
              ],
            }
          : {}),
    };

    return prisma.item.findMany({
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
    });
}