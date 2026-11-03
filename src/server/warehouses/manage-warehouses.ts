import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import type { WarehouseRole } from "@/generated/prisma/client";
import { requireCurrentSession } from "@/server/auth/get-current-user";
import { ACTIVE_WAREHOUSE_COOKIE } from "./current-warehouse";
import { assertWarehouseDeletionIsIsolated } from "./check-isolation";
import {
  lockInstanceShared,
  lockInstanceMutation,
  requireAdminInTransaction,
  requireWarehouseAccessInTransaction,
} from "./transaction-lock";

function createSlug(name: string) {
  return `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "magazyn"}-${randomUUID().slice(0, 8)}`;
}

function normalizeWarehouseName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  if (normalized.length < 2 || normalized.length > 100) {
    throw new Error("Nazwa magazynu musi mieć od 2 do 100 znaków.");
  }
  return normalized;
}

export async function createWarehouse(name: string) {
  const actor = await requireCurrentSession();
  const normalizedName = normalizeWarehouseName(name);
  return prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actor.user.id, actor.session.id);
    return transaction.warehouse.create({
      data: {
        id: randomUUID(),
        name: normalizedName,
        slug: createSlug(normalizedName),
      },
      select: { id: true, name: true, slug: true },
    });
  });
}

export async function deleteWarehouse(
  warehouseId: string,
  confirmationName: string,
) {
  const actor = await requireCurrentSession();
  if (!warehouseId) throw new Error("Nieprawidłowy magazyn.");

  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    await requireAdminInTransaction(transaction, actor.user.id, actor.session.id);

    const warehouse = await transaction.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true, name: true },
    });
    if (!warehouse) throw new Error("Magazyn nie istnieje.");
    if (warehouse.name !== confirmationName.trim()) {
      throw new Error("Wpisz dokładną nazwę magazynu, aby potwierdzić usunięcie.");
    }

    if (await transaction.warehouse.count() <= 1) {
      throw new Error("Nie można usunąć ostatniego magazynu.");
    }

    await assertWarehouseDeletionIsIsolated(transaction, [warehouseId]);
    const locations = await transaction.location.findMany({
      where: { warehouseId },
      select: { id: true },
    });
    const locationIds = locations.map(({ id }) => id);
    if (locationIds.length) {
      const items = await transaction.item.findMany({
        where: { locationId: { in: locationIds } },
        select: { id: true },
      });
      const itemIds = items.map(({ id }) => id);
      if (itemIds.length) {
        await transaction.itemHistory.deleteMany({
          where: { itemId: { in: itemIds } },
        });
        await transaction.item.deleteMany({
          where: { id: { in: itemIds }, location: { warehouseId } },
        });
      }
      await transaction.location.deleteMany({
        where: { id: { in: locationIds }, warehouseId },
      });
    }
    await transaction.category.deleteMany({ where: { warehouseId } });
    await transaction.warehouse.delete({ where: { id: warehouseId } });
  });

  const cookieStore = await cookies();
  if (cookieStore.get(ACTIVE_WAREHOUSE_COOKIE)?.value === warehouseId) {
    cookieStore.delete(ACTIVE_WAREHOUSE_COOKIE);
  }
}

export async function getWarehouseAccessManagement(warehouseId: string) {
  const actor = await requireCurrentSession();
  if (!warehouseId) throw new Error("Nieprawidłowy magazyn.");

  return prisma.$transaction(async (transaction) => {
    await lockInstanceShared(transaction);
    const current = await requireWarehouseAccessInTransaction(
      transaction,
      actor.user.id,
      actor.session.id,
      warehouseId,
      true,
    );
    const users = await transaction.user.findMany({
      orderBy: [{ role: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: true,
        warehouseMemberships: {
          where: { warehouseId },
          select: { role: true },
        },
      },
    });

    return {
      warehouse: current.warehouse,
      users: users.map(({ role: globalRole, warehouseMemberships, ...user }) => ({
        ...user,
        globalRole,
        warehouseRole: globalRole === "ADMIN" ? null : warehouseMemberships[0]?.role ?? null,
      })),
    };
  });
}

export async function setWarehouseMemberRole(
  warehouseId: string,
  userId: string,
  role: WarehouseRole,
) {
  if (!["USER", "MANAGER"].includes(role)) throw new Error("Nieprawidłowa rola magazynowa.");
  const actor = await requireCurrentSession();

  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    const access = await requireWarehouseAccessInTransaction(
      transaction,
      actor.user.id,
      actor.session.id,
      warehouseId,
      true,
    );
    if (access.access !== "ADMIN" && userId === actor.user.id) {
      throw new Error("Menedżer nie może zmienić własnego przypisania.");
    }

    const target = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) throw new Error("Użytkownik nie istnieje.");
    if (target.role === "ADMIN") {
      throw new Error("Nie można zarządzać przypisaniem globalnego administratora.");
    }

    await transaction.warehouseMember.upsert({
      where: { userId_warehouseId: { userId, warehouseId } },
      update: { role },
      create: { id: randomUUID(), userId, warehouseId, role },
    });
  });
}

export async function removeWarehouseMember(warehouseId: string, userId: string) {
  const actor = await requireCurrentSession();
  await prisma.$transaction(async (transaction) => {
    await lockInstanceMutation(transaction);
    const access = await requireWarehouseAccessInTransaction(
      transaction,
      actor.user.id,
      actor.session.id,
      warehouseId,
      true,
    );
    if (access.access !== "ADMIN" && userId === actor.user.id) {
      throw new Error("Menedżer nie może odebrać sobie własnego przypisania.");
    }

    const target = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!target) throw new Error("Użytkownik nie istnieje.");
    if (target.role === "ADMIN") {
      throw new Error("Nie można zarządzać przypisaniem globalnego administratora.");
    }

    const result = await transaction.warehouseMember.deleteMany({
      where: { userId, warehouseId },
    });
    if (result.count !== 1) throw new Error("Użytkownik nie ma przypisania do tego magazynu.");
  });
}
