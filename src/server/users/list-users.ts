import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}
