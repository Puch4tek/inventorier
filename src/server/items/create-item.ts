import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getLocation } from "@/server/locations/get-location";
import { generateBarcode } from "./generate-barcode";

export type CreateItemInput = {
    userId: number;
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    locationId: number;
    categoryId?: number | null;
    imageUrl?: string;
}

export async function createItem(input: CreateItemInput) {
    const { userId, name, description, quantity, unit, locationId, categoryId, imageUrl } = input;

    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error("Prawidłowy użytkownik jest wymagany");
    }

    if (typeof name !== "string" || !name.trim()) {
        throw new Error("Nazwa jest wymagana");
    }
    const normalizedName = name.trim();

    if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error("Ilość musi być dodatnia");
    }

    if (description !== undefined && typeof description !== "string") {
        throw new Error("Opis musi być tekstem");
    }
    const normalizedDescription = description?.trim() || null;

    if (typeof unit !== "string" || !unit.trim()) {
        throw new Error("Jednostka jest wymagana");
    }
    const normalizedUnit = unit.trim();

    if (!Number.isInteger(locationId) || typeof locationId !== "number" || locationId < 1) {
        throw new Error("ID lokalizacji musi być liczbą dodatnią");
    }

    if (
        categoryId !== undefined &&
        categoryId !== null &&
        (!Number.isInteger(categoryId) || categoryId < 1)
    ) {
        throw new Error("ID kategorii musi być liczbą dodatnią");
    }
    const location = await getLocation(locationId);
    if (!location) {
        throw new Error("Lokalizacja nie istnieje");
    }

    if (categoryId !== undefined && categoryId !== null) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true },
        });
        if (!category) {
            throw new Error("Kategoria nie istnieje");
        }
    }

    // Zaimplementuj handling dla imageUrl, jeśli jest wymagane dodatkowe sprawdzenie

    const barcode = generateBarcode();

    return prisma.$transaction(async (transaction) => {
        const item = await transaction.item.create({
            data: {
                name: normalizedName,
                description: normalizedDescription,
                barcode,
                quantity,
                unit: normalizedUnit,
                locationId,
                categoryId: categoryId ?? null,
                imageUrl: imageUrl?.trim() || null,
            },
            select: {
                id: true,
                name: true,
                description: true,
                quantity: true,
                unit: true,
                locationId: true,
                categoryId: true,
                imageUrl: true,
                barcode: true,
            },
        });

        await transaction.itemHistory.create({
            data: {
                itemId: item.id,
                userId,
                type: "ITEM_CREATED",
                description: "Utworzono przedmiot",
            },
        });

        return item;
    });
}