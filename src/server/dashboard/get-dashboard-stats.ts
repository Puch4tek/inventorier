import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function getDashboardStats() {
  const [
    activeItems,
    archivedItems,
    locations,
    categories,
    quantity,
    uncategorizedItems,
    recentItems,
  ] = await Promise.all([
    prisma.item.count({ where: { isArchived: false } }),
    prisma.item.count({ where: { isArchived: true } }),
    prisma.location.count(),
    prisma.category.count(),
    prisma.item.aggregate({
      where: { isArchived: false },
      _sum: { quantity: true },
    }),
    prisma.item.count({
      where: { isArchived: false, categoryId: null },
    }),
    prisma.item.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        quantity: true,
        unit: true,
        createdAt: true,
        location: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
  ]);

  return {
    counts: {
      activeItems,
      archivedItems,
      locations,
      categories,
      totalQuantity: quantity._sum.quantity ?? 0,
      uncategorizedItems,
    },
    recentItems,
  };
}
