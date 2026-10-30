import "server-only";

import { prisma } from "@/lib/db/prisma";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { withWarehouseMutation } from "@/server/warehouses/permissions";
import { itemHistoryDescriptions } from "@/lib/items/history";

function validateId(itemId: number) {
  if (
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    throw new Error("Nieprawidłowy identyfikator");
  }
}

export async function changeItemQuantity(
  itemId: number,
  quantity: number,
) {
  validateId(itemId);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Nieprawidłowa ilość");
  }
  const current = await requireCurrentWarehouse();

  return withWarehouseMutation(current, false, async (transaction) => {
    const item = await getLockedItem(transaction, itemId, current.warehouse.id);
    if (item.quantity === quantity) return item;

    return updateQuantityInTransaction(
      transaction,
      item.id,
      current.user.id,
      current.user.name,
      item.quantity,
      quantity,
      current.warehouse.id,
    );
  });
}

export async function changeItemQuantityByDelta(
  itemId: number,
  delta: number,
) {
  validateId(itemId);
  if (!Number.isInteger(delta)) {
    throw new Error("Zmiana ilości musi być liczbą całkowitą");
  }
  const current = await requireCurrentWarehouse();

  return withWarehouseMutation(current, false, async (transaction) => {
    const item = await getLockedItem(transaction, itemId, current.warehouse.id);

    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 0) {
      throw new Error("Ilość nie może być mniejsza niż zero");
    }
    if (item.quantity === nextQuantity) return item;

    return updateQuantityInTransaction(
      transaction,
      item.id,
      current.user.id,
      current.user.name,
      item.quantity,
      nextQuantity,
      current.warehouse.id,
    );
  });
}

async function getLockedItem(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  itemId: number,
  warehouseId: string,
) {
  const [item] = await transaction.$queryRaw<{ id: number; quantity: number; isArchived: boolean }[]>`
    SELECT item."id", item."quantity", item."isArchived"
    FROM "Item" AS item
    JOIN "Location" AS location ON location."id" = item."locationId"
    WHERE item."id" = ${itemId} AND location."warehouseId" = ${warehouseId}
    FOR UPDATE OF item
  `;
  if (!item) throw new Error("Przedmiot nie istnieje");
  if (item.isArchived) throw new Error("Nie można zmienić ilości zarchiwizowanego przedmiotu");
  return item;
}

async function updateQuantityInTransaction(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  itemId: number,
  userId: string,
  actorName: string,
  oldQuantity: number,
  newQuantity: number,
  warehouseId: string,
) {
  const updatedItem = await transaction.item.update({
    where: { id: itemId, location: { warehouseId } },
    data: { quantity: newQuantity },
    select: { id: true, quantity: true },
  });

  await transaction.itemHistory.create({
    data: {
      itemId,
      userId,
      actorName,
      type: "QUANTITY_CHANGED",
      oldValue: String(oldQuantity),
      newValue: String(newQuantity),
      description: itemHistoryDescriptions.quantityChanged,
    },
  });

  return updatedItem;
}
