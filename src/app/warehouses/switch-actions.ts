"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { shouldUseSecureCookies } from "@/lib/cookie-security";
import {
  ACTIVE_WAREHOUSE_COOKIE,
  listAccessibleWarehouses,
} from "@/server/warehouses/current-warehouse";

export type SwitchWarehouseState = { error?: string };

export async function switchWarehouseAction(
  _previous: SwitchWarehouseState,
  formData: FormData,
): Promise<SwitchWarehouseState> {
  const t = await getTranslations("admin");
  const warehouseId = formData.get("warehouseId");
  if (typeof warehouseId !== "string") return { error: t("actions.errors.invalidWarehouse") };
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const warehouse = (await listAccessibleWarehouses()).find(({ id }) => id === warehouseId);
  if (!warehouse) return { error: t("actions.errors.noWarehouseAccess") };
  (await cookies()).set(ACTIVE_WAREHOUSE_COOKIE, warehouseId, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  redirect("/dashboard");
}
