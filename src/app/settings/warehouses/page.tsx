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

export const instant = false;

export default async function WarehousesSettingsPage() {
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
      <AppHeader sectionLabel="Zarządzanie magazynami" />
      <section className="page-shell">
        <p className="page-kicker">Magazyny</p>
        <h1 className="page-title">Zarządzanie magazynami</h1>
        <p className="page-description max-w-2xl">
          Lista zawiera wyłącznie magazyny dostępne dla Twojego konta.
        </p>

        {isAdmin ? (
          <section className="panel-card mt-8 p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Utwórz magazyn</h2>
            <p className="mt-2 text-sm text-app-muted">
              Nowy magazyn będzie dostępny administratorom. Dostęp pozostałych
              użytkowników nadajesz osobno.
            </p>
            <div className="mt-5">
              <WarehouseForm />
            </div>
          </section>
        ) : null}

        <section className="panel-card mt-8 overflow-hidden">
          <div className="border-b border-app-border p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              {isAdmin ? "Wszystkie magazyny" : "Magazyny z dostępem"}
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
                ? "W tej instancji nie utworzono jeszcze magazynu."
                : "Nie masz przypisanego dostępu do żadnego magazynu."}
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
                        Aktywny magazyn
                      </p>
                    ) : null}
                  </div>
                  {isAdmin ? (
                    <div className="sm:w-72">
                      {warehouses.length === 1 ? (
                        <p className="text-xs text-app-muted">
                          Nie można usunąć ostatniego magazynu.
                        </p>
                      ) : null}
                      <DeleteWarehouseForm
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
            data={accessManagement}
            currentUserId={currentWarehouse!.user.id}
            isAdmin={isAdmin}
          />
        ) : currentWarehouse && !isAdmin ? (
          <section className="panel-card mt-8 p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Dostęp użytkowników</h2>
            <p className="mt-2 text-sm text-app-muted">
              Zarządzanie dostępem jest dostępne dla menedżerów tego magazynu.
            </p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
