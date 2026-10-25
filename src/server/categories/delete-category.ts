import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteCategory(id: number) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Valid category ID is required");
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { items: true } } },
  });

  if (!category) throw new Error("Category not found");
  if (category._count.items > 0) {
    throw new Error("Category has items and cannot be deleted");
  }

  return prisma.category.delete({ where: { id } });
}
