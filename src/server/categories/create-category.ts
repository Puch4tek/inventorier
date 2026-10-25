import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function createCategory(input: {
  name: string;
  description?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Category name is required");

  return prisma.category.create({
    data: {
      name,
      description: input.description?.trim() || null,
    },
    select: { id: true, name: true, description: true },
  });
}
