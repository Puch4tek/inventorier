import "server-only";

import { prisma } from "@/lib/db/prisma";

function validateIds(itemId: number, userId: number) {
  if (
    !Number.isInteger(itemId) ||
    itemId <= 0 ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    throw new Error("Nieprawidłowy identyfikator");
  }
}

export async function changeItemQuantity(
  itemId: number,
  userId: number,
  quantity: number,
) {
  validateIds(itemId, userId);
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("Nieprawidłowa ilość");
  }

  return prisma.$transaction(async (transaction) => {
    const item = await transaction.item.findUnique({
      where: { id: itemId },
      select: { id: true, quantity: true, isArchived: true },
    });

    if (!item) throw new Error("Przedmiot nie istnieje");
    if (item.isArchived) {
      throw new Error("Nie można zmienić ilości zarchiwizowanego przedmiotu");
    }
    if (item.quantity === quantity) return item;

    return updateQuantityInTransaction(
      transaction,
      item.id,
      userId,
      item.quantity,
      quantity,
    );
  });
}

export async function changeItemQuantityByDelta(
  itemId: number,
  userId: number,
  delta: number,
) {
  validateIds(itemId, userId);
  if (!Number.isInteger(delta)) {
    throw new Error("Zmiana ilości musi być liczbą całkowitą");
  }

  return prisma.$transaction(async (transaction) => {
    const item = await transaction.item.findUnique({
      where: { id: itemId },
      select: { id: true, quantity: true, isArchived: true },
    });

    if (!item) throw new Error("Przedmiot nie istnieje");
    if (item.isArchived) {
      throw new Error("Nie można zmienić ilości zarchiwizowanego przedmiotu");
    }

    const nextQuantity = item.quantity + delta;
    if (nextQuantity < 0) {
      throw new Error("Ilość nie może być mniejsza niż zero");
    }

    return updateQuantityInTransaction(
      transaction,
      item.id,
      userId,
      item.quantity,
      nextQuantity,
    );
  });
}

async function updateQuantityInTransaction(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  itemId: number,
  userId: number,
  oldQuantity: number,
  newQuantity: number,
) {
  const updatedItem = await transaction.item.update({
    where: { id: itemId },
    data: { quantity: newQuantity },
    select: { id: true, quantity: true },
  });

  await transaction.itemHistory.create({
    data: {
      itemId,
      userId,
      type: "QUANTITY_CHANGED",
      oldValue: String(oldQuantity),
      newValue: String(newQuantity),
      description: "Zmieniono ilość",
    },
  });

  return updatedItem;
}
