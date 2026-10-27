"use server";

import { createCategory } from "@/server/categories/create-category";
import { deleteCategory } from "@/server/categories/delete-category";
import { updateCategory } from "@/server/categories/update-category";

export type CategoryActionState = { error?: string; success?: string };
export type CreateCategoryState = CategoryActionState & { id?: number };

export async function createCategoryAction(
  _previousState: CreateCategoryState,
  formData: FormData,
): Promise<CreateCategoryState> {
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || typeof description !== "string") {
    return { error: "Nieprawidłowe dane kategorii." };
  }

  try {
    const category = await createCategory({ name, description });
    return { id: category.id, success: "Kategoria została utworzona." };
  } catch (error) {
    return toError(error, "Nie udało się utworzyć kategorii.");
  }
}

export async function updateCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = Number(formData.get("id"));
  const name = formData.get("name");
  const description = formData.get("description");
  if (
    !Number.isInteger(id) ||
    typeof name !== "string" ||
    typeof description !== "string"
  ) {
    return { error: "Nieprawidłowe dane kategorii." };
  }

  try {
    await updateCategory({ id, name, description });
    return { success: "Kategoria została zaktualizowana." };
  } catch (error) {
    return toError(error, "Nie udało się zaktualizować kategorii.");
  }
}

export async function deleteCategoryAction(
  _previousState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Nieprawidłowe ID kategorii." };
  }

  try {
    await deleteCategory(id);
    return { success: "Kategoria została usunięta." };
  } catch (error) {
    return toError(error, "Nie udało się usunąć kategorii.");
  }
}

function toError(error: unknown, fallback: string): { error: string } {
  return { error: error instanceof Error ? error.message : fallback };
}
