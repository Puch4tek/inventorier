import "server-only";

import { prisma } from "@/lib/db/prisma";

type CreateLocationInput = {
    name: string;
    description?: string;
    parentId?: number;
};

export async function createLocation(input: CreateLocationInput) {
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

    if (input.parentId !== undefined) {
        const parentLocation = await prisma.location.findUnique({
            where: {
                id: input.parentId,
            },
            select: {
                id: true,
            },
        });

        if (!parentLocation) {
            throw new Error("Parent location does not exist");
        }
    }

    return prisma.location.create({
        data: {
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
}
