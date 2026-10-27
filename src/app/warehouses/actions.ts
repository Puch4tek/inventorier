"use server";

import { revalidatePath } from "next/cache";
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
  const name = formData.get("name");
  if (typeof name !== "string") return { error: "Podaj nazwę magazynu." };
  try {
    await createWarehouse(name);
    revalidatePath("/settings/warehouses");
    return { success: "Magazyn został utworzony." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się utworzyć magazynu." };
  }
}

export async function deleteWarehouseAction(formData: FormData) {
  const warehouseId = formData.get("warehouseId");
  const confirmationName = formData.get("confirmationName");
  if (typeof warehouseId !== "string" || typeof confirmationName !== "string") {
    throw new Error("Nieprawidłowe dane usuwania magazynu.");
  }
  await deleteWarehouse(warehouseId, confirmationName);
  revalidatePath("/settings/warehouses");
  revalidatePath("/dashboard");
}

export async function setWarehouseMemberRoleAction(
  _previous: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  const warehouseId = formData.get("warehouseId");
  const userId = formData.get("userId");
  const role = formData.get("role");
  if (
    typeof warehouseId !== "string" ||
    typeof userId !== "string" ||
    (role !== "USER" && role !== "MANAGER")
  ) {
    return { error: "Nieprawidłowe dane przypisania." };
  }
  try {
    await setWarehouseMemberRole(warehouseId, userId, role);
    revalidatePath("/settings/warehouses");
    revalidatePath("/admin");
    return { success: "Dostęp do magazynu został zaktualizowany." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się zmienić dostępu." };
  }
}

export async function removeWarehouseMemberAction(
  _previous: WarehouseActionState,
  formData: FormData,
): Promise<WarehouseActionState> {
  const warehouseId = formData.get("warehouseId");
  const userId = formData.get("userId");
  if (typeof warehouseId !== "string" || typeof userId !== "string") {
    return { error: "Nieprawidłowe dane przypisania." };
  }
  try {
    await removeWarehouseMember(warehouseId, userId);
    revalidatePath("/settings/warehouses");
    revalidatePath("/admin");
    return { success: "Dostęp do magazynu został odebrany." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nie udało się odebrać dostępu." };
  }
}
