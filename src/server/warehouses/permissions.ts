import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { requireCurrentWarehouse } from "./current-warehouse";
import type { WarehouseContext } from "./current-warehouse";
import {
  lockInstanceShared,
  requireAdminInTransaction,
  requireWarehouseAccessInTransaction,
} from "./transaction-lock";

export function canManageWarehouseData(context: WarehouseContext) {
  return context.access === "ADMIN" || context.access === "MANAGER";
}

export async function requireWarehouseDataManager() {
  const current = await requireCurrentWarehouse();
  if (!canManageWarehouseData(current)) {
    throw new Error("Tylko administrator lub menedżer tego magazynu może zarządzać danymi.");
  }
  return current;
}

export async function withWarehouseMutation<T>(
  context: WarehouseContext,
  managerOnly: boolean,
  operation: (
    transaction: Prisma.TransactionClient,
    current: Awaited<ReturnType<typeof requireWarehouseAccessInTransaction>>,
  ) => Promise<T>,
) {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    const current = await requireWarehouseAccessInTransaction(
      transaction,
      context.user.id,
      context.warehouse.id,
      managerOnly,
    );
    return operation(transaction, current);
  });
}

export async function withWarehouseRead<T>(
  context: WarehouseContext,
  operation: (
    transaction: Prisma.TransactionClient,
    current: Awaited<ReturnType<typeof requireWarehouseAccessInTransaction>>,
  ) => Promise<T>,
) {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    const current = await requireWarehouseAccessInTransaction(
      transaction,
      context.user.id,
      context.warehouse.id,
    );
    return operation(transaction, current);
  });
}

export async function withAdminRead<T>(
  userId: string,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    await requireAdminInTransaction(transaction, userId);
    return operation(transaction);
  });
}
