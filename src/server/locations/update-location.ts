import "server-only";

import { prisma } from "@/lib/db/prisma";

export type UpdateLocationInput = {
  id: number;
  name?: string;
  description?: string | null;
  parentId?: number | null;
};

export async function updateLocation(input: UpdateLocationInput) {
  const { id, name, description, parentId } = input;

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Valid location ID is required");
  }

  const existingLocation = await prisma.location.findUnique({
    where: { id },
    select: {
      id: true,
      parentId: true,
    },
  });

  if (!existingLocation) {
    throw new Error("Location not found");
  }

  const updateData: {
    name?: string;
    description?: string | null;
    parentId?: number | null;
  } = {};

  if (name !== undefined) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error("Location name is required");
    }

    updateData.name = normalizedName;
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  if (parentId !== undefined) {
    if (parentId !== null) {
      if (!Number.isInteger(parentId) || parentId <= 0) {
        throw new Error("Valid parent ID is required");
      }

      if (parentId === id) {
        throw new Error("A location cannot be its own parent");
      }

      const parentLocation = await prisma.location.findUnique({
        where: { id: parentId },
        select: {
          id: true,
          parentId: true,
        },
      });

      if (!parentLocation) {
        throw new Error("Parent location not found");
      }

      const visited = new Set<number>();
      let ancestorId: number | null = parentLocation.id;

      while (ancestorId !== null) {
        if (ancestorId === id) {
          throw new Error("This change would create a location cycle");
        }

        if (visited.has(ancestorId)) {
          throw new Error("Existing location cycle detected");
        }

        visited.add(ancestorId);

        const ancestor: { parentId: number | null } | null =
          await prisma.location.findUnique({
          where: { id: ancestorId },
          select: {
            parentId: true,
          },
        });

        ancestorId = ancestor?.parentId ?? null;
      }
    }

    updateData.parentId = parentId;
  }

  return prisma.location.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
