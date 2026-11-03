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

export async function requireAdminSessionInTransaction(
  transaction: Prisma.TransactionClient,
  actorId: string,
  sessionId: string,
) {
  await requireAdminInTransaction(transaction, actorId, sessionId);
}

async function lockActiveSession(transaction: Prisma.TransactionClient, userId: string, sessionId: string) {
  const sessions = await transaction.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "session"
    WHERE "id" = ${sessionId} AND "userId" = ${userId}
    FOR SHARE
  `;
  if (sessions.length !== 1) return false;
  const session = await transaction.session.findFirst({
    where: { id: sessionId, userId, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return session !== null;
}

export async function requireActiveUserInTransaction(
  transaction: Prisma.TransactionClient,
  userId: string,
  sessionId: string,
) {
  if (!(await lockActiveSession(transaction, userId, sessionId))) {
    throw new WarehouseAccessError("Musisz być zalogowany.");
  }
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
    },
  });
  if (!user?.isActive || user.mustChangePassword) {
    throw new WarehouseAccessError("Musisz być zalogowany.");
  }
  return user;
}

export async function requireWarehouseAccessInTransaction(
  transaction: Prisma.TransactionClient,
  userId: string,
  sessionId: string,
  warehouseId: string,
  managerOnly = false,
) {
  const user = await requireActiveUserInTransaction(transaction, userId, sessionId);

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
  sessionId: string,
) {
  if (!(await lockActiveSession(transaction, userId, sessionId))) {
    throw new Error("Nie masz uprawnień do wykonania tej operacji.");
  }
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isActive: true,
      mustChangePassword: true,
      role: true,
    },
  });
  if (
    !user?.isActive ||
    user.mustChangePassword ||
    user.role !== "ADMIN"
  ) {
    throw new Error("Nie masz uprawnień do wykonania tej operacji.");
  }
  return user;
}
