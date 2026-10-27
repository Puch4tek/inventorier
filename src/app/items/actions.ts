"use server";

import { changeItemQuantity, changeItemQuantityByDelta } from "@/server/items/change-item-quantity";
import { createItem } from "@/server/items/create-item";
import { deleteItem } from "@/server/items/delete-item";
import { updateItem } from "@/server/items/update-item";
import { restoreItem } from "@/server/items/restore-item";

export type CreateItemState = { error?: string; success?: string };
export type ItemActionState = { error?: string; success?: string };

export async function createItemAction(
  _previousState: CreateItemState,
  formData: FormData,
): Promise<CreateItemState> {
  const name = formData.get("name");
  const description = formData.get("description");
  const quantityValue = formData.get("quantity");
  const unit = formData.get("unit");
  const locationIdValue = formData.get("locationId");
  const categoryIdValue = formData.get("categoryId");
  if (typeof name !== "string" || typeof unit !== "string" || typeof quantityValue !== "string" || typeof locationIdValue !== "string" || (categoryIdValue !== null && typeof categoryIdValue !== "string")) {
    return { error: "Nieprawidłowe dane wejściowe." };
  }
  const quantity = Number(quantityValue);
  const locationId = Number(locationIdValue);
  const categoryId = parseOptionalId(categoryIdValue);
  if (!Number.isInteger(quantity) || !Number.isInteger(locationId) || (categoryId !== null && !Number.isInteger(categoryId))) {
    return { error: "Ilość, lokalizacja i kategoria mają nieprawidłową wartość." };
  }
  try {
    await createItem({ name, description: typeof description === "string" ? description : undefined, quantity, unit, locationId, categoryId });
    return { success: "Przedmiot został utworzony." };
  } catch (error) {
    return toActionError(error, "Nie udało się utworzyć przedmiotu.");
  }
}

export async function updateItemAction(_previousState: ItemActionState, formData: FormData): Promise<ItemActionState> {
  const idValue = formData.get("id");
  const name = formData.get("name");
  const description = formData.get("description");
  const unit = formData.get("unit");
  const locationIdValue = formData.get("locationId");
  const categoryIdValue = formData.get("categoryId");
  if (typeof idValue !== "string" || typeof name !== "string" || typeof description !== "string" || typeof unit !== "string" || typeof locationIdValue !== "string" || (categoryIdValue !== null && typeof categoryIdValue !== "string")) {
    return { error: "Nieprawidłowe dane wejściowe." };
  }
  const id = Number(idValue);
  const locationId = Number(locationIdValue);
  const categoryId = parseOptionalId(categoryIdValue);
  if (!Number.isInteger(id) || !Number.isInteger(locationId) || (categoryId !== null && !Number.isInteger(categoryId))) {
    return { error: "Nieprawidłowa wartość liczby lub identyfikatora." };
  }
  try {
    await updateItem({ id, name, description, unit, locationId, categoryId });
    return { success: "Przedmiot został zaktualizowany." };
  } catch (error) {
    return toActionError(error, "Nie udało się zaktualizować przedmiotu.");
  }
}

export async function deleteItemAction(_previousState: ItemActionState, formData: FormData): Promise<ItemActionState> {
  const id = typeof formData.get("id") === "string" ? Number(formData.get("id")) : NaN;
  if (!Number.isInteger(id) || id <= 0) return { error: "Nieprawidłowe ID przedmiotu." };
  try {
    await deleteItem(id);
    return { success: "Przedmiot został zarchiwizowany." };
  } catch (error) {
    return toActionError(error, "Nie udało się zarchiwizować przedmiotu.");
  }
}

export async function restoreItemAction(
  _previousState: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const id =
    typeof formData.get("id") === "string"
      ? Number(formData.get("id"))
      : NaN;
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Nieprawidłowe ID przedmiotu." };
  }

  try {
    await restoreItem(id);
    return { success: "Przedmiot został przywrócony." };
  } catch (error) {
    return toActionError(error, "Nie udało się przywrócić przedmiotu.");
  }
}

export async function changeItemQuantityDirectAction(formData: FormData): Promise<ItemActionState> {
  const id = typeof formData.get("id") === "string" ? Number(formData.get("id")) : NaN;
  if (!Number.isInteger(id) || id <= 0) return { error: "Nieprawidłowe ID przedmiotu." };
  try {
    const deltaValue = formData.get("delta");
    if (typeof deltaValue === "string" && deltaValue.trim() !== "") {
      const delta = Number(deltaValue);
      if (!Number.isInteger(delta)) return { error: "Zmiana ilości musi być liczbą całkowitą." };
      await changeItemQuantityByDelta(id, delta);
    } else {
      const quantity = typeof formData.get("quantity") === "string" ? Number(formData.get("quantity")) : NaN;
      if (!Number.isInteger(quantity) || quantity < 0) return { error: "Ilość musi być liczbą całkowitą nieujemną." };
      await changeItemQuantity(id, quantity);
    }
    return { success: "Ilość została zmieniona." };
  } catch (error) {
    return toActionError(error, "Nie udało się zmienić ilości.");
  }
}

function parseOptionalId(value: FormDataEntryValue | null): number | null {
  return value === null || value === "" ? null : Number(value);
}

function toActionError(error: unknown, fallback: string): { error: string } {
  return { error: error instanceof Error ? error.message : fallback };
}
