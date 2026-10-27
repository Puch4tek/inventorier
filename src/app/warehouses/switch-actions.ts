"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import {
  ACTIVE_WAREHOUSE_COOKIE,
  listAccessibleWarehouses,
} from "@/server/warehouses/current-warehouse";

export type SwitchWarehouseState = { error?: string };

export async function switchWarehouseAction(
  _previous: SwitchWarehouseState,
  formData: FormData,
): Promise<SwitchWarehouseState> {
  const warehouseId = formData.get("warehouseId");
  if (typeof warehouseId !== "string") return { error: "Nieprawidłowy magazyn." };
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const warehouse = (await listAccessibleWarehouses()).find(({ id }) => id === warehouseId);
  if (!warehouse) return { error: "Nie masz dostępu do tego magazynu." };
  (await cookies()).set(ACTIVE_WAREHOUSE_COOKIE, warehouseId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/dashboard");
}
