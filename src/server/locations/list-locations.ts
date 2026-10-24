import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function listLocations() {
  return prisma.location.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      createdAt: true,
      _count: {
        select: {
          items: true,
          children: true,
        },
      },
    },
  });
}
