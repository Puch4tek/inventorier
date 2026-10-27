import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export async function assertWarehouseDeletionIsIsolated(
  transaction: Prisma.TransactionClient,
  warehouseIds: string[],
) {
  const [externalChild, externalItem] = await Promise.all([
    transaction.location.findFirst({
      where: {
        warehouseId: { notIn: warehouseIds },
        parent: { warehouseId: { in: warehouseIds } },
      },
      select: { id: true },
    }),
    transaction.item.findFirst({
      where: {
        location: { warehouseId: { notIn: warehouseIds } },
        category: { warehouseId: { in: warehouseIds } },
      },
      select: { id: true },
    }),
  ]);

  if (externalChild || externalItem) {
    throw new Error("Nie można usunąć danych: istnieją nieprawidłowe powiązania między magazynami.");
  }
}
