import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export class WarehouseAccessError extends Error {}

// Shared operations acquire this before user, warehouse, membership, or item row locks.
export async function lockInstanceShared(transaction: Prisma.TransactionClient) {
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock_shared(1196573523, 1)::text`;
}

export async function lockInstanceMutation(transaction: Prisma.TransactionClient) {
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(1196573523, 1)::text`;
}

export async function requireActiveUserInTransaction(
  transaction: Prisma.TransactionClient,
  userId: string,
) {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      twoFactorEnabled: true,
    },
  });
  if (!user?.isActive || user.mustChangePassword || user.twoFactorEnabled) {
    throw new WarehouseAccessError("Musisz być zalogowany.");
  }
  return user;
}

export async function requireWarehouseAccessInTransaction(
  transaction: Prisma.TransactionClient,
  userId: string,
  warehouseId: string,
  managerOnly = false,
) {
  const user = await requireActiveUserInTransaction(transaction, userId);

  const warehouse = await transaction.warehouse.findUnique({
    where: { id: warehouseId },
    select: { id: true, name: true, slug: true },
  });
  if (!warehouse) throw new WarehouseAccessError("Magazyn nie istnieje.");

  if (user.role === "ADMIN") {
    return { user, warehouse, access: "ADMIN" as const };
  }

  const membership = await transaction.warehouseMember.findUnique({
    where: { userId_warehouseId: { userId, warehouseId } },
    select: { role: true },
  });
  if (!membership || (managerOnly && membership.role !== "MANAGER")) {
    throw new WarehouseAccessError("Nie masz uprawnień do tego magazynu.");
  }
  return { user, warehouse, access: membership.role };
}

export async function requireAdminInTransaction(
  transaction: Prisma.TransactionClient,
  userId: string,
) {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      mustChangePassword: true,
      twoFactorEnabled: true,
      role: true,
    },
  });
  if (
    !user?.isActive ||
    user.mustChangePassword ||
    user.twoFactorEnabled ||
    user.role !== "ADMIN"
  ) {
    throw new Error("Nie masz uprawnień do wykonania tej operacji.");
  }
  return user;
}
