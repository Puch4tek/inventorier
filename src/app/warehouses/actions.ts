"use server";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { getAdminActionError } from "@/i18n/admin-errors";
import {
  createWarehouse,
  deleteWarehouse,
  removeWarehouseMember,
  setWarehouseMemberRole,
} from "@/server/warehouses/manage-warehouses";

export type WarehouseActionState = { error?: string; success?: string };

export async function createWarehouseAction(
  _previous: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const name = formData.get("name");
  if (typeof name !== "string") return { error: t("actions.errors.invalidWarehouse") };
  try {
    await createWarehouse(name);
    revalidatePath("/settings/warehouses");
    return { success: t("actions.success.warehouseCreated") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "createWarehouse") };
  }
}

export async function deleteWarehouseAction(
  formData: FormData,
): Promise<WarehouseActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const warehouseId = formData.get("warehouseId");
  const confirmationName = formData.get("confirmationName");
  if (typeof warehouseId !== "string" || typeof confirmationName !== "string") {
    return { error: t("actions.errors.invalidWarehouse") };
  }
  try {
    await deleteWarehouse(warehouseId, confirmationName);
    revalidatePath("/settings/warehouses");
    revalidatePath("/dashboard");
    return { success: t("actions.success.warehouseDeleted") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "deleteWarehouse") };
  }
}

export async function setWarehouseMemberRoleAction(
  _previous: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const warehouseId = formData.get("warehouseId");
  const userId = formData.get("userId");
  const role = formData.get("role");
  if (
    typeof warehouseId !== "string" ||
    typeof userId !== "string" ||
    (role !== "USER" && role !== "MANAGER")
  ) {
    return { error: t("actions.errors.invalidAssignment") };
  }
  try {
    await setWarehouseMemberRole(warehouseId, userId, role);
    revalidatePath("/settings/warehouses");
    revalidatePath("/admin");
    return { success: t("actions.success.warehouseAccessUpdated") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "changeWarehouseAccess") };
  }
}

export async function removeWarehouseMemberAction(
  _previous: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  const t = await getTranslations("admin");
  const locale = await getLocale();
  const warehouseId = formData.get("warehouseId");
  const userId = formData.get("userId");
  if (typeof warehouseId !== "string" || typeof userId !== "string") {
    return { error: t("actions.errors.invalidAssignment") };
  }
  try {
    await removeWarehouseMember(warehouseId, userId);
    revalidatePath("/settings/warehouses");
    revalidatePath("/admin");
    return { success: t("actions.success.warehouseAccessRemoved") };
  } catch (error) {
    return { error: getAdminActionError(error, locale, "removeWarehouseAccess") };
  }
}
