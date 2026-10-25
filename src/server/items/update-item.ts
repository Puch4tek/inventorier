import "server-only";

import { prisma } from "@/lib/db/prisma";

type ItemHistoryEntry = {
  type:
    | "ITEM_UPDATED"
    | "QUANTITY_CHANGED"
    | "LOCATION_CHANGED";
  oldValue: string | null;
  newValue: string | null;
  description: string;
};

export type UpdateItemInput = {
  userId: number;
  id: number;
  name?: string;
  description?: string | null;
  quantity?: number;
  unit?: string;
  locationId?: number;
  categoryId?: number | null;
  imageUrl?: string | null;
};

export async function updateItem(input: UpdateItemInput) {
  const { userId, id, name, description, quantity, unit, locationId, categoryId, imageUrl } =
    input;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Prawidłowy użytkownik jest wymagany");
  }
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Prawidłowe ID przedmiotu jest wymagane");
  }

  const existingItem = await prisma.item.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      quantity: true,
      unit: true,
      locationId: true,
      categoryId: true,
      imageUrl: true,
      isArchived: true,
    },
  });

  if (!existingItem) {
    throw new Error("Przedmiot nie istnieje");
  }
  if (existingItem.isArchived) {
    throw new Error("Nie można edytować zarchiwizowanego przedmiotu");
  }

  const data: {
    name?: string;
    description?: string | null;
    quantity?: number;
    unit?: string;
    locationId?: number;
    categoryId?: number | null;
    imageUrl?: string | null;
  } = {};

  if (name !== undefined) {
    const normalizedName = name.trim();
    if (!normalizedName) throw new Error("Nazwa jest wymagana");
    data.name = normalizedName;
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (quantity !== undefined) {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("Ilość musi być liczbą całkowitą nieujemną");
    }
    data.quantity = quantity;
  }
  if (unit !== undefined) {
    const normalizedUnit = unit.trim();
    if (!normalizedUnit) throw new Error("Jednostka jest wymagana");
    data.unit = normalizedUnit;
  }
  if (locationId !== undefined) {
    if (!Number.isInteger(locationId) || locationId <= 0) {
      throw new Error("Prawidłowe ID lokalizacji jest wymagane");
    }
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { id: true },
    });
    if (!location) throw new Error("Lokalizacja nie istnieje");
    data.locationId = locationId;
  }
  if (categoryId !== undefined) {
    if (categoryId !== null) {
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new Error("Prawidłowe ID kategorii jest wymagane");
      }
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });
      if (!category) throw new Error("Kategoria nie istnieje");
    }
    data.categoryId = categoryId;
  }
  if (imageUrl !== undefined) data.imageUrl = imageUrl?.trim() || null;

  const history: ItemHistoryEntry[] = [];
  if (data.name !== undefined && data.name !== existingItem.name) {
    history.push({ type: "ITEM_UPDATED", oldValue: existingItem.name, newValue: data.name, description: "Zmieniono nazwę" });
  }
  if (data.quantity !== undefined && data.quantity !== existingItem.quantity) {
    history.push({ type: "QUANTITY_CHANGED", oldValue: String(existingItem.quantity), newValue: String(data.quantity), description: "Zmieniono ilość" });
  }
  if (data.locationId !== undefined && data.locationId !== existingItem.locationId) {
    history.push({ type: "LOCATION_CHANGED", oldValue: String(existingItem.locationId), newValue: String(data.locationId), description: "Zmieniono lokalizację" });
  }
  if (data.description !== undefined && data.description !== existingItem.description) {
    history.push({ type: "ITEM_UPDATED", oldValue: existingItem.description, newValue: data.description, description: "Zmieniono opis" });
  }
  if (data.unit !== undefined && data.unit !== existingItem.unit) {
    history.push({ type: "ITEM_UPDATED", oldValue: existingItem.unit, newValue: data.unit, description: "Zmieniono jednostkę" });
  }
  if (data.categoryId !== undefined && data.categoryId !== existingItem.categoryId) {
    history.push({ type: "ITEM_UPDATED", oldValue: existingItem.categoryId?.toString() ?? null, newValue: data.categoryId?.toString() ?? null, description: "Zmieniono kategorię" });
  }

  return prisma.$transaction(async (transaction) => {
    const updatedItem = await transaction.item.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        quantity: true,
        unit: true,
        barcode: true,
        locationId: true,
        categoryId: true,
        imageUrl: true,
        isArchived: true,
        updatedAt: true,
      },
    });

    if (history.length > 0) {
      await transaction.itemHistory.createMany({
        data: history.map((entry) => ({ ...entry, itemId: id, userId })),
      });
    }

    return updatedItem;
  });
}
