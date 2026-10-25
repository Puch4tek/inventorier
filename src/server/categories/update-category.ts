import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function updateCategory(input: {
  id: number;
  name: string;
  description?: string | null;
}) {
  if (!Number.isInteger(input.id) || input.id <= 0) {
    throw new Error("Valid category ID is required");
  }

  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");

  return prisma.category.update({
    where: { id: input.id },
    data: {
      name,
      description: input.description?.trim() || null,
    },
    select: { id: true, name: true, description: true, updatedAt: true },
  });
}
