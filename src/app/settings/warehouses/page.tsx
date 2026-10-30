import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import {
  getCurrentWarehouse,
  listAccessibleWarehouses,
} from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { getWarehouseAccessManagement } from "@/server/warehouses/manage-warehouses";
import { DeleteWarehouseForm } from "@/app/warehouses/delete-warehouse-form";
import { WarehouseAccessManagement } from "@/app/warehouses/warehouse-access-management";
import { WarehouseForm } from "@/app/warehouses/warehouse-form";
import { WarehouseSwitcher } from "@/components/warehouse-switcher";
import { getLocale, getTranslations } from "next-intl/server";

export const instant = false;

export default async function WarehousesSettingsPage() {
  const [t, locale] = await Promise.all([
    getTranslations("admin.warehousesPage"),
    getLocale(),
  ]);
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [warehouses, currentWarehouse] = await Promise.all([
    listAccessibleWarehouses(),
    getCurrentWarehouse(),
  ]);
  const isAdmin = user?.role === "ADMIN";
  const canManageCurrentWarehouse = currentWarehouse
    ? canManageWarehouseData(currentWarehouse)
    : isAdmin;
  const accessManagement =
    currentWarehouse && canManageCurrentWarehouse
      ? await getWarehouseAccessManagement(currentWarehouse.warehouse.id)
      : null;

  return (
    <main className="app-shell">
      <AppHeader sectionLabel={t("title")} />
      <section className="page-shell">
        <p className="page-kicker">{t("section")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-description max-w-2xl">{t("description")}</p>

        {isAdmin ? (
          <section className="panel-card mt-8 p-5 sm:p-6">
            <h2 className="text-xl font-semibold">{t("createTitle")}</h2>
            <p className="mt-2 text-sm text-app-muted">
              {t("createDescription")}
            </p>
            <div className="mt-5">
              <WarehouseForm key={locale} />
            </div>
          </section>
        ) : null}

        <section className="panel-card mt-8 overflow-hidden">
          <div className="border-b border-app-border p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              {isAdmin ? t("allWarehouses") : t("accessibleWarehouses")}
            </h2>
            {warehouses.length > 1 ? (
              <div className="mt-4 max-w-sm">
                <WarehouseSwitcher
                  warehouses={warehouses}
                  activeId={currentWarehouse?.warehouse.id}
                />
              </div>
            ) : null}
          </div>
          {warehouses.length === 0 ? (
            <p className="p-5 text-sm text-app-muted">
              {isAdmin
                ? t("noWarehouses")
                : t("noAssignedWarehouses")}
            </p>
          ) : (
            <div className="divide-y divide-app-border">
              {warehouses.map((warehouse) => (
                <article
                  key={warehouse.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{warehouse.name}</p>
                    <p className="mt-1 text-sm text-app-muted">{warehouse.slug}</p>
                    {currentWarehouse?.warehouse.id === warehouse.id ? (
                      <p className="mt-2 text-xs font-medium text-app-success">
                        {t("activeWarehouse")}
                      </p>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <div className="sm:w-72">
                      {warehouses.length === 1 ? (
                        <p className="text-xs text-app-muted">
                          {t("lastWarehouseCannotDelete")}
                        </p>
                      ) : null}
                      <DeleteWarehouseForm
                        key={locale}
                        warehouseId={warehouse.id}
                        warehouseName={warehouse.name}
                        disabled={warehouses.length === 1}
                      />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        {accessManagement ? (
          <WarehouseAccessManagement
            key={locale}
            data={accessManagement}
            currentUserId={currentWarehouse!.user.id}
            isAdmin={isAdmin}
          />
        ) : currentWarehouse && !isAdmin ? (
          <section className="panel-card mt-8 p-5 sm:p-6">
            <h2 className="text-xl font-semibold">{t("accessTitle")}</h2>
            <p className="mt-2 text-sm text-app-muted">
              {t("managerAccessDescription")}
            </p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
