import "server-only";

import { generateBarcode } from "./generate-barcode";
import { requireWarehouseDataManager, withWarehouseMutation } from "@/server/warehouses/permissions";
import { Prisma } from "@/generated/prisma/client";
import { itemHistoryDescriptions } from "@/lib/items/history";

export type CreateItemInput = {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    locationId: number;
    categoryId?: number | null;
    imageUrl?: string;
}

export async function createItem(input: CreateItemInput) {
    const current = await requireWarehouseDataManager();
    const { name, description, quantity, unit, locationId, categoryId, imageUrl } = input;

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
    // Zaimplementuj handling dla imageUrl, jeśli jest wymagane dodatkowe sprawdzenie

    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            return await withWarehouseMutation(current, true, async (transaction) => {
                const location = await transaction.location.findFirst({
                    where: { id: locationId, warehouseId: current.warehouse.id },
                    select: { id: true },
                });
                if (!location) throw new Error("Lokalizacja nie istnieje");

                if (categoryId !== undefined && categoryId !== null) {
                    const category = await transaction.category.findFirst({
                        where: { id: categoryId, warehouseId: current.warehouse.id },
                        select: { id: true },
                    });
                    if (!category) throw new Error("Kategoria nie istnieje");
                }

                const item = await transaction.item.create({
                    data: {
                        name: normalizedName,
                        description: normalizedDescription,
                        barcode: generateBarcode(),
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
                        userId: current.user.id,
                        actorName: current.user.name,
                        type: "ITEM_CREATED",
                        description: itemHistoryDescriptions.created,
                    },
                });

                return item;
            });
        } catch (error) {
            if (!isBarcodeCollision(error)) throw error;
            if (attempt === 9) {
                throw new Error("Nie udało się wygenerować unikalnego kodu kreskowego po 10 próbach.", { cause: error });
            }
        }
    }
    throw new Error("Nie udało się wygenerować kodu kreskowego.");
}

function isBarcodeCollision(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002" || error.meta?.modelName !== "Item") return false;
    const adapterError = error.meta?.driverAdapterError;
    if (typeof adapterError !== "object" || adapterError === null || !("cause" in adapterError)) return false;
    const cause = adapterError.cause;
    if (typeof cause !== "object" || cause === null || !("kind" in cause) || cause.kind !== "UniqueConstraintViolation" || !("constraint" in cause)) return false;
    const constraint = cause.constraint;
    return typeof constraint === "object" && constraint !== null &&
        "index" in constraint && constraint.index === "Item_barcode_key";
}