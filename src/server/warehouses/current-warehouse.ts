import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getCurrentSession } from "@/server/auth/get-current-user";
import type { WarehouseRole } from "@/generated/prisma/client";
import {
  lockInstanceShared,
  requireActiveUserInTransaction,
} from "./transaction-lock";

export const ACTIVE_WAREHOUSE_COOKIE = "active-warehouse-id";

export type WarehouseSummary = { id: string; name: string; slug: string };
export type WarehouseContext = {
  sessionId: string;
  user: { id: string; name: string; email: string; role: "USER" | "ADMIN" };
  warehouse: WarehouseSummary;
  access: "ADMIN" | WarehouseRole;
};

export async function listAccessibleWarehouses(): Promise<WarehouseSummary[]> {
  const active = await getCurrentSession();
  if (!active) return [];

  return prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    const activeUser = await requireActiveUserInTransaction(transaction, active.user.id, active.session.id);
    if (activeUser.role === "ADMIN") {
      return transaction.warehouse.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, slug: true },
      });
    }

    const memberships = await transaction.warehouseMember.findMany({
      where: { userId: activeUser.id },
      orderBy: { createdAt: "asc" },
      select: { warehouse: { select: { id: true, name: true, slug: true } } },
    });
    return memberships.map(({ warehouse }) => warehouse);
  });
}

export async function getCurrentWarehouse(): Promise<WarehouseContext | null> {
  const active = await getCurrentSession();
  if (!active) return null;

  const selectedId = (await cookies()).get(ACTIVE_WAREHOUSE_COOKIE)?.value;
  return prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    const activeUser = await requireActiveUserInTransaction(transaction, active.user.id, active.session.id);
    if (activeUser.role === "ADMIN") {
      const warehouses = await transaction.warehouse.findMany({
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, slug: true },
      });
      const warehouse = warehouses.find(({ id }) => id === selectedId) ?? warehouses[0];
      if (!warehouse) return null;
      return {
        sessionId: active.session.id,
        user: {
          id: activeUser.id,
          name: activeUser.name,
          email: activeUser.email,
          role: activeUser.role,
        },
        warehouse,
        access: "ADMIN" as const,
      };
    }

    const memberships = await transaction.warehouseMember.findMany({
      where: { userId: activeUser.id },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        warehouse: { select: { id: true, name: true, slug: true } },
      },
    });
    const membership = memberships.find(({ warehouse }) => warehouse.id === selectedId) ?? memberships[0];
    if (!membership) return null;

    return {
      sessionId: active.session.id,
      user: {
        id: activeUser.id,
        name: activeUser.name,
        email: activeUser.email,
        role: activeUser.role,
      },
      warehouse: membership.warehouse,
      access: membership.role,
    };
  });
}

export async function requireCurrentWarehouse(): Promise<WarehouseContext> {
  const current = await getCurrentWarehouse();
  if (!current) throw new Error("Nie znaleziono aktywnego magazynu.");
  return current;
}
