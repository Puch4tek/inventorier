"use server";

import { deleteLocation } from "@/server/locations/delete-location";
import { updateLocation } from "@/server/locations/update-location";
import { getTranslations } from "next-intl/server";
import { getLocationActionErrorKey } from "../action-errors";

export type LocationActionState = {
  error?: string;
  success?: string;
};

export async function updateLocationAction(
  _previousState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const t = await getTranslations("organization.actions.locations");
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
    return { error: t("invalidData") };
  }

  const id = Number(idValue);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: t("invalidId") };
  }

  let parentId: number | null = null;
  if (parentIdValue.trim()) {
    parentId = Number(parentIdValue);
    if (!Number.isInteger(parentId) || parentId <= 0) {
      return { error: t("invalidParent") };
    }
  }

  try {
    await updateLocation({ id, name, description, parentId });
    return { success: t("updated") };
  } catch (error) {
    return {
      error: t(getLocationActionErrorKey(error) ?? "updateFailed"),
    };
  }
}

export async function deleteLocationAction(
  _previousState: LocationActionState,
  formData: FormData,
): Promise<LocationActionState> {
  const t = await getTranslations("organization.actions.locations");
  const idValue = formData.get("id");
  const id = typeof idValue === "string" ? Number(idValue) : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return { error: t("invalidId") };
  }

  try {
    await deleteLocation(id);
    return { success: t("deleted") };
  } catch (error) {
    return {
      error: t(getLocationActionErrorKey(error) ?? "deleteFailed"),
    };
  }
}
