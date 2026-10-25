import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getCategory(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Category ID is required");
  }

  return prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      items: {
        where: { isArchived: false },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          barcode: true,
          location: { select: { id: true, name: true } },
        },
      },
      _count: { select: { items: true } },
    },
  });
}
