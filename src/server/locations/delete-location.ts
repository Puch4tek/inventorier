import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteLocation(id: number) {

    const location = await prisma.location.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    items: true,
                    children: true,
                },
            },
        },
    })
    if (!location) {
        throw new Error("Location not found");
    }
    if (location._count.items > 0 || location._count.children > 0) {
        throw new Error("Location has items or children");
    }
    return prisma.location.delete({ where: { id } });
}