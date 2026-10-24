import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getLocation(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Location ID is required");
    }
    return prisma.location.findUnique({
        where: {
            id: id,
        },
        select: {
            id: true,
            name: true,
            description: true,
            parent: {
                select: {
                    id: true,
                    name: true,
                },
            },
            children: {
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
    });
}