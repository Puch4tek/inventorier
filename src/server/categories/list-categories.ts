import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      _count: {
        select: {
          items: true,
        },
      },
    },
  });
}
