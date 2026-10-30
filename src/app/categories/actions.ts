"use server";

import { createCategory } from "@/server/categories/create-category";
import { deleteCategory } from "@/server/categories/delete-category";
import { updateCategory } from "@/server/categories/update-category";
import { getTranslations } from "next-intl/server";
import { getCategoryActionErrorKey } from "./action-errors";

export type CategoryActionState = { error?: string; success?: string };
export type CreateCategoryState = CategoryActionState & { id?: number };

export async function createCategoryAction(
  _previousState: CreateCategoryState,
  formData: FormData,
): Promise<CreateCategoryState> {
  const t = await getTranslations("organization.actions.categories");
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || typeof description !== "string") {
    return { error: t("invalidData") };
  }

  try {
    const category = await createCategory({ name, description });
    return { id: category.id, success: t("created") };
  } catch (error) {
    return { error: t(getCategoryActionErrorKey(error) ?? "createFailed") };
  }
}

export async function updateCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const t = await getTranslations("organization.actions.categories");
  const id = Number(formData.get("id"));
  const name = formData.get("name");
  const description = formData.get("description");
  if (
    !Number.isInteger(id) ||
    typeof name !== "string" ||
    typeof description !== "string"
  ) {
    return { error: t("invalidData") };
  }

  try {
    await updateCategory({ id, name, description });
    return { success: t("updated") };
  } catch (error) {
    return { error: t(getCategoryActionErrorKey(error) ?? "updateFailed") };
  }
}

export async function deleteCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const t = await getTranslations("organization.actions.categories");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: t("invalidId") };
  }

  try {
    await deleteCategory(id);
    return { success: t("deleted") };
  } catch (error) {
    return { error: t(getCategoryActionErrorKey(error) ?? "deleteFailed") };
  }
}
