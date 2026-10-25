"use server";

import { deleteLocation } from "@/server/locations/delete-location";
import { updateLocation } from "@/server/locations/update-location";
import { requireRole } from "@/server/auth/permissions";

export type LocationActionState = {
  error?: string;
  success?: string;
};

export async function updateLocationAction(
  _previousState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  try {
    await requireRole("MANAGER");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Brak uprawnień." };
  }
  const idValue = formData.get("id");
  const name = formData.get("name");
  const description = formData.get("description");
  const parentIdValue = formData.get("parentId");

  if (
    typeof idValue !== "string" ||
    typeof name !== "string" ||
    typeof description !== "string" ||
    typeof parentIdValue !== "string"
  ) {
    return { error: "Nieprawidłowe dane lokalizacji." };
  }

  const id = Number(idValue);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Nieprawidłowe ID lokalizacji." };
  }

  let parentId: number | null = null;
  if (parentIdValue.trim()) {
    parentId = Number(parentIdValue);
    if (!Number.isInteger(parentId) || parentId <= 0) {
      return { error: "Nieprawidłowa lokalizacja nadrzędna." };
    }
  }

  try {
    await updateLocation({ id, name, description, parentId });
    return { success: "Lokalizacja została zaktualizowana." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się zaktualizować lokalizacji.",
    };
  }
}

export async function deleteLocationAction(
  _previousState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  try {
    await requireRole("MANAGER");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Brak uprawnień." };
  }
  const idValue = formData.get("id");
  const id = typeof idValue === "string" ? Number(idValue) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Nieprawidłowe ID lokalizacji." };
  }

  try {
    await deleteLocation(id);
    return { success: "Lokalizacja została usunięta." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć lokalizacji.",
    };
  }
}
