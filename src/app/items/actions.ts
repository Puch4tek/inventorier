"use server";

import { getTranslations } from "next-intl/server";
import { changeItemQuantity, changeItemQuantityByDelta } from "@/server/items/change-item-quantity";
import { createItem } from "@/server/items/create-item";
import { deleteItem } from "@/server/items/delete-item";
import { updateItem } from "@/server/items/update-item";
import { restoreItem } from "@/server/items/restore-item";
import { localizeItemActionError } from "@/lib/items/action-errors";

export type ItemActionState = { error?: string; success?: string };
export type CreateItemState = ItemActionState;

export async function createItemAction(
  _previousState: CreateItemState,
  formData: FormData,
): Promise<CreateItemState> {
  const t = await getTranslations("items");
  const name = formData.get("name");
  const description = formData.get("description");
  const quantityValue = formData.get("quantity");
  const unit = formData.get("unit");
  const locationIdValue = formData.get("locationId");
  const categoryIdValue = formData.get("categoryId");
  if (typeof name !== "string" || typeof unit !== "string" || typeof quantityValue !== "string" || typeof locationIdValue !== "string" || (categoryIdValue !== null && typeof categoryIdValue !== "string")) {
    return { error: t("errors.invalidInput") };
  }
  const quantity = Number(quantityValue);
  const locationId = Number(locationIdValue);
  const categoryId = parseOptionalId(categoryIdValue);
  if (!Number.isInteger(quantity) || !Number.isInteger(locationId) || (categoryId !== null && !Number.isInteger(categoryId))) {
    return { error: t("errors.invalidCreateNumbers") };
  }
  try {
    await createItem({ name, description: typeof description === "string" ? description : undefined, quantity, unit, locationId, categoryId });
    return { success: t("actions.createSuccess") };
  } catch (error) {
    return {
      error: localizeItemActionError(
        error,
        t("actions.createFailure"),
        t,
      ),
    };
  }
}

export async function updateItemAction(_previousState: ItemActionState, formData: FormData): Promise<ItemActionState> {
  const t = await getTranslations("items");
  const idValue = formData.get("id");
  const name = formData.get("name");
  const description = formData.get("description");
  const unit = formData.get("unit");
  const locationIdValue = formData.get("locationId");
  const categoryIdValue = formData.get("categoryId");
  if (typeof idValue !== "string" || typeof name !== "string" || typeof description !== "string" || typeof unit !== "string" || typeof locationIdValue !== "string" || (categoryIdValue !== null && typeof categoryIdValue !== "string")) {
    return { error: t("errors.invalidInput") };
  }
  const id = Number(idValue);
  const locationId = Number(locationIdValue);
  const categoryId = parseOptionalId(categoryIdValue);
  if (!Number.isInteger(id) || !Number.isInteger(locationId) || (categoryId !== null && !Number.isInteger(categoryId))) {
    return { error: t("errors.invalidNumber") };
  }
  try {
    await updateItem({ id, name, description, unit, locationId, categoryId });
    return { success: t("actions.updateSuccess") };
  } catch (error) {
    return {
      error: localizeItemActionError(
        error,
        t("actions.updateFailure"),
        t,
      ),
    };
  }
}

export async function deleteItemAction(_previousState: ItemActionState, formData: FormData): Promise<ItemActionState> {
  const t = await getTranslations("items");
  const id = parsePositiveItemId(formData.get("id"));
  if (id === null) return { error: t("errors.invalidId") };
  try {
    await deleteItem(id);
    return { success: t("actions.archiveSuccess") };
  } catch (error) {
    return {
      error: localizeItemActionError(
        error,
        t("actions.archiveFailure"),
        t,
      ),
    };
  }
}

export async function restoreItemAction(
  _previousState: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const t = await getTranslations("items");
  const id = parsePositiveItemId(formData.get("id"));
  if (id === null) {
    return { error: t("errors.invalidId") };
  }

  try {
    await restoreItem(id);
    return { success: t("actions.restoreSuccess") };
  } catch (error) {
    return {
      error: localizeItemActionError(
        error,
        t("actions.restoreFailure"),
        t,
      ),
    };
  }
}

export async function changeItemQuantityDirectAction(formData: FormData): Promise<ItemActionState> {
  const t = await getTranslations("items");
  const id = parsePositiveItemId(formData.get("id"));
  if (id === null) return { error: t("errors.invalidId") };
  try {
    const deltaValue = formData.get("delta");
    if (typeof deltaValue === "string" && deltaValue.trim() !== "") {
      const delta = Number(deltaValue);
      if (!Number.isInteger(delta)) return { error: t("errors.deltaMustBeInteger") };
      await changeItemQuantityByDelta(id, delta);
    } else {
      const quantity = typeof formData.get("quantity") === "string" ? Number(formData.get("quantity")) : NaN;
      if (!Number.isInteger(quantity) || quantity < 0) return { error: t("errors.quantityMustBeNonnegativeInteger") };
      await changeItemQuantity(id, quantity);
    }
    return { success: t("actions.quantitySuccess") };
  } catch (error) {
    return {
      error: localizeItemActionError(
        error,
        t("actions.quantityFailure"),
        t,
      ),
    };
  }
}

function parseOptionalId(value: FormDataEntryValue | null): number | null {
  return value === null || value === "" ? null : Number(value);
}

function parsePositiveItemId(value: FormDataEntryValue | null): number | null {
  const id = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}
